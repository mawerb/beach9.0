"""
Face landmark normalization and matching.

Landmarks are 478 3D points from MediaPipe FaceLandmarker.
Normalized (centered on nose, scaled by inter-eye distance),
then compared via Euclidean distance on the normalized vectors.

Cosine similarity is too permissive for landmarks because all faces
share the same topology — even different people score >0.99.
Euclidean distance on normalized landmarks captures the actual
geometric differences between face shapes.
"""

import logging

import numpy as np

log = logging.getLogger(__name__)

NOSE_TIP_IDX = 1
LEFT_EYE_IDX = 33
RIGHT_EYE_IDX = 263
LANDMARK_COUNT = 478
VECTOR_DIM = LANDMARK_COUNT * 3


def normalize_landmarks(raw: list[float]) -> list[float]:
    """
    Normalize a flat [x0,y0,z0, x1,y1,z1, ...] landmark vector.

    Centers on the nose tip and scales so the inter-eye distance equals 1.
    """
    arr = np.array(raw, dtype=np.float64).reshape(LANDMARK_COUNT, 3)

    center = arr[NOSE_TIP_IDX].copy()
    arr -= center

    left_eye = arr[LEFT_EYE_IDX]
    right_eye = arr[RIGHT_EYE_IDX]
    eye_dist = np.linalg.norm(left_eye - right_eye)
    if eye_dist > 1e-8:
        arr /= eye_dist

    return arr.flatten().tolist()


def euclidean_distance(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float64)
    vb = np.array(b, dtype=np.float64)
    return float(np.linalg.norm(va - vb))


def find_best_match(
    query_landmarks: list[float],
    stored_faces: list[dict],
    max_distance: float = 3.5,
) -> dict | None:
    """
    Compare query landmarks against all stored faces using Euclidean distance.

    Lower distance = more similar. max_distance is the cutoff —
    distances above this are considered "unknown".

    stored_faces: list of dicts with keys '_id', 'person_name', 'landmarks'.
    Returns {'face_id', 'person_name', 'relationship', 'score', 'distance'} or None.
    """
    if not stored_faces:
        return None

    best_dist = float("inf")
    best_face = None

    for face in stored_faces:
        dist = euclidean_distance(query_landmarks, face["landmarks"])
        log.info("  vs %-20s  distance=%.4f", face["person_name"], dist)
        if dist < best_dist:
            best_dist = dist
            best_face = face

    log.info("Best match: %s (distance=%.4f, threshold=%.1f)",
             best_face["person_name"] if best_face else "none", best_dist, max_distance)

    if best_dist <= max_distance and best_face is not None:
        return {
            "face_id": best_face["_id"],
            "person_name": best_face["person_name"],
            "relationship": best_face.get("relationship", ""),
            "score": round(best_dist, 4),
            "distance": round(best_dist, 4),
        }
    return None
