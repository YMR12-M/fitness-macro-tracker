import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context.js';
import { FullPageSpinner } from '../components/Spinner.jsx';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  // Wait for the session check before deciding — redirecting during `loading`
  // would bounce every signed-in user to /login on a hard refresh.
  if (status === 'loading') return <FullPageSpinner label="Checking your session" />;

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** The inverse: keeps a signed-in user off the login and signup screens. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner label="Checking your session" />;
  if (status === 'authenticated') return <Navigate to={location.state?.from ?? '/'} replace />;

  return <Outlet />;
}
