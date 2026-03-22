import { useNavigate } from 'react-router-dom';
import { Plus, User } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';
import { RELATIONSHIP_COLORS } from '../../mock/mockData';

export default function PeopleScreen() {
  const people = useSettingsStore((s) => s.people);
  const navigate = useNavigate();

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <h1 style={styles.title}>People</h1>
        <button style={styles.addBtn} aria-label="Add person">
          <Plus size={20} weight="bold" color="var(--color-sage)" />
        </button>
      </div>

      <div style={styles.list}>
        {people.map((person) => (
          <button
            key={person.id}
            style={styles.row}
            onClick={() => navigate(`/people/${person.id}`)}
          >
            <div
              style={{
                ...styles.avatar,
                background: RELATIONSHIP_COLORS[person.relationshipType] || 'var(--color-ink3)',
              }}
            >
              <span style={styles.initials}>
                {person.name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div style={styles.info}>
              <span style={styles.name}>{person.name}</span>
              <span style={styles.rel}>{person.relationship}</span>
            </div>
            {person.conversationHistory?.[0] && (
              <span style={styles.date}>
                {new Date(person.conversationHistory[0].date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, var(--color-paper) 0%, var(--color-paper2) 100%)',
    padding: '24px 16px 100px',
    maxWidth: 480,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 600,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--color-sage-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.75)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  name: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--color-ink)',
  },
  rel: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--color-ink3)',
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--color-ink3)',
  },
};
