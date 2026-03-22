import { useEffect, useRef } from 'react';

const FACE_API_CDN =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
const MODEL_CDN =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const DETECT_INTERVAL_MS = 150;
const FACE_LOST_TIMEOUT_MS = 1500;

let _initPromise = null;

async function initFaceApi() {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    if (!window.faceapi) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = FACE_API_CDN;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const faceapi = window.faceapi;

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_CDN),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_CDN),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_CDN),
    ]);

    return faceapi;
  })();

  return _initPromise;
}

/**
 * Callbacks receive (face, descriptor, confidence):
 *   face       – normalised bounding box {x, y, width, height} (mirrored)
 *   descriptor – 128-element Float32 array (face-api.js face descriptor)
 *   confidence – 0-1 detection score
 */
export default function useFaceDetection(videoRef, { onFaceUpdate, onFaceDetected, onFaceLost }) {
  const rafRef = useRef(null);
  const lastDetectTime = useRef(0);
  const lastFaceTime = useRef(0);
  const wasTracking = useRef(false);
  const faceapiRef = useRef(null);
  const detectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    initFaceApi()
      .then((faceapi) => {
        if (!cancelled) {
          faceapiRef.current = faceapi;
          console.log('face-api.js ready (128-dim descriptors)');
        }
      })
      .catch((err) => console.warn('face-api.js init failed:', err));

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const faceapi = faceapiRef.current;
      if (!video || !faceapi || video.readyState < 2) return;
      if (detectingRef.current) return;

      const now = performance.now();
      if (now - lastDetectTime.current < DETECT_INTERVAL_MS) return;
      lastDetectTime.current = now;
      detectingRef.current = true;

      faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor()
        .then((detection) => {
          detectingRef.current = false;

          if (detection) {
            const box = detection.detection.box;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            if (!vw || !vh) return;

            const face = {
              x: 1 - (box.x + box.width) / vw,
              y: box.y / vh,
              width: box.width / vw,
              height: box.height / vh,
            };

            const descriptor = Array.from(detection.descriptor);
            const confidence = detection.detection.score;

            lastFaceTime.current = performance.now();

            if (!wasTracking.current) {
              wasTracking.current = true;
              onFaceDetected?.(face, descriptor, confidence);
            }

            onFaceUpdate?.(face, descriptor, confidence);
          } else {
            const elapsed = performance.now() - lastFaceTime.current;
            if (wasTracking.current && elapsed > FACE_LOST_TIMEOUT_MS) {
              wasTracking.current = false;
              onFaceLost?.();
            }
          }
        })
        .catch(() => {
          detectingRef.current = false;
        });
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, onFaceUpdate, onFaceDetected, onFaceLost]);
}
