import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, ArrowUp, ArrowDown, CaretDown, CheckCircle } from '@phosphor-icons/react';
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

export default function PeopleScreen() {
  const people = useSettingsStore((s) => s.people);
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState(null);
  const [sortBy, setSortBy]         = useState('recent');
  const [sortDir, setSortDir]       = useState('desc');
  const [sortOpen, setSortOpen]     = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const SORT_OPTIONS = [
    { value: 'recent', label: 'Recently Spoken' },
    { value: 'name',   label: 'Name' },
  ];

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

  return (
    <div style={styles.root}>
    <div style={styles.screen}>
      <div style={styles.header}>
        <h1 style={styles.title}>People</h1>
        <button style={styles.addBtn} aria-label="Add person">
          <Plus size={20} weight="bold" color="rgba(255,255,255,0.9)" />
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchRow}>
        <MagnifyingGlass size={15} color="rgba(255,255,255,0.4)" />
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
                background: isActive ? accentColor : 'rgba(255,255,255,0.07)',
                borderColor: isActive ? accentColor : 'rgba(255,255,255,0.12)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
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
              size={13}
              color="rgba(255,255,255,0.6)"
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
                  {sortBy === opt.value && <CheckCircle size={13} weight="fill" color="var(--color-sage)" />}
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
          title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortDir === 'asc'
            ? <ArrowUp size={15} color="rgba(255,255,255,0.8)" />
            : <ArrowDown size={15} color="rgba(255,255,255,0.8)" />}
          <span style={styles.dirLabel}>{sortDir === 'asc' ? 'Asc' : 'Desc'}</span>
        </button>
      </div>

      {/* List */}
      <div style={styles.list}>
        {visible.length === 0 ? (
          <p style={styles.empty}>No people found.</p>
        ) : (
          visible.map((person) => (
            <button
              key={person.id}
              style={styles.row}
              onClick={() => navigate(`/people/${person.id}`)}
            >
              <div
                style={{
                  ...styles.avatar,
                  background: RELATIONSHIP_COLORS[person.relationshipType] || 'rgba(255,255,255,0.2)',
                }}
              >
                <span style={styles.initials}>
                  {person.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div style={styles.info}>
                <span style={styles.name}>{person.name}</span>
                <span style={styles.rel}>{person.relationship}</span>
              </div>
              {person.conversationHistory?.[0] && (
                <span style={styles.date}>
                  {new Date(person.conversationHistory[0].date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </button>
          ))
        )}
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
    padding: '24px 16px 100px',
    maxWidth: 480,
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
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '9px 14px',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    '::placeholder': { color: 'rgba(255,255,255,0.35)' },
  },
  filterRow: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    paddingBottom: 12,
  },
  filterChip: {
    padding: '5px 13px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  },
  sortRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sortBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: '7px 12px',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    cursor: 'pointer',
  },
  sortBtnLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'rgba(18,22,30,0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 50,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  dirBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: '7px 12px',
    cursor: 'pointer',
  },
  dirLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  empty: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 40,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  name: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.92)',
  },
  rel: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
};
