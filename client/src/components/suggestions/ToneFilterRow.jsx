import { useSettingsStore } from '../../stores/settingsStore';
import { useSuggestionStore } from '../../stores/suggestionStore';
import { TONE_COLORS } from '../../mock/mockData';

const TONES = [null, 'warm', 'casual', 'grateful', 'playful', 'brief'];
const LABELS = { null: 'All', warm: 'Warm', casual: 'Casual', grateful: 'Grateful', playful: 'Playful', brief: 'Brief' };

export default function ToneFilterRow() {
  const userMode = useSettingsStore((s) => s.userMode);
  const activeTone = useSuggestionStore((s) => s.activeToneFilter);
  const setToneFilter = useSuggestionStore((s) => s.setToneFilter);

  if (userMode === 'dementia') return null;

  return (
    <div style={styles.row}>
      {TONES.map((tone) => {
        const isActive = activeTone === tone;
        return (
          <button
            key={String(tone)}
            onClick={() => setToneFilter(tone)}
            style={{
              ...styles.pill,
              background: isActive
                ? (tone ? TONE_COLORS[tone] : 'var(--color-sage)')
                : 'rgba(0,0,0,0.07)',
              color: isActive ? '#fff' : 'rgba(0,0,0,0.6)',
            }}
          >
            {LABELS[String(tone)]}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    padding: '0 16px 8px',
    scrollbarWidth: 'none',
  },
  pill: {
    padding: '4px 14px',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  },
};
