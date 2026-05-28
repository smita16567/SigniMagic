// App.jsx
import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [gesture, setGesture] = useState("No Hand Detected");

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    }
  }, []);

  // TEXT TO SPEECH
  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  // HAND RESULTS
  const onResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // THUMB TIP
      const thumbTip = landmarks[4];

      // INDEX TIP
      const indexTip = landmarks[8];

      // WRIST
      const wrist = landmarks[0];

      let detectedGesture = "";

      // SIMPLE GESTURE CONDITIONS

      // HELLO → Open Hand
      if (indexTip.y < wrist.y && thumbTip.x < wrist.x) {
        detectedGesture = "Hello";
      }

      // GOOD → Thumb Up
      else if (thumbTip.y < indexTip.y) {
        detectedGesture = "Good";
      }

      // STOP → Fist
      else if (indexTip.y > wrist.y) {
        detectedGesture = "Stop";
      }

      if (detectedGesture !== "") {
        setGesture(detectedGesture);
        speakText(detectedGesture);
      }

      // DRAW POINTS
      landmarks.forEach((point) => {
        canvasCtx.beginPath();
        canvasCtx.arc(
          point.x * canvasElement.width,
          point.y * canvasElement.height,
          5,
          0,
          2 * Math.PI
        );
        canvasCtx.fillStyle = "red";
        canvasCtx.fill();
      });
    } else {
      setGesture("No Hand Detected");
    }

    canvasCtx.restore();
  };

  return (
    <div className="container">
      <h1>Sign To Speech Module</h1>

      <div className="camera-container">
        <video ref={videoRef} className="video" hidden />

        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="canvas"
        />
      </div>

      <h2>Detected Sign:</h2>
      <div className="output">{gesture}</div>
    </div>
  );
}

export default App;