import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, MagnifyingGlass, ArrowUp, ArrowDown, CaretDown, CheckCircle, Users } from '@phosphor-icons/react';
import { useSettingsStore } from '../../stores/settingsStore';
import { RELATIONSHIP_COLORS } from '../../mock/mockData';

const FILTER_TYPES = [
  { value: null,        label: 'All' },
  { value: 'family',   label: 'Family' },
  { value: 'medical',  label: 'Medical' },
  { value: 'social',   label: 'Social' },
  { value: 'colleague',label: 'Colleague' },
  { value: 'other',    label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Spoken' },
  { value: 'name',   label: 'Name' },
];

function PersonDetail({ person }) {
  if (!person) {
    return (
      <div style={styles.emptyDetail}>
        <Users size={40} color="rgba(255,255,255,0.12)" />
        <p style={styles.emptyDetailText}>Select a person to see their description</p>
      </div>
    );
  }

  const accentColor = RELATIONSHIP_COLORS[person.relationshipType] || 'rgba(255,255,255,0.2)';

  return (
    <div style={styles.detail}>
      {/* Avatar + name */}
      <div style={styles.detailProfile}>
        <div style={{ ...styles.detailAvatar, background: accentColor }}>
          <span style={styles.detailInitials}>
            {person.name.split(' ').map((n) => n[0]).join('')}
          </span>
        </div>
        <h2 style={styles.detailName}>{person.name}</h2>
        <span style={{ ...styles.detailBadge, background: accentColor }}>
          {person.relationship}
        </span>
      </div>

      {/* Notes */}
      {person.notes && (
        <p style={styles.detailNotes}>{person.notes}</p>
      )}

      {/* Interests */}
      {person.interests?.length > 0 && (
        <div style={styles.detailSection}>
          <h3 style={styles.detailSectionTitle}>Interests</h3>
          <div style={styles.detailPills}>
            {person.interests.map((interest) => (
              <span key={interest} style={styles.detailPill}>{interest}</span>
            ))}
          </div>
        </div>
      )}

      {/* Conversation history */}
      {person.conversationHistory?.length > 0 && (
        <div style={styles.detailSection}>
          <h3 style={styles.detailSectionTitle}>Conversation History</h3>
          <div style={styles.timeline}>
            {person.conversationHistory.map((conv, i) => (
              <div key={i} style={{ ...styles.timelineItem, borderColor: accentColor + '55' }}>
                <span style={styles.timelineDate}>
                  {new Date(conv.date).toLocaleDateString(undefined, {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
                <p style={styles.timelineSummary}>{conv.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PeopleScreen() {
  const people = useSettingsStore((s) => s.people);

  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState(null);
  const [sortBy, setSortBy]         = useState('recent');
  const [sortDir, setSortDir]       = useState('desc');
  const [sortOpen, setSortOpen]     = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const visible = useMemo(() => {
    let list = people.filter((p) => {
      if (filterType && p.relationshipType !== filterType) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const dateA = a.conversationHistory?.[0]?.date ? new Date(a.conversationHistory[0].date) : new Date(0);
      const dateB = b.conversationHistory?.[0]?.date ? new Date(b.conversationHistory[0].date) : new Date(0);
      const cmp = dateA - dateB;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [people, search, filterType, sortBy, sortDir]);

  const selectedPerson = people.find((p) => p.id === selectedId) ?? null;

  return (
    <div style={styles.root}>
      <div style={styles.screen}>
        {/* Page header */}
        <div style={styles.header}>
          <h1 style={styles.title}>People</h1>
          <button style={styles.addBtn} aria-label="Add person">
            <Plus size={20} weight="bold" color="rgba(255,255,255,0.9)" />
          </button>
        </div>

        {/* Split panel */}
        <div style={styles.splitPanel}>

          {/* ── Left nav ── */}
          <div style={styles.nav}>
            {/* Search */}
            <div style={styles.searchRow}>
              <MagnifyingGlass size={14} color="rgba(255,255,255,0.4)" />
              <input
                style={styles.searchInput}
                placeholder="Search people…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter chips */}
            <div style={styles.filterRow}>
              {FILTER_TYPES.map(({ value, label }) => {
                const isActive = filterType === value;
                const accentColor = value ? RELATIONSHIP_COLORS[value] : 'var(--color-sage)';
                return (
                  <button
                    key={String(value)}
                    style={{
                      ...styles.filterChip,
                      background: isActive ? accentColor : 'rgba(255,255,255,0.06)',
                      borderColor: isActive ? accentColor : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                    onClick={() => setFilterType(filterType === value ? null : value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Sort controls */}
            <div style={styles.sortRow}>
              <div ref={sortRef} style={{ position: 'relative', flex: 1 }}>
                <button style={styles.sortBtn} onClick={() => setSortOpen((o) => !o)}>
                  <span style={styles.sortBtnLabel}>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
                  <CaretDown
                    size={12}
                    color="rgba(255,255,255,0.5)"
                    style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                  />
                </button>
                {sortOpen && (
                  <div style={styles.dropdown}>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        style={{
                          ...styles.dropdownItem,
                          color: sortBy === opt.value ? 'var(--color-sage)' : 'rgba(255,255,255,0.8)',
                          background: sortBy === opt.value ? 'rgba(74,124,111,0.15)' : 'transparent',
                        }}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                      >
                        {sortBy === opt.value && <CheckCircle size={12} weight="fill" color="var(--color-sage)" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                style={styles.dirBtn}
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                aria-label="Toggle sort direction"
              >
                {sortDir === 'asc'
                  ? <ArrowUp size={13} color="rgba(255,255,255,0.7)" />
                  : <ArrowDown size={13} color="rgba(255,255,255,0.7)" />}
                <span style={styles.dirLabel}>{sortDir === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>
            </div>

            {/* Person list */}
            <div style={styles.list}>
              {visible.length === 0 ? (
                <p style={styles.empty}>No people found.</p>
              ) : (
                visible.map((person) => {
                  const isSelected = person.id === selectedId;
                  const accentColor = RELATIONSHIP_COLORS[person.relationshipType] || 'rgba(255,255,255,0.2)';
                  return (
                    <button
                      key={person.id}
                      style={{
                        ...styles.row,
                        background: isSelected ? 'rgba(74,124,111,0.15)' : 'rgba(255,255,255,0.04)',
                        borderColor: isSelected ? 'rgba(74,124,111,0.5)' : 'rgba(255,255,255,0.08)',
                      }}
                      onClick={() => setSelectedId(isSelected ? null : person.id)}
                    >
                      <div style={{ ...styles.avatar, background: accentColor }}>
                        <span style={styles.initials}>
                          {person.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div style={styles.info}>
                        <span style={{
                          ...styles.name,
                          color: isSelected ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
                        }}>
                          {person.name}
                        </span>
                        <span style={styles.rel}>{person.relationship}</span>
                      </div>
                      {person.conversationHistory?.[0] && (
                        <span style={styles.date}>
                          {new Date(person.conversationHistory[0].date).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={styles.divider} />

          {/* ── Right detail ── */}
          <div style={styles.detailPane}>
            <PersonDetail person={selectedPerson} />
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100dvh',
    width: '100%',
    background: '#0a0e14',
  },
  screen: {
    padding: '24px 20px 0',
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.95)',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  /* Split panel container */
  splitPanel: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    height: 'calc(100dvh - 196px)',
  },

  /* Left nav column */
  nav: {
    width: 260,
    flexShrink: 0,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  divider: {
    width: 1,
    background: 'rgba(255,255,255,0.08)',
    flexShrink: 0,
  },

  /* Right detail column */
  detailPane: {
    flex: 1,
    overflowY: 'auto',
    minWidth: 0,
  },

  /* Empty detail state */
  emptyDetail: {
    height: '100%',
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyDetailText: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },

  /* Person detail content */
  detail: {
    padding: '24px 20px',
  },
  detailProfile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  detailAvatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInitials: {
    fontFamily: 'var(--font-body)',
    fontSize: 22,
    fontWeight: 600,
    color: '#fff',
  },
  detailName: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.95)',
  },
  detailBadge: {
    padding: '3px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: 12,
    fontWeight: 500,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailNotes: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.65,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  detailPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailPill: {
    padding: '4px 12px',
    background: 'rgba(74,124,111,0.18)',
    border: '1px solid rgba(74,124,111,0.35)',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    color: 'var(--color-sage)',
    fontWeight: 500,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  timelineItem: {
    borderLeft: '2px solid',
    paddingLeft: 14,
  },
  timelineDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    display: 'block',
    marginBottom: 3,
  },
  timelineSummary: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.55,
  },

  /* Nav controls */
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  filterRow: {
    display: 'flex',
    gap: 5,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    paddingBottom: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  },
  sortRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sortBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7,
    padding: '6px 10px',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    cursor: 'pointer',
  },
  sortBtnLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'rgba(18,22,30,0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 50,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    width: '100%',
    padding: '9px 12px',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  dirBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7,
    padding: '6px 9px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  dirLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflowY: 'auto',
  },
  empty: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 24,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 10px',
    border: '1px solid',
    borderRadius: 10,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'background 150ms, border-color 150ms',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rel: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
};
