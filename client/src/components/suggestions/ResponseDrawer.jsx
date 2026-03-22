import { motion } from 'framer-motion';
import { useARStore } from '../../stores/arStore';
import { useSuggestionStore } from '../../stores/suggestionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTranscriptStore } from '../../stores/transcriptStore';
import ToneFilterRow from './ToneFilterRow';
import SuggestionCarousel from './SuggestionCarousel';
import { useState } from 'react';

export default function ResponseDrawer() {
  const panelVisible = useARStore((s) => s.panelVisible);
  const currentPerson = useARStore((s) => s.currentPerson);
  const suggestions = useSuggestionStore((s) => s.suggestions);
  const activeToneFilter = useSuggestionStore((s) => s.activeToneFilter);
  const isLoading = useSuggestionStore((s) => s.isLoading);
  const setSelectedId = useSuggestionStore((s) => s.setSelectedId);
  const userMode = useSettingsStore((s) => s.userMode);
  const addLine = useTranscriptStore((s) => s.addLine);
  const [confirmation, setConfirmation] = useState(null);

  const isDementia = userMode === 'dementia';

  const filtered = activeToneFilter
    ? suggestions.filter((s) => s.tone === activeToneFilter)
    : isDementia
      ? suggestions.filter((s) => s.tone === 'empathetic').slice(0, 2)
      : suggestions;

  const handleSelect = (id) => {
    const selected = suggestions.find((s) => s.id === id);
    if (!selected) return;

    setSelectedId(id);

    addLine({
      lineId: `you_${Date.now()}`,
      speaker: 'user',
      text: selected.text,
      isFinal: true,
    });

    setConfirmation(selected.text);
    const timeout = isDementia ? 3000 : 1500;
    setTimeout(() => setConfirmation(null), timeout);
  };

  const drawerWidth = panelVisible ? 260 : 44;

  return (
    <motion.div
      animate={{ width: drawerWidth }}
      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      style={styles.drawer}
    >
      <div style={styles.handle}>
        <div style={styles.handlePill} />
      </div>

      {!panelVisible && (
        <span style={styles.sideLabel}>Responses</span>
      )}

      {panelVisible && (
        <>
          {confirmation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={styles.confirmation}
            >
              <span style={styles.confirmLabel}>You said:</span> {confirmation}
            </motion.div>
          )}

          <ToneFilterRow />

          <SuggestionCarousel
            suggestions={filtered}
            onSelect={handleSelect}
          />
        </>
      )}
    </motion.div>
  );
}

const styles = {
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    borderRight: '1px solid rgba(255,255,255,0.22)',
    borderRadius: '0 20px 20px 0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 32px rgba(0,0,0,0.18), inset -1px 0 0 rgba(255,255,255,0.1)',
  },
  handle: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0 8px',
    flexShrink: 0,
  },
  handlePill: {
    width: 4,
    height: 32,
    borderRadius: 'var(--radius-full)',
    background: 'rgba(0,0,0,0.18)',
  },
  confirmation: {
    padding: '4px 16px 8px',
    fontSize: 13,
    color: 'var(--color-sage)',
    fontFamily: 'var(--font-body)',
  },
  confirmLabel: {
    fontWeight: 600,
  },
  sideLabel: {
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    marginTop: 12,
    alignSelf: 'center',
  },
};
