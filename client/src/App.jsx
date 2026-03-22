import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import ARViewScreen from './components/ar/ARViewScreen';
import ModeSelectionScreen from './components/onboarding/ModeSelectionScreen';
import PeopleScreen from './components/people/PeopleScreen';
import PersonProfileScreen from './components/people/PersonProfileScreen';
import ConversationSummaryScreen from './components/summary/ConversationSummaryScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import BottomTabBar from './components/layout/BottomTabBar';

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
        <Route path="*" element={<ModeSelectionScreen />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/camera" replace />} />
        <Route path="/camera" element={<ARViewScreen />} />
        <Route path="/onboarding" element={<ModeSelectionScreen />} />
        <Route path="/people" element={<PeopleScreen />} />
        <Route path="/people/:id" element={<PersonProfileScreen />} />
        <Route path="/summary/:id" element={<ConversationSummaryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/camera" replace />} />
      </Routes>
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
