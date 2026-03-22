const BASE_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000';

/**
 * Fetch all known people with their latest synopsis and conversation history.
 * @returns {Promise<Array>}
 */
export async function fetchPeople() {
  const res = await fetch(`${BASE_URL}/api/people`);
  if (!res.ok) throw new Error(`fetchPeople failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch the latest stored synopsis for a person by name.
 * @param {string} personName
 * @returns {Promise<{ synopsis: object|null, lastMessageAt: string|null }>}
 */
export async function fetchPersonSynopsis(personName) {
  const res = await fetch(`${BASE_URL}/api/people/${encodeURIComponent(personName)}/synopsis`);
  if (!res.ok) throw new Error(`fetchPersonSynopsis failed: ${res.status}`);
  return res.json();
}
