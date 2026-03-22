import { useEffect, useRef } from 'react';

const VISION_BUNDLE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/vision_bundle.mjs';
const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm';
const LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const DETECT_INTERVAL_MS = 80;
const FACE_LOST_TIMEOUT_MS = 1500;

let _landmarkerPromise = null;

async function getLandmarker() {
  if (_landmarkerPromise) return _landmarkerPromise;

  _landmarkerPromise = (async () => {
    const loadModule = new Function('url', 'return import(url)');
    const vision = await loadModule(VISION_BUNDLE);
    const { FaceLandmarker, FilesetResolver } = vision;

    const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
    return FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: LANDMARKER_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  })();

  return _landmarkerPromise;
}

function landmarksToBBox(landmarks, vw, vh) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of landmarks) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  const pad = 0.04;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(1, maxX + pad);
  maxY = Math.min(1, maxY + pad);

  return {
    x: 1 - maxX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function flattenLandmarks(landmarks) {
  const flat = new Array(landmarks.length * 3);
  for (let i = 0; i < landmarks.length; i++) {
    flat[i * 3] = landmarks[i].x;
    flat[i * 3 + 1] = landmarks[i].y;
    flat[i * 3 + 2] = landmarks[i].z;
  }
  return flat;
}

/**
 * Callbacks receive (face, landmarks, confidence):
 *   face      – normalised bounding box {x, y, width, height} (mirrored)
 *   landmarks – flat Float64 array of 1434 values (478 x 3)
 *   confidence – 0-1
 */
export default function useFaceDetection(videoRef, { onFaceUpdate, onFaceDetected, onFaceLost }) {
  const rafRef = useRef(null);
  const lastDetectTime = useRef(0);
  const lastFaceTime = useRef(0);
  const wasTracking = useRef(false);
  const landmarkerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getLandmarker()
      .then((lm) => {
        if (!cancelled) {
          landmarkerRef.current = lm;
          console.log('FaceLandmarker ready (478 landmarks)');
        }
      })
      .catch((err) => console.warn('FaceLandmarker init failed:', err));

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastDetectTime.current < DETECT_INTERVAL_MS) return;
      lastDetectTime.current = now;

      let result;
      try {
        result = landmarker.detectForVideo(video, now);
      } catch {
        return;
      }

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const rawLandmarks = result.faceLandmarks[0];
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;

        const face = landmarksToBBox(rawLandmarks, vw, vh);
        const flat = flattenLandmarks(rawLandmarks);
        const confidence = 0.92;

        lastFaceTime.current = now;

        if (!wasTracking.current) {
          wasTracking.current = true;
          onFaceDetected?.(face, flat, confidence);
        }

        onFaceUpdate?.(face, flat, confidence);
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
