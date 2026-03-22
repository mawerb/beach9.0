import { motion } from 'framer-motion';
import { CaretLeft } from '@phosphor-icons/react';
import { useARStore } from '../../stores/arStore';
import { useSuggestionStore } from '../../stores/suggestionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTranscriptStore } from '../../stores/transcriptStore';
import ToneFilterRow from './ToneFilterRow';
import SuggestionCarousel from './SuggestionCarousel';

export default function ResponseDrawer() {
  const panelVisible  = useARStore((s) => s.panelVisible);
  const setPanelVisible = useARStore((s) => s.setPanelVisible);
  const currentPerson = useARStore((s) => s.currentPerson);
  const suggestions   = useSuggestionStore((s) => s.suggestions);
  const activeToneFilter = useSuggestionStore((s) => s.activeToneFilter);
  const setSelectedId = useSuggestionStore((s) => s.setSelectedId);
  const userMode      = useSettingsStore((s) => s.userMode);
  const addLine       = useTranscriptStore((s) => s.addLine);
  const appendToAccumulated = useTranscriptStore((s) => s.appendToAccumulated);

  const isDementia = userMode === 'dementia';

  const filtered = activeToneFilter
    ? suggestions.filter((s) => s.tone === activeToneFilter)
    : isDementia
      ? suggestions.slice(0, 2)
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
    appendToAccumulated('user', selected.text);
  };

  // Only allow toggling when a person is in frame (suggestions are available)
  const canToggle = currentPerson !== null || suggestions.length > 0;
  const drawerWidth = panelVisible ? 260 : 44;

  return (
    <motion.div
      animate={{ width: drawerWidth }}
      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      style={{
        ...styles.drawer,
        cursor: !panelVisible && canToggle ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (!panelVisible && canToggle) setPanelVisible(true);
      }}
    >
      {/* Handle pill — acts as close button when open */}
      <button
        style={styles.handle}
        onClick={(e) => {
          e.stopPropagation();
          if (canToggle) setPanelVisible(!panelVisible);
        }}
        aria-label={panelVisible ? 'Close responses' : 'Open responses'}
      >
        {panelVisible
          ? <CaretLeft size={14} color="rgba(0,0,0,0.45)" />
          : <div style={styles.handlePill} />}
      </button>

      {!panelVisible && (
        <span style={styles.sideLabel}>Responses</span>
      )}

      {panelVisible && (
        <>
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
    alignItems: 'center',
    padding: '16px 0 8px',
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  handlePill: {
    width: 4,
    height: 32,
    borderRadius: 'var(--radius-full)',
    background: 'rgba(0,0,0,0.18)',
  },
  sideLabel: {
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(0,0,0,0.7)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    marginTop: 14,
    alignSelf: 'center',
  },
};
