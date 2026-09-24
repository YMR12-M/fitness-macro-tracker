import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute.jsx';
import { FullPageSpinner } from './components/ui/Spinner.jsx';
import { useAuth } from './auth/auth-context.js';
import { LoginScreen } from './features/auth/LoginScreen.jsx';
import { RegisterScreen } from './features/auth/RegisterScreen.jsx';
import { TodayScreen } from './features/today/TodayScreen.jsx';

// Split off the routes a cold start does not need. This matters more here than
// on the desktop client: a phone on mobile data pays for every kilobyte of the
// first paint, and Today is the only screen most sessions ever open.
const LogScreen = lazy(() => import('./features/log/LogScreen.jsx').then((m) => ({ default: m.LogScreen })));
const TrainScreen = lazy(() => import('./features/train/TrainScreen.jsx').then((m) => ({ default: m.TrainScreen })));
const ProgressScreen = lazy(() =>
  import('./features/progress/ProgressScreen.jsx').then((m) => ({ default: m.ProgressScreen }))
);
const MoreScreen = lazy(() => import('./features/more/MoreScreen.jsx').then((m) => ({ default: m.MoreScreen })));
const GoalsScreen = lazy(() => import('./features/goals/GoalsScreen.jsx').then((m) => ({ default: m.GoalsScreen })));
const CalculatorScreen = lazy(() =>
  import('./features/calculator/CalculatorScreen.jsx').then((m) => ({ default: m.CalculatorScreen }))
);
const SettingsScreen = lazy(() =>
  import('./features/settings/SettingsScreen.jsx').then((m) => ({ default: m.SettingsScreen }))
);

export function App() {
  const { user } = useAuth();

  // The theme lives on the user's profile, so it follows them between devices —
  // and between this client and the desktop one.
  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme ?? 'dark';
  }, [user?.theme]);

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<TodayScreen />} />
            <Route path="log" element={<LogScreen />} />
            <Route path="train" element={<TrainScreen />} />
            <Route path="progress" element={<ProgressScreen />} />
            <Route path="more" element={<MoreScreen />} />
            <Route path="goals" element={<GoalsScreen />} />
            <Route path="calculator" element={<CalculatorScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

/**
 * Reset the scroll position on navigation.
 *
 * The shell scrolls the document rather than a per-screen container, so without
 * this, switching from a scrolled Today to Log lands halfway down the new
 * screen. Browsers restore scroll on history navigation, which is correct, but
 * they cannot tell a tab switch from a back button — so this only resets on
 * PUSH, leaving POP alone.
 */
function ScrollToTop() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    if (window.history.state?.idx === 0 || performance.getEntriesByType('navigation')[0]?.type === 'reload') return;
    window.scrollTo(0, 0);
  }, [pathname, key]);

  return null;
}
