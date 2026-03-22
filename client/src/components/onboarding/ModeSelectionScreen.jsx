import { useNavigate } from 'react-router-dom';
import { Brain, Heart, ChatCircleDots } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';

const MODES = [
  {
    id: 'dementia',
    label: 'Memory Support',
    description: 'Simplified interface for people living with dementia',
    icon: Brain,
    color: 'var(--color-sage)',
  },
  {
    id: 'anxiety',
    label: 'Social Comfort',
    description: 'Gentle conversation support for social anxiety',
    icon: Heart,
    color: 'var(--color-rose)',
  },
  {
    id: 'skills',
    label: 'Conversation Skills',
    description: 'Full-featured practice for building social skills',
    icon: ChatCircleDots,
    color: 'var(--color-slate)',
  },
];

export default function ModeSelectionScreen() {
  const setUserMode = useSettingsStore((s) => s.setUserMode);
  const navigate = useNavigate();

  const handleSelect = (mode) => {
    setUserMode(mode);
    navigate('/camera');
  };

  return (
    <div style={styles.screen}>
      <div style={styles.inner}>
        <h1 style={styles.title}>Who is this for?</h1>
        <p style={styles.subtitle}>
          Choose a mode. This shapes the entire experience.
        </p>

        <div style={styles.cards}>
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                style={styles.card}
                onClick={() => handleSelect(mode.id)}
              >
                <div style={{ ...styles.iconWrap, background: mode.color }}>
                  <Icon size={24} weight="duotone" color="#fff" />
                </div>
                <div style={styles.cardText}>
                  <span style={styles.cardLabel}>{mode.label}</span>
                  <span style={styles.cardDesc}>{mode.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-paper)',
    padding: 24,
  },
  inner: {
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(28px, 5vw, 40px)',
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--color-ink2)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 1.6,
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    height: 64,
    background: '#fff',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'border-color 150ms, box-shadow 150ms',
    textAlign: 'left',
    width: '100%',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  cardLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-ink)',
  },
  cardDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 400,
    color: 'var(--color-ink3)',
  },
};
