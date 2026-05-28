import { useCallback, useEffect, useRef, useState } from 'react';
import type { InputMap, Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { classifyGesture } from '../utils/gestureClassifier';
import { useCamera } from '../camera/useCamera';

interface WebcamPanelProps {
  onGestureDetected: (gesture: string, confidence: number) => void;
}

const MEDIAPIPE_HANDS_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/';
const MEDIAPIPE_HANDS_SCRIPT_ID = 'mediapipe-hands-cdn-script';
const LOCAL_MEDIAPIPE_HANDS_BASE = new URL('./mediapipe/hands/', window.location.href).toString();
const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];

type MediaPipeHandsInstance = {
  close: () => Promise<void>;
  initialize: () => Promise<void>;
  onResults: (callback: (results: Results) => void) => void;
  send: (inputs: InputMap) => Promise<void>;
  setOptions: (options: {
    maxNumHands?: number;
    modelComplexity?: 0 | 1;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    selfieMode?: boolean;
  }) => void;
};

type MediaPipeHandsConstructor = new (options: {
  locateFile?: (file: string) => string;
}) => MediaPipeHandsInstance;

declare global {
  interface Window {
    Hands?: MediaPipeHandsConstructor;
    VERSION?: string;
  }
}

function loadScript(src: string, id?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = id ? document.getElementById(id) as HTMLScriptElement | null : null;
    if (existingScript?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    if (id) script.id = id;

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });

    script.addEventListener('error', () => {
      reject(new Error(`Failed to load MediaPipe script: ${src}`));
    }, { once: true });

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });
}

async function debugAsset(baseUrl: string, file: string) {
  const url = `${baseUrl}${file}`;
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    console.debug('[MediaPipe Hands] asset check:', file, response.status, url);
  } catch (error) {
    console.warn('[MediaPipe Hands] asset check failed:', file, url, error);
  }
}

async function loadMediaPipeHands() {
  console.debug('[MediaPipe Hands] before load:', {
    handsType: typeof window.Hands,
    version: window.VERSION,
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    host: window.location.host,
  });

  if (typeof window.Hands !== 'function') {
    try {
      await loadScript(`${MEDIAPIPE_HANDS_CDN_BASE}hands.js`, MEDIAPIPE_HANDS_SCRIPT_ID);
    } catch (cdnError) {
      console.warn('[MediaPipe Hands] CDN load failed, trying local fallback:', cdnError);
      await loadScript(`${LOCAL_MEDIAPIPE_HANDS_BASE}hands.js`);
    }
  }

  console.debug('[MediaPipe Hands] after load:', {
    handsType: typeof window.Hands,
    version: window.VERSION,
  });

  if (typeof window.Hands !== 'function') {
    throw new Error('MediaPipe Hands constructor was not loaded. Check CDN access and Firebase asset paths.');
  }

  await Promise.all([
    debugAsset(MEDIAPIPE_HANDS_CDN_BASE, 'hands_solution_wasm_bin.wasm'),
    debugAsset(MEDIAPIPE_HANDS_CDN_BASE, 'hands_solution_simd_wasm_bin.wasm'),
    debugAsset(MEDIAPIPE_HANDS_CDN_BASE, 'hands.binarypb'),
  ]);

  return {
    Hands: window.Hands,
    assetBase: MEDIAPIPE_HANDS_CDN_BASE,
  };
}

export default function WebcamPanel({ onGestureDetected }: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<MediaPipeHandsInstance | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const processingErrorCountRef = useRef(0);
  const { isReady, isStarting, error: cameraError, permission, startCamera, stopCamera } =
    useCamera(videoRef);

  const stopFrameLoop = useCallback(() => {
    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }
  }, []);

  const runDetectionLoop = useCallback(() => {
    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        !video ||
        !canvas ||
        !handsRef.current ||
        video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        frameRequestRef.current = requestAnimationFrame(() => {
          void tick();
        });
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.debug('[MediaPipe Hands] canvas resized:', {
          width: canvas.width,
          height: canvas.height,
        });
      }

      try {
        await handsRef.current.send({ image: video });
        processingErrorCountRef.current = 0;
      } catch (processingError) {
        console.error('Hand tracking error:', processingError);
        processingErrorCountRef.current += 1;

        const message =
          processingError instanceof Error
            ? processingError.message
            : String(processingError);

        if (processingErrorCountRef.current >= 3) {
          setError(`Camera started, but hand tracking could not process the video stream: ${message}`);
          return;
        }
      }

      frameRequestRef.current = requestAnimationFrame(() => {
        void tick();
      });
    };

    stopFrameLoop();
    frameRequestRef.current = requestAnimationFrame(() => {
      void tick();
    });
  }, [stopFrameLoop]);

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    stopFrameLoop();
    stopCamera();
    handsRef.current?.close();
    handsRef.current = null;

    setIsModelLoading(true);
    setError(null);

    try {
      const stream = await startCamera();
      if (!stream) {
        return;
      }

      const { Hands, assetBase } = await loadMediaPipeHands();
      console.debug('[MediaPipe Hands] asset base:', assetBase);

      const hands = new Hands({
        locateFile: (file) => {
          const url = `${assetBase}${file}`;
          console.debug('[MediaPipe Hands] locateFile:', file, url);
          return url;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: Results) => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
              color: '#14b8a6',
              lineWidth: 2,
            });
            drawLandmarks(ctx, landmarks, {
              color: '#ffffff',
              lineWidth: 1,
              radius: 3,
            });

            const result = classifyGesture(landmarks);
            onGestureDetected(result.gesture, result.confidence);
          } else {
            onGestureDetected('', 0);
          }
        } catch (renderError) {
          console.error('[MediaPipe Hands] result rendering/classification error:', renderError);
          onGestureDetected('', 0);
        }
      });

      await hands.initialize();
      console.debug('[MediaPipe Hands] initialized successfully');
      handsRef.current = hands;
      processingErrorCountRef.current = 0;
      runDetectionLoop();
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error in startDetection:', err);
      stopCamera();
      handsRef.current?.close();
      handsRef.current = null;
      setError(
        err?.message
          ? `Could not start hand detection: ${err.message}`
          : 'Could not start hand detection. Please refresh and try again.'
      );
    } finally {
      setIsModelLoading(false);
    }
  };

  const stopDetection = () => {
    stopFrameLoop();
    handsRef.current?.close();
    handsRef.current = null;
    stopCamera();
    setError(null);
    onGestureDetected('', 0);
  };

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  useEffect(() => {
    if (cameraError) {
      setError(cameraError);
    }
  }, [cameraError]);

  const isBusy = isStarting || isModelLoading;
  const statusMessage =
    error ||
    (permission === 'denied'
      ? 'Camera access is blocked in browser settings. Allow access and click Start Camera again.'
      : null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Live Camera</h2>
        <button
          onClick={isReady ? stopDetection : startDetection}
          disabled={isBusy}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isReady
              ? 'bg-destructive text-white hover:bg-destructive/80'
              : 'bg-primary text-white hover:bg-primary/80'
          }`}
        >
          {isBusy ? 'Starting camera...' : isReady ? 'Stop' : 'Start Camera'}
        </button>
      </div>

      {statusMessage && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-2">
          <p className="text-destructive text-sm">{statusMessage}</p>
        </div>
      )}

      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover bg-black"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        {!isReady && !isBusy && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Camera is off. Click Start Camera to allow access.</p>
          </div>
        )}
        {isBusy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-white text-sm">Requesting permission and starting camera...</p>
          </div>
        )}
      </div>
    </div>
  );
}
