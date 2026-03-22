export const MOCK_PEOPLE = [
  {
    id: 'p_margaret',
    name: 'Margaret Chen',
    relationship: 'Daughter',
    relationshipType: 'family',
    interests: ['gardening', 'cooking', 'crossword puzzles', 'classical music'],
    lastConversationTopic: "Emma's school recital",
    notes: 'Visits every Sunday. Brings homemade soup in winter.',
    conversationHistory: [
      { date: '2025-03-14', summary: "Talked about Emma's recital and the garden roses" },
      { date: '2025-02-28', summary: 'Discussed holiday plans' },
    ],
  },
  {
    id: 'p_reyes',
    name: 'Dr. Reyes',
    relationship: 'Doctor',
    relationshipType: 'medical',
    interests: ['hiking', 'chess'],
    lastConversationTopic: 'Medication review in April',
    conversationHistory: [
      { date: '2025-03-01', summary: 'Routine check-in, blood pressure stable' },
    ],
  },
];

export const MOCK_SUGGESTIONS_MARGARET = [
  { id: 's1', text: 'How are the grandkids doing? Last time you mentioned Emma had a recital.', tone: 'empathetic', type: 'question', score: 0.97 },
  { id: 's2', text: 'Did the roses in your garden bloom this spring?', tone: 'casual', type: 'question', score: 0.88 },
  { id: 's3', text: "It's so good to see you. I've been looking forward to this.", tone: 'empathetic', type: 'statement', score: 0.82 },
  { id: 's4', text: 'Have you finished that crossword book you mentioned?', tone: 'casual', type: 'question', score: 0.79 },
  { id: 's5', text: "What have you been cooking lately? You always make the best food.", tone: 'casual', type: 'question', score: 0.74 },
];

export const MOCK_SUGGESTIONS_REYES = [
  { id: 'r1', text: "Hello Dr. Reyes, it's good to see you.", tone: 'empathetic', type: 'statement', score: 0.95 },
  { id: 'r2', text: 'Is there anything new about my medication?', tone: 'serious', type: 'question', score: 0.90 },
  { id: 'r3', text: 'I heard you like hiking — been on any good trails?', tone: 'casual', type: 'question', score: 0.72 },
  { id: 'r4', text: "How's your day been so far?", tone: 'casual', type: 'question', score: 0.68 },
];

export const MOCK_TRANSCRIPT = [
  { lineId: 'l1', speaker: 'them', text: "Hi Dad! It's Margaret.", isFinal: true },
  { lineId: 'l2', speaker: 'user', text: 'Oh, Margaret! How are the grandkids doing?', isFinal: true },
  { lineId: 'l3', speaker: 'them', text: "They're great! Emma had her recital last week — she was wonderful.", isFinal: true },
  { lineId: 'l4', speaker: 'user', text: "That's wonderful. I wish I could have been there.", isFinal: true },
];

export const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    personId: 'p_margaret',
    startedAt: '2025-03-14T14:30:00Z',
    duration: 480,
    transcript: MOCK_TRANSCRIPT,
    topics: ['grandkids', "Emma's recital", 'garden roses'],
  },
];

export const TONE_COLORS = {
  warm: 'var(--color-sage)',
  casual: 'var(--color-slate)',
  grateful: 'var(--color-rose)',
  playful: 'var(--color-amber)',
  brief: 'var(--color-ink)',
  empathetic: 'var(--color-sage)',
  clever: 'var(--color-amber)',
  serious: 'var(--color-ink)',
};

export const RELATIONSHIP_COLORS = {
  family: 'var(--color-sage)',
  medical: 'var(--color-slate)',
  social: 'var(--color-rose)',
  colleague: 'var(--color-amber)',
  other: 'var(--color-ink3)',
};
