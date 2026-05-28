import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraPermissionState = PermissionState | 'unknown' | 'unsupported';

export interface CameraState {
  isReady: boolean;
  isStarting: boolean;
  error: string | null;
  permission: CameraPermissionState;
}

function isLocalhostHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

function getCameraErrorMessage(error: unknown) {
  console.error('Camera startup failed:', error);

  if (!(error instanceof DOMException)) {
    return 'Could not start camera. Please try again.';
  }

  switch (error.name) {
    case 'NotAllowedError':
      return 'Camera permission denied. Please allow camera access in your browser settings and retry.';
    case 'NotFoundError':
      return 'No camera found on this device. Please connect a camera and try again.';
    case 'NotReadableError':
      return 'Camera is already in use by another application. Close other apps using the camera and retry.';
    case 'OverconstrainedError':
      return 'The selected camera does not support the requested video settings.';
    case 'AbortError':
      return 'Camera startup was interrupted. Please try again.';
    case 'SecurityError':
      return 'Camera access is blocked by the browser security context. Open the deployed app on Firebase HTTPS and make sure camera permission is allowed.';
    default:
      return error.message || 'Could not start camera. Please try again.';
  }
}

async function getPermissionState(): Promise<CameraPermissionState> {
  if (!('permissions' in navigator) || !navigator.permissions?.query) {
    return 'unsupported';
  }

  try {
    const status = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>({
    isReady: false,
    isStarting: false,
    error: null,
    permission: 'unknown',
  });
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  const stopCamera = useCallback(() => {
    stopStream();

    setState((prev) => ({
      ...prev,
      isReady: false,
      isStarting: false,
    }));
  }, [stopStream]);

  const refreshPermission = useCallback(async () => {
    const permission = await getPermissionState();
    setState((prev) => ({ ...prev, permission }));
    return permission;
  }, []);

  const startCamera = useCallback(async () => {
    console.log('Camera secure context:', window.isSecureContext);
    console.log('Camera mediaDevices:', navigator.mediaDevices);

    if (!navigator.mediaDevices?.getUserMedia) {
      setState({
        isReady: false,
        isStarting: false,
        permission: 'unsupported',
        error: 'Camera API is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.',
      });
      return null;
    }

    const isSecureOrigin =
      window.isSecureContext ||
      window.location.protocol === 'https:' ||
      isLocalhostHost(window.location.hostname);

    if (!isSecureOrigin) {
      setState((prev) => ({
        ...prev,
        isReady: false,
        isStarting: false,
        error: 'Camera access requires HTTPS or localhost. Open this app on a secure origin and try again.',
      }));
      return null;
    }

    stopStream();

    setState((prev) => ({
      ...prev,
      isStarting: true,
      error: null,
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new DOMException('Video element is not available.', 'AbortError');
      }

      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;

      streamRef.current = stream;

      await video.play();

      const permission = await refreshPermission();
      setState({
        isReady: true,
        isStarting: false,
        permission,
        error: null,
      });

      return stream;
    } catch (error) {
      stopStream();
      const permission = await refreshPermission();
      setState({
        isReady: false,
        isStarting: false,
        permission,
        error: getCameraErrorMessage(error),
      });
      return null;
    }
  }, [refreshPermission, stopStream, videoRef]);

  useEffect(() => {
    console.log('Camera debug - window.isSecureContext:', window.isSecureContext);
    console.log('Camera debug - navigator.mediaDevices:', navigator.mediaDevices);
    refreshPermission();
  }, [refreshPermission]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    ...state,
    startCamera,
    stopCamera,
    streamRef,
  };
}
