import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Users, GearSix } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const TABS = [
  { path: '/camera', label: 'Camera', icon: Camera },
  { path: '/people', label: 'People', icon: Users },
  { path: '/settings', label: 'Settings', icon: GearSix },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/home') return null;

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
              color: isActive ? 'var(--color-sage)' : 'rgba(255,255,255,0.45)',
            }}
            onClick={() => navigate(tab.path)}
          >
            {isActive && (
              <motion.div
                layoutId="tabIndicator"
                style={styles.indicator}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
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
    background: 'rgba(10, 14, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.12)',
    zIndex: 20,
  },
  tab: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '8px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'color 200ms ease',
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    margin: '0 auto',
    width: 24,
    height: 2,
    borderRadius: 2,
    background: 'var(--color-sage)',
  },
};
