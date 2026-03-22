import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_PEOPLE, MOCK_CONVERSATIONS } from '../mock/mockData';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      userMode: null,
      people: MOCK_PEOPLE,
      conversations: MOCK_CONVERSATIONS,

      setUserMode: (mode) => {
        document.documentElement.setAttribute('data-theme', mode);
        set({ userMode: mode });
      },

      addPerson: (person) =>
        set((state) => ({ people: [...state.people, person] })),

      updatePerson: (id, updates) =>
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      removePerson: (id) =>
        set((state) => ({ people: state.people.filter((p) => p.id !== id) })),

      addConversation: (conversation) =>
        set((state) => ({ conversations: [...state.conversations, conversation] })),

      getPersonById: (id) => get().people.find((p) => p.id === id),
      getConversationById: (id) => get().conversations.find((c) => c.id === id),

      getConversationsForPerson: (personId) =>
        get().conversations.filter((c) => c.personId === personId),
    }),
    {
      name: 'conversation-helper-settings',
      partialize: (state) => ({
        userMode: state.userMode,
        people: state.people,
        conversations: state.conversations,
      }),
    }
  )
);
