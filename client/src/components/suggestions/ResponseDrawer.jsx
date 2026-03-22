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

  const drawerHeight = panelVisible ? 220 : 44;

  return (
    <motion.div
      animate={{ height: drawerHeight }}
      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      style={styles.drawer}
    >
      <div style={styles.handle}>
        <div style={styles.handlePill} />
      </div>

      {!panelVisible && (
        <p style={styles.waitingText}>Waiting for someone to talk to…</p>
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
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    background: 'rgba(10, 14, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--color-ar-border)',
    borderRadius: '16px 16px 0 0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  handle: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0 4px',
  },
  handlePill: {
    width: 32,
    height: 4,
    borderRadius: 'var(--radius-full)',
    background: 'rgba(255,255,255,0.2)',
  },
  waitingText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--color-ar-muted)',
    textAlign: 'center',
    padding: '4px 0',
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
};
