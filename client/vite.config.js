import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig(({ mode }) => {
  // The .env lives at the repo root and is shared with the server, so the dev
  // proxy always points at the port the API is actually listening on.
  const env = loadEnv(mode, repoRoot, '');
  // Deliberately NOT keyed off PORT: that name is ambiguous — hosting
  // platforms and dev-server launchers set it to *this* process's port, which
  // would make the proxy point at itself. VITE_DEV_API_TARGET names the API
  // and nothing else.
  //
  // 127.0.0.1 rather than localhost skips DNS resolution, avoiding the
  // IPv6/IPv4 ambiguity that silently breaks dev proxies.
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:4000';

  return {
    plugins: [react()],
    envDir: repoRoot,
    server: {
      port: 5173,
      // Proxying /api in dev keeps the client same-origin, so the auth cookies
      // behave exactly as they will in production behind one domain.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 4173,
      proxy: { '/api': { target: apiTarget, changeOrigin: true } }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          // Charts are a large dependency only two routes need; splitting it
          // keeps the initial bundle small.
          manualChunks: {
            charts: ['chart.js', 'react-chartjs-2'],
            vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query']
          }
        }
      }
    }
  };
});
