import { MOCK_PEOPLE, MOCK_SUGGESTIONS_MARGARET, MOCK_SUGGESTIONS_REYES } from './mockData';

const MOCK_FACES = [
  {
    person: MOCK_PEOPLE[0],
    suggestions: MOCK_SUGGESTIONS_MARGARET,
    face: {
      x: 0.35,
      y: 0.25,
      width: 0.18,
      height: 0.24,
    },
    confidence: 0.94,
  },
  {
    person: MOCK_PEOPLE[1],
    suggestions: MOCK_SUGGESTIONS_REYES,
    face: {
      x: 0.45,
      y: 0.3,
      width: 0.16,
      height: 0.22,
    },
    confidence: 0.87,
  },
];

let currentIndex = 0;
let intervalId = null;

export function startMockDetection(callbacks) {
  const { onFaceDetected, onFaceLost, onSuggestions, onTranscriptLine } = callbacks;
  let detected = false;

  intervalId = setInterval(() => {
    if (!detected) {
      const mock = MOCK_FACES[currentIndex];
      onFaceDetected(mock.face, mock.person, mock.confidence);

      setTimeout(() => {
        onSuggestions(mock.suggestions);
      }, 500);

      setTimeout(() => {
        onTranscriptLine({
          lineId: `mock_${Date.now()}`,
          speaker: 'them',
          text: `Hi there! It's ${mock.person.name.split(' ')[0]}.`,
          isFinal: true,
        });
      }, 1200);

      detected = true;
    } else {
      detected = false;
      currentIndex = (currentIndex + 1) % MOCK_FACES.length;
    }
  }, 5000);

  return () => clearInterval(intervalId);
}

export function triggerMockDetection(callbacks, personIndex = 0) {
  const mock = MOCK_FACES[personIndex % MOCK_FACES.length];
  callbacks.onFaceDetected(mock.face, mock.person, mock.confidence);

  setTimeout(() => {
    callbacks.onSuggestions(mock.suggestions);
  }, 500);

  setTimeout(() => {
    callbacks.onTranscriptLine({
      lineId: `mock_${Date.now()}`,
      speaker: 'them',
      text: `Hi there! It's ${mock.person.name.split(' ')[0]}.`,
      isFinal: true,
    });
  }, 1200);
}

export function stopMockDetection() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
