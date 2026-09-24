// Session state for the whole app. The server is the source of truth — this
// only mirrors who is signed in, and re-asks on mount so a refreshed tab does
// not lose the session that its cookies still hold.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auth as authApi } from '../api/endpoints.js';
import { ApiError } from '../api/client.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then(({ user: current }) => {
        if (cancelled) return;
        setUser(current);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (cancelled) return;
        // A 401 here is the normal "not signed in" case, not a failure.
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.warn('Session check failed:', error.message);
        }
        setStatus('anonymous');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { user: current } = await authApi.login(credentials);
      setUser(current);
      setStatus('authenticated');
      return current;
    },
    []
  );

  const register = useCallback(async (payload) => {
    const { user: current } = await authApi.register(payload);
    setUser(current);
    setStatus('authenticated');
    return current;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
      // Drop every cached query so the next account never sees this one's data.
      queryClient.clear();
    }
  }, [queryClient]);

  /** Called after a profile save so the header and targets update immediately. */
  const updateUser = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, register, logout, updateUser }),
    [user, status, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

