import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import ARViewScreen from './components/ar/ARViewScreen';
import HomeScreen from './components/home/HomeScreen';
import ModeSelectionScreen from './components/onboarding/ModeSelectionScreen';
import PeopleScreen from './components/people/PeopleScreen';
import PersonProfileScreen from './components/people/PersonProfileScreen';
import ConversationSummaryScreen from './components/summary/ConversationSummaryScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import BottomTabBar from './components/layout/BottomTabBar';
import { House } from '@phosphor-icons/react';

function HomeButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/camera' || location.pathname === '/home') return null;
  return (
    <button
      onClick={() => navigate('/home')}
      aria-label="Go to home"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 9999,
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.75)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <House size={15} weight="fill" color="rgba(255,255,255,0.75)" />
      InTouch
    </button>
  );
}

function AppRoutes() {
  const userMode = useSettingsStore((s) => s.userMode);

  useEffect(() => {
    if (userMode) {
      document.documentElement.setAttribute('data-theme', userMode);
    }
  }, [userMode]);

  if (!userMode) {
    return (
      <Routes>
        <Route path="/home" element={<HomeScreen />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/camera" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/camera" element={<ARViewScreen />} />
        <Route path="/onboarding" element={<ModeSelectionScreen />} />
        <Route path="/people" element={<PeopleScreen />} />
        <Route path="/people/:id" element={<PersonProfileScreen />} />
        <Route path="/summary/:id" element={<ConversationSummaryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/camera" replace />} />
      </Routes>
      <HomeButton />
      <BottomTabBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
