import { create } from 'zustand';

export const useARStore = create((set) => ({
  currentFace: null,
  currentPerson: null,
  detectionStatus: 'idle',
  panelVisible: false,
  confidenceScore: 0,

  setFaceDetected: (face, person, confidence) =>
    set({
      currentFace: face,
      currentPerson: person,
      detectionStatus: 'found',
      panelVisible: true,
      confidenceScore: confidence,
    }),

  updateFacePosition: (face, confidence) =>
    set((state) => ({
      currentFace: face,
      confidenceScore: confidence ?? state.confidenceScore,
    })),

  setFaceUnknown: (face) =>
    set({
      currentFace: face,
      currentPerson: null,
      detectionStatus: 'unknown',
      panelVisible: false,
      confidenceScore: 0,
    }),

  setFaceLost: () =>
    set({
      currentFace: null,
      currentPerson: null,
      detectionStatus: 'idle',
      panelVisible: false,
      confidenceScore: 0,
    }),

  setPanelVisible: (visible) => set({ panelVisible: visible }),
}));
