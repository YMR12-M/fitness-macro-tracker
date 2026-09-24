import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';
import { ApiError } from './api/client.js';
import { registerServiceWorker } from './lib/register-sw.js';

import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/components.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Refetching when a phone comes back from the lock screen is the one case
      // where focus refetching is clearly right: the app has usually been in
      // the background for hours, not seconds. Pull-to-refresh covers the rest.
      refetchOnWindowFocus: true,
      // Mobile networks drop. Reconnecting should recover the screen rather
      // than leaving it showing whatever failed last.
      refetchOnReconnect: true,
      retry(failureCount, error) {
        // Retrying a 4xx just repeats the same rejection.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      }
    }
  }
});

// Offline shell + home-screen installability. No-ops in development.
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
