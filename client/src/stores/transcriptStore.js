import { create } from 'zustand';
import { produce } from 'immer';

const MAX_ACCUMULATED_CHARS = 10000;

export const useTranscriptStore = create((set, get) => ({
  lines: [],
  isRecording: false,
  isLive: false,
  currentSpeaker: null,
  accumulatedText: '',

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
        const label = speaker === 'user' ? 'You' : 'Them';
        state.accumulatedText += `[${label}]: ${text}\n`;
        if (state.accumulatedText.length > MAX_ACCUMULATED_CHARS) {
          state.accumulatedText = state.accumulatedText.slice(-MAX_ACCUMULATED_CHARS);
        }
      })
    ),

  getAccumulatedText: () => get().accumulatedText,

  setRecording: (isRecording) => set({ isRecording }),
  setLive: (isLive) => set({ isLive }),
  setCurrentSpeaker: (speaker) => set({ currentSpeaker: speaker }),
  clearTranscript: () =>
    set({ lines: [], isRecording: false, isLive: false, currentSpeaker: null, accumulatedText: '' }),
}));
