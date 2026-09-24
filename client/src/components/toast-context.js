// Context and consumer hook, split from ToastProvider for the same reason as
// auth-context.js: a component-only module hot-reloads cleanly, a mixed one
// does not. See that file for the full explanation.
import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
