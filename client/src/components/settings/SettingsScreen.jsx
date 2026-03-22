import { Brain, Heart, ChatCircleDots } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';

const MODES = [
  { id: 'dementia', label: 'Memory Support', icon: Brain, color: 'var(--color-sage)' },
  { id: 'anxiety', label: 'Social Comfort', icon: Heart, color: 'var(--color-rose)' },
  { id: 'skills', label: 'Conversation Skills', icon: ChatCircleDots, color: 'var(--color-slate)' },
];

export default function SettingsScreen() {
  const userMode = useSettingsStore((s) => s.userMode);
  const setUserMode = useSettingsStore((s) => s.setUserMode);

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>User Mode</h3>
        <div style={styles.modeList}>
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = userMode === mode.id;
            return (
              <button
                key={mode.id}
                style={{
                  ...styles.modeBtn,
                  borderColor: isActive ? mode.color : 'var(--rule)',
                  background: isActive ? 'var(--color-sage-light)' : '#fff',
                }}
                onClick={() => setUserMode(mode.id)}
              >
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  color={isActive ? mode.color : 'var(--color-ink3)'}
                />
                <span style={{
                  ...styles.modeLabel,
                  color: isActive ? 'var(--color-ink)' : 'var(--color-ink2)',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {mode.label}
                </span>
                {isActive && <span style={styles.activeDot} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>About</h3>
        <p style={styles.aboutText}>
          Conversation Helper is an AR-powered assistant that helps people
          with dementia, anxiety, and social skill challenges have better
          conversations.
        </p>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100dvh',
    background: 'var(--color-paper)',
    padding: '24px 16px 100px',
    maxWidth: 480,
    margin: '0 auto',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-ink3)',
    marginBottom: 12,
  },
  modeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 150ms, background 150ms',
    position: 'relative',
  },
  modeLabel: {
    fontSize: 16,
    flex: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-sage)',
  },
  aboutText: {
    fontSize: 15,
    color: 'var(--color-ink2)',
    lineHeight: 1.7,
  },
};
