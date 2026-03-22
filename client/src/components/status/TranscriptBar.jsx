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
        <ChatText size={14} color="rgba(0,0,0,0.6)" />
        <span style={styles.tabLabel}>Transcript</span>
        {isLive && <div style={styles.liveDot} />}
      </button>

      {/* Panel content */}
      <div style={styles.panel}>
        <div style={styles.header}>
          {isLive ? (
            <>
              <Microphone size={13} weight="fill" color="var(--color-sage)" />
              <span style={styles.headerLabel}>Live</span>
            </>
          ) : (
            <span style={styles.inactiveBubble}>
              <MicrophoneSlash size={11} color="var(--color-amber)" />
              <span style={styles.inactiveLabel}>Mic off</span>
            </span>
          )}
        </div>

        <div style={styles.scrollArea} ref={scrollRef}>
          {lines.length === 0 ? (
            <p style={styles.empty}>No transcript yet…</p>
          ) : (
            lines.map((line) => {
              const isUser = line.speaker === 'user';
              return (
                <div
                  key={line.lineId}
                  style={{
                    ...styles.bubbleRow,
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      background: isUser ? '#d1fae5' : '#dbeafe',
                      borderRadius: isUser
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                      opacity: line.isFinal ? 1 : 0.6,
                    }}
                  >
                    <span style={{
                      ...styles.bubbleSender,
                      color: isUser ? '#065f46' : '#1e40af',
                    }}>
                      {isUser ? 'You' : 'Them'}
                    </span>
                    <span style={{
                      ...styles.bubbleText,
                      fontStyle: line.isFinal ? 'normal' : 'italic',
                      color: '#000',
                    }}>
                      {line.text}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 72,
    right: 0,
    width: PANEL_WIDTH,
    height: 'calc(100dvh - 72px - 80px)',
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
    justifyContent: 'flex-start',
    paddingTop: 16,
    gap: 6,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    borderRadius: '12px 0 0 12px',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRight: 'none',
    cursor: 'pointer',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  tabPill: {
    width: 3,
    height: 24,
    borderRadius: 9999,
    background: 'rgba(0,0,0,0.2)',
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
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    flexShrink: 0,
  },
  headerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(0,0,0,0.5)',
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
    color: 'rgba(0,0,0,0.45)',
    fontStyle: 'italic',
  },
  bubbleRow: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '85%',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  bubbleSender: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  bubbleText: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.45,
    color: '#000',
  },
  tabLabel: {
    writingMode: 'vertical-rl',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    color: '#ca8a04',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  inactiveBubble: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'var(--color-amber-light)',
    borderRadius: 'var(--radius-full)',
    padding: '2px 8px 2px 6px',
  },
  inactiveLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--color-amber)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
};
