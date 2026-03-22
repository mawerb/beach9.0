import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import ToneBadge from './ToneBadge';
import TypeBadge from './TypeBadge';

export default function SuggestionCard({ suggestion, onSelect, isLoading }) {
  const [pressed, setPressed] = useState(false);

  if (isLoading) {
    return (
      <div style={styles.card}>
        <div className="skeleton" style={{ width: 60, height: 16, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '90%', height: 16, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '70%', height: 16 }} />
      </div>
    );
  }

  return (
    <motion.div
      style={{
        ...styles.card,
        borderColor: pressed ? 'var(--color-sage)' : 'rgba(255,255,255,0.22)',
        background: pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.1)',
      }}
      whileTap={{ scale: 0.97 }}
      onTapStart={() => setPressed(true)}
      onTap={() => {
        onSelect(suggestion.id);
        setTimeout(() => setPressed(false), 300);
      }}
      onTapCancel={() => setPressed(false)}
    >
      <div style={styles.topRow}>
        <ToneBadge tone={suggestion.tone} />
        <TypeBadge type={suggestion.type} />
      </div>

      <p style={styles.text}>{suggestion.text}</p>

      <div style={styles.arrow}>
        <ArrowRight size={14} color="rgba(0,0,0,0.4)" />
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    flex: '0 0 auto',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.18)',
    borderRadius: 'var(--radius-lg)',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    userSelect: 'none',
    scrollSnapAlign: 'start',
    transition: 'border-color 80ms ease',
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    fontFamily: 'var(--font-body)',
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.5,
    color: '#000',
    flex: 1,
  },
  arrow: {
    position: 'absolute',
    bottom: 10,
    right: 14,
  },
};
