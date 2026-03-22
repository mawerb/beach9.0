const BASE_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000';

export async function enrollFace({ person_name, relationship, relationship_type, landmarks }) {
  const res = await fetch(`${BASE_URL}/api/faces/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person_name, relationship, relationship_type, landmarks }),
  });
  if (!res.ok) throw new Error(`Enroll failed: ${res.status}`);
  return res.json();
}

export async function matchFace(landmarks) {
  const res = await fetch(`${BASE_URL}/api/faces/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landmarks }),
  });
  if (!res.ok) throw new Error(`Match failed: ${res.status}`);
  return res.json();
}

export async function listFaces() {
  const res = await fetch(`${BASE_URL}/api/faces`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function deleteFace(id) {
  const res = await fetch(`${BASE_URL}/api/faces/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}
