const BASE_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      if (attempt === retries) {
        console.warn(`processTranscript failed after ${retries + 1} attempts:`, err);
        return null;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  return null;
}

/**
 * Send accumulated transcript to backend for synopsis + suggestions.
 *
 * @param {{ transcript: string, person_name: string, relationship: string }} params
 * @returns {Promise<{ synopsis: object, suggestions: Array } | null>}
 */
export async function processTranscript({ transcript, person_name, relationship }) {
  return fetchWithRetry(`${BASE_URL}/api/conversations/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, person_name, relationship }),
  });
}
