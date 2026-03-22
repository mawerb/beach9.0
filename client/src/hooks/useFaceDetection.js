import { useEffect, useRef } from 'react';
import { useARStore } from '../stores/arStore';

/**
 * Same-origin models (copied by `npm install` → postinstall).
 * Avoids jsDelivr fetches that can hang indefinitely with no console error.
 */
const MODEL_BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
const MODEL_URI = `${MODEL_BASE}/face-models`;

/** Fallback if public/face-models missing (e.g. skipped postinstall) */
const MODEL_CDN_FALLBACK =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const INIT_TIMEOUT_MS = 90_000;

const DETECT_INTERVAL_MS = 150;
const FACE_LOST_TIMEOUT_MS = 1500;

const MAR_CALIBRATION_FRAMES = 25;
const MAR_OPEN_MULTIPLIER = 1.5;
const MAR_MIN_THRESHOLD = 0.18;
const MAR_MAX_RESTING_SAMPLE = 0.35;

let _initPromise = null;

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${Math.round(ms / 1000)}s (network or TensorFlow backend stuck)`,
          ),
        ),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

async function initFaceApi() {
  if (_initPromise) return _initPromise;

  const run = async () => {
    console.info('[face-api] importing @vladmandic/face-api…');
    const mod = await import('@vladmandic/face-api');
    const faceapi = mod.default ?? mod;

    if (!faceapi?.nets?.tinyFaceDetector) {
      throw new Error('face-api: invalid module shape (missing nets)');
    }

    const tf = faceapi.tf ?? mod.tf;
    if (tf?.ready) {
      console.info('[face-api] waiting for TensorFlow backend…');
      await tf.ready();
    }

    async function loadModels(baseUri) {
      console.info('[face-api] loading model weights from', baseUri);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(baseUri),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(baseUri),
        faceapi.nets.faceRecognitionNet.loadFromUri(baseUri),
      ]);
    }

    try {
      await loadModels(MODEL_URI);
    } catch (firstErr) {
      console.warn(
        '[face-api] local models failed, trying CDN fallback…',
        firstErr,
      );
      await loadModels(MODEL_CDN_FALLBACK);
    }

    console.info('[face-api] init complete');
    return faceapi;
  };

  _initPromise = withTimeout(run(), INIT_TIMEOUT_MS, 'Face detection').catch(
    (err) => {
      _initPromise = null;
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : typeof err === 'object' && err !== null && 'type' in err
              ? `Load error (${err.type})`
              : String(err);
      console.warn('face-api init failed:', msg, err);
      throw err instanceof Error ? err : new Error(msg);
    },
  );

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

  // Latest callbacks without restarting RAF when parent re-renders (fixes stuck wasTracking + no matchFace).
  const callbacksRef = useRef({ onFaceUpdate, onFaceDetected, onFaceLost });
  callbacksRef.current = { onFaceUpdate, onFaceDetected, onFaceLost };

  useEffect(() => {
    let cancelled = false;
    const setEngine = useARStore.getState().setFaceEngineState;

    setEngine({ status: 'loading', error: null });

    initFaceApi()
      .then((faceapi) => {
        if (cancelled) return;
        faceapiRef.current = faceapi;
        setEngine({ status: 'ready', error: null });
        console.log('face-api ready (128-dim descriptors + MAR)');
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('face-api init failed:', err);
        if (!cancelled) {
          setEngine({
            status: 'error',
            error: msg || 'Could not load face detection. Check network / ad blockers.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
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
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
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
              callbacksRef.current.onFaceDetected?.(face, descriptor, confidence, mouthOpen);
            }

            callbacksRef.current.onFaceUpdate?.(face, descriptor, confidence, mouthOpen);
          } else {
            const elapsed = performance.now() - lastFaceTime.current;
            if (wasTracking.current && elapsed > FACE_LOST_TIMEOUT_MS) {
              wasTracking.current = false;
              mouthOpenRef.current = false;
              marSamples.current = [];
              marThreshold.current = null;
              callbacksRef.current.onFaceLost?.();
            }
          }
        })
        .catch((err) => {
          detectingRef.current = false;
          console.warn('face detection frame failed:', err);
        });
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef]);

  return { mouthOpenRef };
}
