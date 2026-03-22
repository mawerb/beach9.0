import { Brain, Heart, ChatCircleDots } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';

const MODES = [
  {
    id: 'dementia',
    label: 'Memory Support',
    icon: Brain,
    color: 'var(--color-sage)',
    about: 'Memory Support mode helps you recognise familiar faces and recall shared memories. InTouch displays a person\'s name, relationship, and recent conversation history the moment they appear — giving you confidence in every interaction without having to ask.',
  },
  {
    id: 'anxiety',
    label: 'Social Comfort',
    icon: Heart,
    color: 'var(--color-rose)',
    about: 'Social Comfort mode provides calm, empathetic conversation prompts tailored to ease social anxiety. InTouch surfaces gentle suggestions at your own pace so you can stay present without the pressure of searching for the right words.',
  },
  {
    id: 'skills',
    label: 'Conversation Skills',
    icon: ChatCircleDots,
    color: 'var(--color-slate)',
    about: 'Conversation Skills mode coaches you through real interactions with varied, thoughtful prompts across different tones. Whether you\'re building rapport or navigating a tricky topic, InTouch helps you develop more natural, confident conversations.',
  },
];

export default function SettingsScreen() {
  const userMode = useSettingsStore((s) => s.userMode);
  const setUserMode = useSettingsStore((s) => s.setUserMode);
  const activeMode = MODES.find((m) => m.id === userMode);

  return (
    <div style={styles.root}>
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
                  borderColor: isActive ? mode.color : 'rgba(255,255,255,0.12)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                }}
                onClick={() => setUserMode(mode.id)}
              >
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  color={isActive ? mode.color : 'rgba(255,255,255,0.4)'}
                />
                <span style={{
                  ...styles.modeLabel,
                  color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
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
        <h3 style={styles.sectionTitle}>
          About {activeMode ? activeMode.label : 'InTouch'}
        </h3>
        <p style={styles.aboutText}>
          {activeMode
            ? activeMode.about
            : 'InTouch is an AR-powered conversation assistant that helps you stay connected with the people in your life.'}
        </p>
      </div>
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
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.95)',
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
    color: 'rgba(255,255,255,0.4)',
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
    borderRadius: 12,
    border: '1.5px solid',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 150ms, background 150ms',
    position: 'relative',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
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
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.7,
  },
};
