import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useARStore } from '../../stores/arStore';

export default function StatusPill({ onEndConversation }) {
  const detectionStatus = useARStore((s) => s.detectionStatus);
  const currentPerson = useARStore((s) => s.currentPerson);

  let text = 'Looking for someone nearby';
  let showPulse = true;
  let showClose = false;

  if (detectionStatus === 'found' && currentPerson) {
    text = currentPerson.name;
    showPulse = false;
    showClose = true;
  } else if (detectionStatus === 'unknown') {
    text = 'New person detected';
    showPulse = false;
  } else if (detectionStatus === 'detecting') {
    text = 'Detecting…';
  }

  return (
    <div style={styles.wrapper}>
      <motion.div
        style={styles.pill}
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {showPulse && <div style={styles.pulseDot} />}

        <AnimatePresence mode="wait">
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={styles.text}
          >
            {text}
          </motion.span>
        </AnimatePresence>

        {showClose && (
          <button
            style={styles.closeBtn}
            onClick={onEndConversation}
            aria-label="End conversation"
          >
            <X size={14} weight="bold" color="var(--color-ar-text)" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.28)',
    borderRadius: 'var(--radius-full)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.22)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-sage)',
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  text: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-ar-text)',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 4,
  },
};
