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
      <div style={styles.root}>
        <div style={styles.screen}>
          <p style={styles.notFound}>Person not found.</p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Delete ${person.name}? This cannot be undone.`)) {
      removePerson(person.id);
      navigate('/people');
    }
  };

  const accentColor = RELATIONSHIP_COLORS[person.relationshipType] || 'rgba(255,255,255,0.2)';

  return (
    <div style={styles.root}>
      <div style={styles.screen}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate('/people')}>
            <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
          </button>
          <div style={styles.actions}>
            <button style={styles.iconBtn} aria-label="Edit">
              <PencilSimple size={16} color="rgba(255,255,255,0.7)" />
            </button>
            <button style={styles.iconBtn} onClick={handleDelete} aria-label="Delete">
              <Trash size={16} weight="bold" color="#f87171" />
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
                <div key={i} style={{ ...styles.timelineItem, borderColor: accentColor + '55' }}>
                  <span style={styles.timelineDate}>
                    {new Date(conv.date).toLocaleDateString(undefined, {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                  <p style={styles.timelineSummary}>{conv.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100dvh',
    width: '100%',
    background: '#0a0e14',
  },
  screen: {
    padding: '24px 16px 100px',
    maxWidth: 480,
    margin: '0 auto',
  },
  notFound: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 60,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
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
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
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
    color: 'rgba(255,255,255,0.95)',
  },
  badge: {
    padding: '3px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: 12,
    fontWeight: 500,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  notes: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.65,
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    padding: '4px 14px',
    background: 'rgba(74,124,111,0.18)',
    border: '1px solid rgba(74,124,111,0.35)',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    color: 'var(--color-sage)',
    fontWeight: 500,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  timelineItem: {
    borderLeft: '2px solid',
    paddingLeft: 16,
  },
  timelineDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    display: 'block',
    marginBottom: 3,
  },
  timelineSummary: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.55,
  },
};
