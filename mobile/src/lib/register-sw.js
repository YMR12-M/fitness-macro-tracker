/**
 * Service worker registration.
 *
 * Registered in production builds only. A worker in front of the dev server
 * intercepts module requests and serves yesterday's copy of a file you just
 * edited, which turns every HMR update into a mystery — so in development this
 * does the opposite and actively tears down any worker left behind by a
 * production build previously opened on the same origin. On a phone testing
 * both, `localhost:5174` and a deployed build are different origins, but a
 * `vite preview` of `dist/` on the same host is not, and that is exactly the
 * case that strands a worker.
 *
 * Registration is deliberately an enhancement, never a dependency: every
 * failure path here leaves a perfectly working online app.
 */

const SW_URL = '/sw.js';

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    void unregisterAll();
    return;
  }

  // After `load`, so the worker's install — which downloads the whole precache
  // list — is not competing with the first screen for a phone's bandwidth.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch((error) => {
      console.warn('Service worker registration failed:', error.message);
    });
  });
}

async function unregisterAll() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    // Unregistering leaves the caches behind; without this they keep growing
    // across rebuilds and stay readable to anything else on the origin.
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('fittrack-mobile-')).map((name) => caches.delete(name)));
    }
  } catch {
    // Storage can be unavailable entirely (private mode, blocked site data).
    // Nothing here is load-bearing, so a failure is not worth reporting.
  }
}
