import { motion, AnimatePresence } from 'framer-motion';
import { useARStore } from '../../stores/arStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { RELATIONSHIP_COLORS } from '../../mock/mockData';

export default function InfoCard({ containerRef }) {
  const currentFace = useARStore((s) => s.currentFace);
  const currentPerson = useARStore((s) => s.currentPerson);
  const detectionStatus = useARStore((s) => s.detectionStatus);
  const confidenceScore = useARStore((s) => s.confidenceScore);
  const synopsis = useARStore((s) => s.synopsis);
  const userMode = useSettingsStore((s) => s.userMode);

  if (!currentFace || !currentPerson || detectionStatus === 'idle') return null;

  const container = containerRef?.current;
  if (!container) return null;

  const rect = container.getBoundingClientRect();
  const cardX = currentFace.x * rect.width + currentFace.width * rect.width + 8;
  const cardY = currentFace.y * rect.height - 16;

  const isOccluded = detectionStatus === 'occluded';
  const isDementia = userMode === 'dementia';
  const accentColor = RELATIONSHIP_COLORS[currentPerson.relationshipType] || 'var(--color-sage)';

  const isLowConfidence = confidenceScore < 0.7;
  const displayName = isLowConfidence ? `${currentPerson.name}?` : currentPerson.name;

  const hasSynopsis = synopsis && synopsis.synopsis;
  const hasKeyPoints = synopsis && synopsis.key_points && synopsis.key_points.length > 0;
  const hasRecognitionCues = synopsis && synopsis.recognition_cues && synopsis.recognition_cues.length > 0;

  const tetherEndX = (currentFace.x + currentFace.width) * rect.width;
  const tetherEndY = currentFace.y * rect.height;

  return (
    <AnimatePresence>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <line
            x1={cardX}
            y1={Math.max(8, cardY) + 40}
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
            borderColor: isLowConfidence ? 'var(--color-amber)' : 'var(--color-ar-border)',
            borderStyle: isLowConfidence ? 'dashed' : 'solid',
          }}
        >
          <div style={{ ...styles.accentBar, background: accentColor }} />

          <div style={styles.content}>
            <div style={styles.nameRow}>
              <span style={{ ...styles.name, fontSize: 'var(--font-size-name)' }}>
                {displayName}
              </span>
              <span style={{ ...styles.relationshipBubble, background: accentColor }}>
                {currentPerson.relationship}
              </span>
            </div>

            {!isDementia && confidenceScore > 0 && (
              <div style={styles.confidenceDots}>
                {[0.3, 0.6, 0.9].map((threshold, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.dot,
                      background:
                        confidenceScore >= threshold
                          ? 'rgba(0,0,0,0.7)'
                          : 'rgba(0,0,0,0.15)',
                    }}
                  />
                ))}
              </div>
            )}

            {hasSynopsis && (
              <motion.p
                key={synopsis.synopsis}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.synopsisText}
              >
                {synopsis.synopsis}
              </motion.p>
            )}

            {hasKeyPoints && (
              <motion.div
                key={synopsis.key_points.join(',')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.keyPointsSection}
              >
                {synopsis.key_points.slice(0, 3).map((point, i) => (
                  <div key={i} style={styles.keyPoint}>
                    <span style={styles.keyPointBullet}>•</span>
                    <span style={styles.keyPointText}>{point}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {hasRecognitionCues && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.cuesSection}
              >
                <span style={styles.cuesLabel}>Remember</span>
                <span style={styles.cuesText}>
                  {synopsis.recognition_cues.slice(0, 2).join(' · ')}
                </span>
              </motion.div>
            )}

            {!hasSynopsis && !hasKeyPoints && (
              <p style={styles.placeholder}>Listening…</p>
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
    width: 230,
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    overflow: 'hidden',
    pointerEvents: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.22)',
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: '8px 12px 10px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    color: 'rgba(0,0,0,0.88)',
    lineHeight: 1.2,
  },
  relationshipBubble: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: 999,
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '0.03em',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
  },
  confidenceDots: {
    display: 'flex',
    gap: 3,
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 10,
    borderRadius: 2,
  },
  synopsisText: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1px solid rgba(0,0,0,0.08)',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 400,
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  keyPointsSection: {
    marginTop: 5,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  keyPoint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 5,
  },
  keyPointBullet: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    lineHeight: 1.35,
    flexShrink: 0,
  },
  keyPointText: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 400,
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 1.35,
  },
  cuesSection: {
    marginTop: 5,
    paddingTop: 5,
    borderTop: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  cuesLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(0,0,0,0.35)',
    flexShrink: 0,
  },
  cuesText: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(0,0,0,0.6)',
    fontStyle: 'italic',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  placeholder: {
    marginTop: 6,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 400,
    color: 'rgba(0,0,0,0.3)',
    fontStyle: 'italic',
  },
};
