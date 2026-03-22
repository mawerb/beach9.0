import { useRef } from 'react';
import SuggestionCard from './SuggestionCard';

export default function SuggestionCarousel({ suggestions, onSelect }) {
  const scrollRef = useRef(null);

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
    <div style={styles.container} ref={scrollRef}>
      {suggestions.map((s) => (
        <SuggestionCard
          key={s.id}
          suggestion={s}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    scrollSnapType: 'y mandatory',
    padding: '0 8px 8px',
    scrollbarWidth: 'none',
    flex: 1,
  },
};
