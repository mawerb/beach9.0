"""
Face descriptor matching.

Uses 128-dimensional face descriptors from face-api.js (FaceNet-based).
Descriptors are pre-normalized by the model, so we compare directly
via Euclidean distance. Threshold of ~0.6 cleanly separates same vs
different people.
"""

import logging

import numpy as np

log = logging.getLogger(__name__)

VECTOR_DIM = 128


def euclidean_distance(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float64)
    vb = np.array(b, dtype=np.float64)
    return float(np.linalg.norm(va - vb))


def find_best_match(
    query_descriptor: list[float],
    stored_faces: list[dict],
    max_distance: float = 0.6,
) -> dict | None:
    """
    Compare a 128-dim face descriptor against all stored faces.

    Lower distance = more similar. max_distance is the cutoff —
    distances above this are considered "unknown".

    stored_faces: list of dicts with keys '_id', 'person_name', 'landmarks'.
    Returns {'face_id', 'person_name', 'relationship', 'distance'} or None.
    """
    if not stored_faces:
        return None

    best_dist = float("inf")
    best_face = None

    for face in stored_faces:
        dist = euclidean_distance(query_descriptor, face["landmarks"])
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
            "distance": round(best_dist, 4),
        }
    return None
