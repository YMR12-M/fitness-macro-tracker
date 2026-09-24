import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute.jsx';
import { FullPageSpinner } from './components/Spinner.jsx';
import { useAuth } from './auth/auth-context.js';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { RegisterPage } from './features/auth/RegisterPage.jsx';
import { DashboardPage } from './features/dashboard/DashboardPage.jsx';

// Chart-heavy routes load on demand so the dashboard's first paint stays quick.
const FoodLogPage = lazy(() => import('./features/log/FoodLogPage.jsx').then((m) => ({ default: m.FoodLogPage })));
const WorkoutsPage = lazy(() =>
  import('./features/workouts/WorkoutsPage.jsx').then((m) => ({ default: m.WorkoutsPage }))
);
const ProgressPage = lazy(() =>
  import('./features/progress/ProgressPage.jsx').then((m) => ({ default: m.ProgressPage }))
);
const GoalsPage = lazy(() => import('./features/goals/GoalsPage.jsx').then((m) => ({ default: m.GoalsPage })));
const CalculatorPage = lazy(() =>
  import('./features/calculator/CalculatorPage.jsx').then((m) => ({ default: m.CalculatorPage }))
);
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage }))
);

export function App() {
  const { user } = useAuth();

  // The theme lives on the user's profile, so it follows them between devices.
  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme ?? 'dark';
  }, [user?.theme]);

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="log" element={<FoodLogPage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
