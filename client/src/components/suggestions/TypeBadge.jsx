export default function TypeBadge({ type }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        color: 'var(--color-ink3)',
        background: 'rgba(255,255,255,0.08)',
      }}
      role="text"
    >
      {type === 'question' ? 'Question ↗' : 'Statement'}
    </span>
  );
}
