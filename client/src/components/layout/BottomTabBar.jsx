import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Users, GearSix } from '@phosphor-icons/react';

const TABS = [
  { path: '/camera', label: 'Camera', icon: Camera },
  { path: '/people', label: 'People', icon: Users },
  { path: '/settings', label: 'Settings', icon: GearSix },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isARView = location.pathname === '/camera';
  if (isARView) return null;

  return (
    <nav style={styles.bar}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            style={{
              ...styles.tab,
              color: isActive ? 'var(--color-sage)' : 'var(--color-ink3)',
            }}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
            <span style={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    background: 'var(--color-paper)',
    borderTop: '1px solid var(--rule)',
    zIndex: 20,
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
  },
};
