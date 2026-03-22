import { useEffect, useRef } from 'react';

const VISION_BUNDLE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/vision_bundle.mjs';
const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

const DETECT_INTERVAL_MS = 80;
const FACE_LOST_TIMEOUT_MS = 1500;

let _detectorPromise = null;

async function getDetector() {
  if (_detectorPromise) return _detectorPromise;

  _detectorPromise = (async () => {
    // Use new Function to bypass Vite's import() interception
    const loadModule = new Function('url', 'return import(url)');
    const vision = await loadModule(VISION_BUNDLE);
    const { FaceDetector, FilesetResolver } = vision;

    const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    });
  })();

  return _detectorPromise;
}

export default function useFaceDetection(videoRef, { onFaceUpdate, onFaceDetected, onFaceLost }) {
  const rafRef = useRef(null);
  const lastDetectTime = useRef(0);
  const lastFaceTime = useRef(0);
  const wasTracking = useRef(false);
  const detectorRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getDetector()
      .then((d) => {
        if (!cancelled) {
          detectorRef.current = d;
          console.log('Face detector ready');
        }
      })
      .catch((err) => console.warn('Face detection init failed:', err));

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastDetectTime.current < DETECT_INTERVAL_MS) return;
      lastDetectTime.current = now;

      let result;
      try {
        result = detector.detectForVideo(video, now);
      } catch {
        return;
      }

      if (result.detections && result.detections.length > 0) {
        const det = result.detections[0];
        const bb = det.boundingBox;
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (!vw || !vh) return;

        // Mirror X to match the CSS scaleX(-1) on the video
        const normalised = {
          x: 1 - (bb.originX + bb.width) / vw,
          y: bb.originY / vh,
          width: bb.width / vw,
          height: bb.height / vh,
        };

        const confidence = det.categories?.[0]?.score ?? 0.9;

        lastFaceTime.current = now;

        if (!wasTracking.current) {
          wasTracking.current = true;
          onFaceDetected?.(normalised, confidence);
        }

        onFaceUpdate?.(normalised, confidence);
      } else {
        if (wasTracking.current && now - lastFaceTime.current > FACE_LOST_TIMEOUT_MS) {
          wasTracking.current = false;
          onFaceLost?.();
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, onFaceUpdate, onFaceDetected, onFaceLost]);
}
