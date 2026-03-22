import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Microphone, MicrophoneSlash } from '@phosphor-icons/react';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { useSettingsStore } from '../../stores/settingsStore';

export default function TranscriptBar() {
  const lines = useTranscriptStore((s) => s.lines);
  const isLive = useTranscriptStore((s) => s.isLive);
  const userMode = useSettingsStore((s) => s.userMode);
  const [expanded, setExpanded] = useState(false);

  const isDementia = userMode === 'dementia';
  const [visible, setVisible] = useState(!isDementia);

  if (isDementia && !visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={styles.micToggle}
        aria-label="Show transcript"
      >
        <Microphone size={20} color="var(--color-ar-text)" />
      </button>
    );
  }

  const recentLines = expanded ? lines : lines.slice(-2);

  return (
    <div style={styles.wrapper}>
      <div style={styles.bar} onClick={() => setExpanded(!expanded)}>
        <div style={styles.header}>
          {isLive ? (
            <Microphone size={16} weight="fill" color="var(--color-sage)" />
          ) : (
            <MicrophoneSlash size={16} color="var(--color-amber)" />
          )}
          <span style={styles.label}>
            {isLive ? 'Listening…' : 'Mic inactive'}
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {recentLines.map((line) => (
            <motion.div
              key={line.lineId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={styles.line}
            >
              <span style={styles.speaker}>
                {line.speaker === 'user' ? 'You' : 'Them'}:
              </span>
              <span style={{
                ...styles.lineText,
                fontStyle: line.isFinal ? 'normal' : 'italic',
                color: line.isFinal ? 'var(--color-ar-text)' : 'var(--color-ar-muted)',
              }}>
                {line.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 8,
  },
  bar: {
    background: 'var(--color-ar-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--color-ar-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '8px 12px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-ar-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  line: {
    display: 'flex',
    gap: 6,
    padding: '2px 0',
  },
  speaker: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-sage)',
    flexShrink: 0,
  },
  lineText: {
    fontSize: 14,
    lineHeight: 1.4,
  },
  micToggle: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 8,
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--color-ar-bg)',
    border: '1px solid var(--color-ar-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};
