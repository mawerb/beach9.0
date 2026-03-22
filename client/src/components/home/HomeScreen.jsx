import { Brain, Heart, ChatCircleDots, CheckCircle, ArrowRight } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigate } from 'react-router-dom';

const MODES = [
  {
    id: 'dementia',
    label: 'Memory Support',
    icon: Brain,
    color: 'var(--color-sage)',
    colorHex: '#4a7c6f',
    desc: 'Gentle reminders and face recognition for familiar people.',
  },
  {
    id: 'anxiety',
    label: 'Social Comfort',
    icon: Heart,
    color: 'var(--color-rose)',
    colorHex: '#9b4b6e',
    desc: 'Calm conversation prompts to ease social situations.',
  },
  {
    id: 'skills',
    label: 'Conversation Skills',
    icon: ChatCircleDots,
    color: 'var(--color-slate)',
    colorHex: '#4a5568',
    desc: 'Build confidence and sharpen how you connect with others.',
  },
];

export default function HomeScreen() {
  const userMode = useSettingsStore((s) => s.userMode);
  const setUserMode = useSettingsStore((s) => s.setUserMode);
  const navigate = useNavigate();

  const handleSelect = (modeId) => {
    setUserMode(modeId);
    navigate('/camera');
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>

        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.badge}>
            <span style={styles.badgeText}>AR · Real-time · Personalised</span>
          </div>
          <h1 style={styles.title}>
            Welcome to<br />
            <span style={styles.titleAccent}>InTouch</span>
          </h1>
          <p style={styles.description}>
            Intouch uses augmented reality to help you recognise familiar faces
            and guide your conversations in real time. Stay present, remember
            what matters, and feel confident in every interaction.
          </p>
        </div>

        {/* Mode selection */}
        <div style={styles.modeSection}>
          <p style={styles.modeQuestion}>What are you here for?</p>

          <div style={styles.modeList}>
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = userMode === mode.id;
              return (
                <button
                  key={mode.id}
                  style={{
                    ...styles.modeCard,
                    borderColor: isActive ? mode.colorHex : 'rgba(255,255,255,0.1)',
                    background: isActive
                      ? `${mode.colorHex}18`
                      : 'rgba(255,255,255,0.04)',
                  }}
                  onClick={() => handleSelect(mode.id)}
                >
                  <div
                    style={{
                      ...styles.iconWrap,
                      background: `${mode.colorHex}22`,
                    }}
                  >
                    <Icon
                      size={22}
                      weight={isActive ? 'fill' : 'regular'}
                      color={mode.colorHex}
                    />
                  </div>

                  <div style={styles.modeInfo}>
                    <span
                      style={{
                        ...styles.modeLabel,
                        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.78)',
                      }}
                    >
                      {mode.label}
                    </span>
                    <span style={styles.modeDesc}>{mode.desc}</span>
                  </div>

                  {isActive
                    ? <CheckCircle size={20} weight="fill" color={mode.colorHex} />
                    : <ArrowRight size={18} color="rgba(255,255,255,0.25)" />}
                </button>
              );
            })}
          </div>
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
    overflowY: 'auto',
  },
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '48px 20px 80px',
  },
  hero: {
    marginBottom: 44,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(74,124,111,0.18)',
    border: '1px solid rgba(74,124,111,0.35)',
    borderRadius: 9999,
    padding: '4px 14px',
    marginBottom: 20,
  },
  badgeText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-sage)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 42,
    fontWeight: 600,
    lineHeight: 1.15,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 16,
  },
  titleAccent: {
    color: 'var(--color-sage)',
  },
  description: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    lineHeight: 1.75,
    color: 'rgba(255,255,255,0.5)',
  },
  modeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  modeQuestion: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 4,
  },
  modeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  modeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    borderRadius: 14,
    border: '1px solid',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'border-color 180ms, background 180ms',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modeInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    textAlign: 'left',
  },
  modeLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
  },
  modeDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.4,
  },
};
