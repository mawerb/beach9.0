import { motion, AnimatePresence } from 'framer-motion';
import { useARStore } from '../../stores/arStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { RELATIONSHIP_COLORS } from '../../mock/mockData';

export default function InfoCard({ containerRef }) {
  const currentFace = useARStore((s) => s.currentFace);
  const currentPerson = useARStore((s) => s.currentPerson);
  const detectionStatus = useARStore((s) => s.detectionStatus);
  const confidenceScore = useARStore((s) => s.confidenceScore);
  const userMode = useSettingsStore((s) => s.userMode);

  if (!currentFace || !currentPerson || detectionStatus === 'idle') return null;

  const container = containerRef?.current;
  if (!container) return null;

  const rect = container.getBoundingClientRect();
  const cardX = currentFace.x * rect.width + currentFace.width * rect.width + 8;
  const cardY = currentFace.y * rect.height - 16;

  const isOccluded = detectionStatus === 'occluded';
  const isDementia = userMode === 'dementia';
  const cardHeight = isDementia ? 80 : 100;
  const accentColor = RELATIONSHIP_COLORS[currentPerson.relationshipType] || 'var(--color-sage)';

  const isLowConfidence = confidenceScore < 0.7;
  const displayName = isLowConfidence ? `${currentPerson.name}?` : currentPerson.name;

  const tetherStartX = cardX;
  const tetherStartY = cardY + cardHeight;
  const tetherEndX = (currentFace.x + currentFace.width) * rect.width;
  const tetherEndY = currentFace.y * rect.height;

  return (
    <AnimatePresence>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <line
            x1={tetherStartX}
            y1={tetherStartY}
            x2={tetherEndX}
            y2={tetherEndY}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeDasharray={isOccluded ? '2,4' : '4,4'}
            opacity={isOccluded ? 0.3 : 0.6}
          />
        </svg>

        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: isOccluded ? 0.4 : 1,
            x: cardX,
            y: Math.max(8, cardY),
          }}
          exit={{ y: cardY - 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          style={{
            ...styles.card,
            width: 220,
            height: cardHeight,
            borderColor: isLowConfidence ? 'var(--color-amber)' : 'var(--color-ar-border)',
            borderStyle: isLowConfidence ? 'dashed' : 'solid',
          }}
        >
          <div style={{ ...styles.accentBar, background: accentColor }} />

          <div style={styles.content}>
            <div style={styles.nameRow}>
              <span style={{ ...styles.name, fontSize: `var(--font-size-name)` }}>
                {displayName}
              </span>
              {!isDementia && confidenceScore > 0 && (
                <div style={styles.confidenceDots}>
                  {[0.3, 0.6, 0.9].map((threshold, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.dot,
                        background:
                          confidenceScore >= threshold
                            ? 'var(--color-ar-text)'
                            : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <span
              style={{
                ...styles.badge,
                background: accentColor,
              }}
            >
              {currentPerson.relationship}
            </span>

            {!isDementia && currentPerson.lastConversationTopic && (
              <p style={styles.lastTopic}>
                Last talked about: {currentPerson.lastConversationTopic}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const styles = {
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'var(--color-ar-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: '8px 12px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    color: 'var(--color-ar-text)',
    lineHeight: 1.2,
  },
  confidenceDots: {
    display: 'flex',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 10,
    borderRadius: 2,
  },
  badge: {
    display: 'inline-block',
    marginTop: 4,
    padding: '1px 8px',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 500,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  lastTopic: {
    marginTop: 4,
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 300,
    fontStyle: 'italic',
    color: 'var(--color-ar-muted)',
    lineHeight: 1.3,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
};
