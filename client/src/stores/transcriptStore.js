import { create } from 'zustand';
import { produce } from 'immer';

const MAX_ACCUMULATED_CHARS = 10000;

/** Label shown in UI / `[label]:` in accumulated export */
export function transcriptDisplayLabel(speaker, speakerLabelsSwapped) {
  const isUser = speaker === 'user';
  if (!speakerLabelsSwapped) return isUser ? 'You' : 'Them';
  return isUser ? 'Them' : 'You';
}

/** Bubble alignment / styling: true = “your” side of the thread */
export function transcriptLineAsYou(speaker, speakerLabelsSwapped) {
  const isUser = speaker === 'user';
  return speakerLabelsSwapped ? !isUser : isUser;
}

function rebuildAccumulatedFromLines(lines, speakerLabelsSwapped) {
  const chunk = lines
    .filter((l) => l.isFinal)
    .map(
      (l) =>
        `[${transcriptDisplayLabel(l.speaker, speakerLabelsSwapped)}]: ${l.text}`,
    )
    .join('\n');
  return chunk.length > MAX_ACCUMULATED_CHARS
    ? chunk.slice(-MAX_ACCUMULATED_CHARS)
    : chunk;
}

export const useTranscriptStore = create((set, get) => ({
  lines: [],
  isRecording: false,
  isLive: false,
  currentSpeaker: null,
  accumulatedText: '',
  /** When true, You/Them labels (and sides) are flipped — fixes wrong mic attribution */
  speakerLabelsSwapped: false,

  addLine: (line) =>
    set(
      produce((state) => {
        const existing = state.lines.findIndex((l) => l.lineId === line.lineId);
        if (existing >= 0) {
          state.lines[existing] = line;
        } else {
          state.lines.push(line);
        }
      })
    ),

  appendToAccumulated: (speaker, text) =>
    set(
      produce((state) => {
        const label = transcriptDisplayLabel(speaker, state.speakerLabelsSwapped);
        state.accumulatedText += `[${label}]: ${text}\n`;
        if (state.accumulatedText.length > MAX_ACCUMULATED_CHARS) {
          state.accumulatedText = state.accumulatedText.slice(-MAX_ACCUMULATED_CHARS);
        }
      })
    ),

  getAccumulatedText: () => get().accumulatedText,

  toggleSpeakerLabelsSwapped: () =>
    set(
      produce((state) => {
        state.speakerLabelsSwapped = !state.speakerLabelsSwapped;
        state.accumulatedText = rebuildAccumulatedFromLines(
          state.lines,
          state.speakerLabelsSwapped,
        );
      }),
    ),

  setRecording: (isRecording) => set({ isRecording }),
  setLive: (isLive) => set({ isLive }),
  setCurrentSpeaker: (speaker) => set({ currentSpeaker: speaker }),
  clearTranscript: () =>
    set({
      lines: [],
      isRecording: false,
      isLive: false,
      currentSpeaker: null,
      accumulatedText: '',
      speakerLabelsSwapped: false,
    }),
}));
