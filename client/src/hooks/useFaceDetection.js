import { useEffect, useRef } from 'react';

const FACE_API_CDN =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
const MODEL_CDN =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const DETECT_INTERVAL_MS = 150;
const FACE_LOST_TIMEOUT_MS = 1500;

const MAR_CALIBRATION_FRAMES = 25;
const MAR_OPEN_MULTIPLIER = 1.5;
const MAR_MIN_THRESHOLD = 0.18;
const MAR_MAX_RESTING_SAMPLE = 0.35;

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

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function computeMAR(landmarks) {
  const pts = landmarks.positions;
  const vertical = (dist(pts[61], pts[67]) + dist(pts[62], pts[66])) / 2;
  const horizontal = dist(pts[60], pts[64]);
  if (horizontal === 0) return 0;
  return vertical / horizontal;
}

/**
 * Callbacks receive (face, descriptor, confidence, mouthOpen):
 *   face       – normalised bounding box {x, y, width, height} (mirrored)
 *   descriptor – 128-element Float32 array (face-api.js face descriptor)
 *   confidence – 0-1 detection score
 *   mouthOpen  – boolean, true when detected person's mouth is open (MAR-based)
 */
export default function useFaceDetection(videoRef, { onFaceUpdate, onFaceDetected, onFaceLost }) {
  const rafRef = useRef(null);
  const lastDetectTime = useRef(0);
  const lastFaceTime = useRef(0);
  const wasTracking = useRef(false);
  const faceapiRef = useRef(null);
  const detectingRef = useRef(false);

  const marSamples = useRef([]);
  const marThreshold = useRef(null);
  const mouthOpenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    initFaceApi()
      .then((faceapi) => {
        if (!cancelled) {
          faceapiRef.current = faceapi;
          console.log('face-api.js ready (128-dim descriptors + MAR)');
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

            const mar = computeMAR(detection.landmarks);

            let mouthOpen = null;

            if (marThreshold.current === null) {
              if (mar < MAR_MAX_RESTING_SAMPLE) {
                marSamples.current.push(mar);
              }
              if (marSamples.current.length >= MAR_CALIBRATION_FRAMES) {
                const sorted = [...marSamples.current].sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                marThreshold.current = Math.max(
                  median * MAR_OPEN_MULTIPLIER,
                  MAR_MIN_THRESHOLD,
                );
                console.log(`MAR calibrated: median=${median.toFixed(3)}, threshold=${marThreshold.current.toFixed(3)}`);
              }
            }

            if (marThreshold.current !== null) {
              mouthOpen = mar > marThreshold.current;
            }
            mouthOpenRef.current = mouthOpen ?? false;

            lastFaceTime.current = performance.now();

            if (!wasTracking.current) {
              wasTracking.current = true;
              marSamples.current = [];
              marThreshold.current = null;
              onFaceDetected?.(face, descriptor, confidence, mouthOpen);
            }

            onFaceUpdate?.(face, descriptor, confidence, mouthOpen);
          } else {
            const elapsed = performance.now() - lastFaceTime.current;
            if (wasTracking.current && elapsed > FACE_LOST_TIMEOUT_MS) {
              wasTracking.current = false;
              mouthOpenRef.current = false;
              marSamples.current = [];
              marThreshold.current = null;
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

  return { mouthOpenRef };
}
