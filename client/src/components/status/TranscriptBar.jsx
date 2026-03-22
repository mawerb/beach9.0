import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Microphone, MicrophoneSlash, ChatText } from '@phosphor-icons/react';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { useSettingsStore } from '../../stores/settingsStore';

const PANEL_WIDTH = 240;
const TAB_WIDTH = 32;

export default function TranscriptBar() {
  const lines = useTranscriptStore((s) => s.lines);
  const isLive = useTranscriptStore((s) => s.isLive);
  const userMode = useSettingsStore((s) => s.userMode);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <motion.div
      animate={{ x: open ? 0 : PANEL_WIDTH - TAB_WIDTH }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={styles.container}
    >
      {/* Tab handle — always visible on the right edge */}
      <button style={styles.tab} onClick={() => setOpen((o) => !o)} aria-label="Toggle transcript">
        <div style={styles.tabPill} />
        <ChatText size={14} color="rgba(255,255,255,0.8)" />
        {isLive && <div style={styles.liveDot} />}
      </button>

      {/* Panel content */}
      <div style={styles.panel}>
        <div style={styles.header}>
          {isLive ? (
            <Microphone size={13} weight="fill" color="var(--color-sage)" />
          ) : (
            <MicrophoneSlash size={13} color="var(--color-amber)" />
          )}
          <span style={styles.headerLabel}>{isLive ? 'Live' : 'Inactive'}</span>
        </div>

        <div style={styles.scrollArea} ref={scrollRef}>
          {lines.length === 0 ? (
            <p style={styles.empty}>No transcript yet…</p>
          ) : (
            lines.map((line) => (
              <div key={line.lineId} style={styles.line}>
                <span
                  style={{
                    ...styles.speaker,
                    color:
                      line.speaker === 'user'
                        ? 'var(--color-sage)'
                        : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {line.speaker === 'user' ? 'You' : 'Them'}
                </span>
                <span
                  style={{
                    ...styles.lineText,
                    fontStyle: line.isFinal ? 'normal' : 'italic',
                    opacity: line.isFinal ? 1 : 0.6,
                  }}
                >
                  {line.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '50%',
    right: 0,
    transform: 'translateY(-50%)',
    width: PANEL_WIDTH,
    maxHeight: '60vh',
    zIndex: 9,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    pointerEvents: 'auto',
  },
  tab: {
    width: TAB_WIDTH,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    borderRadius: '12px 0 0 12px',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRight: 'none',
    cursor: 'pointer',
    padding: '12px 0',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  tabPill: {
    width: 3,
    height: 24,
    borderRadius: 9999,
    background: 'rgba(255,255,255,0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--color-sage)',
    boxShadow: '0 0 6px var(--color-sage)',
  },
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderLeft: 'none',
    borderRadius: '0 12px 12px 0',
    overflow: 'hidden',
    boxShadow: '4px 0 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  headerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-ar-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px 12px',
    scrollbarWidth: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  empty: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-ar-muted)',
    fontStyle: 'italic',
  },
  line: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  speaker: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  lineText: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--color-ar-text)',
    lineHeight: 1.4,
  },
};
