import { useRef, useState, useEffect } from 'react';
import SuggestionCard from './SuggestionCard';

export default function SuggestionCarousel({ suggestions, onSelect }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const totalCards = suggestions.length || 3;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollLeft / 248);
      setActiveIndex(idx);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  if (suggestions.length === 0) {
    return (
      <div style={styles.container} ref={scrollRef}>
        {[0, 1, 2].map((i) => (
          <SuggestionCard key={i} isLoading />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={styles.container} ref={scrollRef}>
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div style={styles.dots}>
        {suggestions.map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.dot,
              background: i === activeIndex ? 'var(--color-ar-text)' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    padding: '0 16px',
    scrollbarWidth: 'none',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 0 4px',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    transition: 'background 200ms',
  },
};
