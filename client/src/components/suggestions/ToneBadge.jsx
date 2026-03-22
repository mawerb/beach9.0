import { TONE_COLORS } from '../../mock/mockData';

export default function ToneBadge({ tone }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#fff',
        background: TONE_COLORS[tone] || 'var(--color-ink3)',
      }}
      role="text"
    >
      {tone}
    </span>
  );
}
