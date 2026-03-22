import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash, PencilSimple } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';
import { RELATIONSHIP_COLORS } from '../../mock/mockData';

export default function PersonProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const person = useSettingsStore((s) => s.getPersonById(id));
  const removePerson = useSettingsStore((s) => s.removePerson);

  if (!person) {
    return (
      <div style={styles.screen}>
        <p style={{ textAlign: 'center', color: 'var(--color-ink3)' }}>Person not found.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Delete ${person.name}? This cannot be undone.`)) {
      removePerson(person.id);
      navigate('/people');
    }
  };

  const accentColor = RELATIONSHIP_COLORS[person.relationshipType] || 'var(--color-ink3)';

  return (
    <div style={styles.screen}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div style={styles.actions}>
          <button style={styles.iconBtn} aria-label="Edit">
            <PencilSimple size={18} />
          </button>
          <button style={styles.iconBtn} onClick={handleDelete} aria-label="Delete">
            <Trash size={18} weight="bold" color="var(--color-critical)" />
          </button>
        </div>
      </div>

      <div style={styles.profile}>
        <div style={{ ...styles.avatar, background: accentColor }}>
          <span style={styles.initials}>
            {person.name.split(' ').map((n) => n[0]).join('')}
          </span>
        </div>
        <h1 style={styles.name}>{person.name}</h1>
        <span style={{ ...styles.badge, background: accentColor }}>
          {person.relationship}
        </span>
      </div>

      {person.notes && (
        <p style={styles.notes}>{person.notes}</p>
      )}

      {person.interests?.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Interests</h3>
          <div style={styles.pills}>
            {person.interests.map((interest) => (
              <span key={interest} style={styles.pill}>{interest}</span>
            ))}
          </div>
        </div>
      )}

      {person.conversationHistory?.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Conversation History</h3>
          <div style={styles.timeline}>
            {person.conversationHistory.map((conv, i) => (
              <div key={i} style={styles.timelineItem}>
                <span style={styles.timelineDate}>
                  {new Date(conv.date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <p style={styles.timelineSummary}>{conv.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100dvh',
    background: 'var(--color-paper)',
    padding: '16px 16px 100px',
    maxWidth: 480,
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'var(--color-paper2)',
    border: 'none',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'var(--color-paper2)',
    border: 'none',
    cursor: 'pointer',
  },
  profile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'var(--font-body)',
    fontSize: 24,
    fontWeight: 600,
    color: '#fff',
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--color-ink)',
  },
  badge: {
    padding: '2px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    fontWeight: 500,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  notes: {
    fontSize: 15,
    color: 'var(--color-ink2)',
    lineHeight: 1.6,
    padding: '0 8px',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-ink3)',
    marginBottom: 12,
    padding: '0 8px',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '0 8px',
  },
  pill: {
    padding: '4px 14px',
    background: 'var(--color-sage-light)',
    borderRadius: 'var(--radius-full)',
    fontSize: 14,
    color: 'var(--color-sage-dark)',
    fontWeight: 500,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '0 8px',
  },
  timelineItem: {
    borderLeft: '2px solid var(--color-sage-light)',
    paddingLeft: 16,
  },
  timelineDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--color-ink3)',
  },
  timelineSummary: {
    fontSize: 15,
    color: 'var(--color-ink)',
    lineHeight: 1.5,
    marginTop: 2,
  },
};
