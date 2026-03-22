import { create } from 'zustand';

export const useSuggestionStore = create((set, get) => ({
  suggestions: [],
  activeToneFilter: null,
  isLoading: false,
  selectedId: null,

  setSuggestions: (suggestions) => set({ suggestions, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setToneFilter: (tone) => set({ activeToneFilter: tone }),
  setSelectedId: (id) => set({ selectedId: id }),

  getFilteredSuggestions: () => {
    const { suggestions, activeToneFilter } = get();
    if (!activeToneFilter) return suggestions;
    return suggestions.filter((s) => s.tone === activeToneFilter);
  },

  clearSuggestions: () =>
    set({ suggestions: [], activeToneFilter: null, isLoading: false, selectedId: null }),
}));
