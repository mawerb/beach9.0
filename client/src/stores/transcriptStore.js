import { create } from 'zustand';
import { produce } from 'immer';

export const useTranscriptStore = create((set) => ({
  lines: [],
  isRecording: false,
  isLive: false,
  currentSpeaker: null,

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

  setRecording: (isRecording) => set({ isRecording }),
  setLive: (isLive) => set({ isLive }),
  setCurrentSpeaker: (speaker) => set({ currentSpeaker: speaker }),
  clearTranscript: () => set({ lines: [], isRecording: false, isLive: false, currentSpeaker: null }),
}));
