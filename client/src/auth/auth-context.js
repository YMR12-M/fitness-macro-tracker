// Context and consumer hook, kept out of AuthProvider.jsx on purpose.
//
// React Fast Refresh only works on a module whose exports are all components.
// Mixing the provider component with a hook forces Vite to invalidate the whole
// module instead — which also hands `useAuth` a freshly created context while
// the mounted tree still holds the previous one, so every edit threw
// "useAuth must be used inside <AuthProvider>" and dropped the app into the
// error boundary. Splitting them keeps the context identity stable and lets
// AuthProvider.jsx hot-reload properly.
import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
