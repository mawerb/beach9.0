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
        borderColor: pressed ? 'var(--color-sage)' : 'var(--color-ar-border)',
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
        <ArrowRight size={14} color="var(--color-ar-muted)" />
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    flex: '0 0 240px',
    height: 140,
    background: 'var(--color-ar-bg)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--color-ar-border)',
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
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
    color: 'var(--color-ar-text)',
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  arrow: {
    position: 'absolute',
    bottom: 10,
    right: 14,
  },
};
