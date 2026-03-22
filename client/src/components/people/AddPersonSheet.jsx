import { useState } from 'react';
import { X } from '@phosphor-icons/react';

const RELATIONSHIPS = ['Family', 'Friend', 'Colleague', 'Medical', 'Other'];

export default function AddPersonSheet({ onSave, onDismiss, faceEmbeddingId }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: `p_${Date.now()}`,
      name: name.trim(),
      relationship,
      relationshipType: relationship.toLowerCase(),
      interests: [],
      notes: notes.trim(),
      lastConversationTopic: null,
      conversationHistory: [],
      faceEmbeddingId,
    });
  };

  return (
    <div style={styles.overlay} onClick={onDismiss}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Add Person</h2>
          <button style={styles.closeBtn} onClick={onDismiss} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter their name"
            autoFocus
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Relationship</label>
          <div style={styles.segmented}>
            {RELATIONSHIPS.map((r) => (
              <button
                key={r}
                style={{
                  ...styles.segment,
                  background: relationship === r ? 'var(--color-sage)' : 'var(--color-paper2)',
                  color: relationship === r ? '#fff' : 'var(--color-ink2)',
                }}
                onClick={() => setRelationship(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Notes (optional)</label>
          <textarea
            style={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything helpful to remember…"
            rows={3}
          />
        </div>

        <button
          style={{
            ...styles.saveBtn,
            opacity: name.trim() ? 1 : 0.5,
          }}
          onClick={handleSave}
          disabled={!name.trim()}
        >
          Save
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 50,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--color-paper)',
    borderRadius: '16px 16px 0 0',
    padding: '16px 24px 32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 600,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--color-paper2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-ink3)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--rule)',
    fontSize: 16,
    fontFamily: 'var(--font-body)',
    background: '#fff',
    color: 'var(--color-ink)',
    outline: 'none',
  },
  segmented: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  segment: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
    fontFamily: 'var(--font-body)',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--rule)',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    background: '#fff',
    color: 'var(--color-ink)',
    outline: 'none',
    resize: 'vertical',
  },
  saveBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-sage)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    border: 'none',
    cursor: 'pointer',
    marginTop: 8,
  },
};
