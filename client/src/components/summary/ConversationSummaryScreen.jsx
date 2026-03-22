import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';
import { RELATIONSHIP_COLORS } from '../../mock/mockData';

export default function ConversationSummaryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conversation = useSettingsStore((s) => s.getConversationById(id));
  const people = useSettingsStore((s) => s.people);

  if (!conversation) {
    return (
      <div style={styles.screen}>
        <p style={{ textAlign: 'center', color: 'var(--color-ink3)' }}>Conversation not found.</p>
      </div>
    );
  }

  const person = people.find((p) => p.id === conversation.personId);
  const accentColor = person
    ? RELATIONSHIP_COLORS[person.relationshipType] || 'var(--color-ink3)'
    : 'var(--color-ink3)';

  const duration = conversation.duration
    ? `${Math.floor(conversation.duration / 60)}m ${conversation.duration % 60}s`
    : '';

  return (
    <div style={styles.screen}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
      </button>

      <div style={styles.profileSection}>
        {person && (
          <div style={{ ...styles.avatar, background: accentColor }}>
            <span style={styles.initials}>
              {person.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
        )}
        <h1 style={styles.personName}>{person?.name || 'Unknown'}</h1>
        {duration && <span style={styles.durationChip}>{duration}</span>}
      </div>

      {conversation.topics?.length > 0 && (
        <div style={styles.topicRow}>
          {conversation.topics.map((topic) => (
            <span key={topic} style={styles.topicPill}>{topic}</span>
          ))}
        </div>
      )}

      <div style={styles.transcript}>
        {conversation.transcript.map((line) => (
          <div
            key={line.lineId}
            style={{
              ...styles.messageBubble,
              alignSelf: line.speaker === 'user' ? 'flex-end' : 'flex-start',
              background: line.speaker === 'user' ? 'var(--color-sage-light)' : '#fff',
            }}
          >
            <span style={styles.speakerLabel}>
              {line.speaker === 'user' ? 'You' : person?.name?.split(' ')[0] || 'Them'}
            </span>
            <p style={styles.messageText}>{line.text}</p>
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        {person && (
          <button
            style={styles.secondaryBtn}
            onClick={() => navigate(`/people/${person.id}`)}
          >
            View Profile
          </button>
        )}
        <button
          style={styles.primaryBtn}
          onClick={() => navigate('/camera')}
        >
          <Camera size={18} weight="bold" />
          Back to Camera
        </button>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100dvh',
    background: 'var(--color-paper)',
    padding: '16px 16px 32px',
    maxWidth: 480,
    margin: '0 auto',
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
    marginBottom: 16,
  },
  profileSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'var(--font-body)',
    fontSize: 20,
    fontWeight: 600,
    color: '#fff',
  },
  personName: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 600,
  },
  durationChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--color-ink3)',
    padding: '2px 10px',
    background: 'var(--color-paper2)',
    borderRadius: 'var(--radius-full)',
  },
  topicRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  topicPill: {
    padding: '3px 12px',
    background: 'var(--color-sage-light)',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    color: 'var(--color-sage-dark)',
    fontWeight: 500,
  },
  transcript: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 32,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--rule2)',
  },
  speakerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-ink3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: 'var(--color-ink)',
    marginTop: 2,
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--rule)',
    background: '#fff',
    fontWeight: 500,
    fontSize: 15,
    color: 'var(--color-ink)',
    cursor: 'pointer',
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-sage)',
    fontWeight: 500,
    fontSize: 15,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};
