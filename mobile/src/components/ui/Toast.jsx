// Toast queue. Announcements go through an aria-live region so screen readers
// get the same confirmation sighted users see, and each one fires the haptic
// that matches its tone — a phone confirms by feel as well as by sight.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toast-context.js';
import { haptic } from '../../lib/haptics.js';

const DISMISS_AFTER_MS = 3200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, tone = 'success') => {
      const id = nextId.current++;
      haptic(tone === 'error' ? 'warn' : 'success');
      setToasts((current) => [...current, { id, message, tone }]);
      timers.current.set(id, setTimeout(() => dismiss(id), DISMISS_AFTER_MS));
      return id;
    },
    [dismiss]
  );

  // Clear every pending timer on unmount so none fires against a torn-down tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info')
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className={`toast toast-${toast.tone}`}
            // Tapping a toast dismisses it — on a phone it sits right where the
            // next tap is likely to land, so it must be possible to get it out
            // of the way without waiting.
            onClick={() => dismiss(toast.id)}
          >
            <span aria-hidden="true">{toast.tone === 'error' ? '⚠️' : toast.tone === 'info' ? 'ℹ️' : '✅'}</span>
            <span>{toast.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
