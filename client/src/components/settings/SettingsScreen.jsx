import { Brain, Heart, ChatCircleDots, Translate } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (BR)' },
  { code: 'zh-CN', label: 'Chinese (Mandarin)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'he-IL', label: 'Hebrew' },
];

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
  const speechLang = useSettingsStore((s) => s.speechLang);
  const setSpeechLang = useSettingsStore((s) => s.setSpeechLang);
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

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Translate size={13} style={{ marginRight: 6, verticalAlign: -1 }} />
          Speech Language
        </h3>
        <select
          value={speechLang}
          onChange={(e) => setSpeechLang(e.target.value)}
          style={styles.langSelect}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
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
  langSelect: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '10px 6px',
  },
};
