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
        color: 'rgba(0,0,0,0.75)',
        background: 'rgba(0,0,0,0.08)',
      }}
      role="text"
    >
      {type === 'question' ? 'Question ↗' : 'Statement'}
    </span>
  );
}
