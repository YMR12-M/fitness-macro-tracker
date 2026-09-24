import { X509Certificate } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { precacheManifest } from './build/precache-plugin.js';

const mobileRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(mobileRoot, '..');

/**
 * HTTPS for `vite preview`, when a certificate has been generated.
 *
 * Testing the installed-app experience needs a secure origin: browsers refuse
 * to register a service worker over plain HTTP, and `localhost` — the one
 * exception — is not reachable from a phone. So a phone on the LAN cannot
 * exercise the offline shell or the install prompt at all without this.
 *
 * Opt-in by the presence of the files, so nobody who has not generated a
 * certificate is affected:
 *
 *     cd mobile/.certs && mkcert -key-file key.pem -cert-file cert.pem \
 *       <your-LAN-IP> localhost 127.0.0.1
 *
 * The phone also has to trust the CA that signed it (`mkcert -CAROOT`), which
 * is a change to that device's security settings and therefore the device
 * owner's to make. `.certs/` is gitignored: a private key is never shared, and
 * the address it covers is specific to one machine on one network.
 */
function localHttps() {
  const key = resolve(mobileRoot, '.certs/key.pem');
  const cert = resolve(mobileRoot, '.certs/cert.pem');
  if (!existsSync(key) || !existsSync(cert)) return undefined;

  const pem = readFileSync(cert);
  warnIfLanAddressUncovered(pem);
  return { key: readFileSync(key), cert: pem };
}

/**
 * The certificate names the LAN address it was issued for, and that address is
 * whatever the router handed the laptop that day. When it changes, the phone
 * gets a certificate error, and Chrome treats a certificate error the way it
 * treats plain HTTP: no service worker, and "Create shortcut" where "Install"
 * should be. Nothing on the phone points back here, so say it at startup,
 * with the command that fixes it.
 */
function warnIfLanAddressUncovered(pem) {
  const lanAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);

  const certificate = new X509Certificate(pem);
  const uncovered = lanAddresses.filter((address) => !certificate.checkIP(address));
  if (!uncovered.length) return;

  console.warn(
    `\n  .certs/cert.pem does not cover ${uncovered.join(', ')} (it was issued for ${certificate.subjectAltName}).\n` +
      '  A phone opening the preview there gets a certificate error, and can only add a shortcut, not install the app.\n' +
      '  Regenerate it for the current address:\n\n' +
      `    cd mobile/.certs && mkcert -key-file key.pem -cert-file cert.pem ${lanAddresses.join(' ')} localhost 127.0.0.1 ::1\n`
  );
}

/**
 * Read the shared root .env without letting its NODE_ENV reach the build.
 *
 * `loadEnv` has a side effect that is easy to miss: whenever it parses a file
 * containing NODE_ENV, it copies the value into
 * `process.env.VITE_USER_NODE_ENV`, and Vite then treats *that* as the
 * authority on whether this is a production build — ahead of the mode it was
 * actually invoked with.
 *
 * Because the API and the clients share one .env, and the API legitimately
 * sets `NODE_ENV=development` there, a plain `loadEnv` call turns every
 * `vite build` into a build that believes it is running in development:
 * React's development bundle is included instead of the production one, and
 * every `import.meta.env.DEV` branch in the app ships live and enabled. It is
 * silent — the build succeeds, the output looks normal, and it is only ~8%
 * larger. It was found here because the service worker's dev-only branch
 * unregisters the worker, so a production build quietly uninstalled itself.
 *
 * Undoing the side effect immediately is the narrowest fix: the values are
 * still read from one shared file, and NODE_ENV simply stops being able to
 * decide what kind of build this is.
 */
function readSharedEnv(mode) {
  const before = process.env.VITE_USER_NODE_ENV;
  const env = loadEnv(mode, repoRoot, '');

  if (before === undefined) delete process.env.VITE_USER_NODE_ENV;
  else process.env.VITE_USER_NODE_ENV = before;

  return env;
}

export default defineConfig(({ mode, isPreview }) => {
  // Same shared root .env as the server and the desktop client, so the dev
  // proxy always points at the port the API is actually listening on. See
  // client/vite.config.js for why the target is named VITE_DEV_API_TARGET
  // rather than being derived from PORT.
  const env = readSharedEnv(mode);
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:4000';

  /**
   * The one client-facing variable from the shared .env, injected explicitly.
   *
   * `envDir: repoRoot` would be the obvious way to do this, but it hands the
   * root .env — including its `NODE_ENV=development`, which the API needs — to
   * Vite's own env loader, and Vite derives `import.meta.env.PROD` from a
   * NODE_ENV found in an env file rather than from the build mode. See
   * readSharedEnv below for what that costs.
   *
   * The root .env stays the single source of truth; only NODE_ENV is kept out
   * of the client build. A new VITE_* variable has to be added here to reach
   * the app — a visible one-line cost, where the alternative was an invisible,
   * build-wide one.
   */
  const clientEnv = {
    'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? '')
  };

  /**
   * Proxy /api to the API, and drop the Origin header on the way through.
   *
   * Through this proxy the browser's request is genuinely same-origin, but it
   * still attaches an Origin header to every POST/PATCH/DELETE — and that
   * header names the *dev server*, not the API. The API's CORS allowlist then
   * rejects it with "Origin http://localhost:5174 is not allowed".
   *
   * Allowlisting the port would fix the desktop case and nothing else: this
   * server binds to every interface so the app can be opened on a real phone,
   * where the origin is whatever LAN address the laptop happens to have today.
   * Stripping the header instead puts the request on the API's "same-origin
   * and non-browser callers send no Origin" path, which is what it actually
   * is. Dev only — in production both clients are served from the API's own
   * domain and no CORS check is involved.
   */
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
    }
  };

  return {
    // precacheManifest only applies on build; in dev the authored public/sw.js
    // is served with its placeholders intact and never registered.
    plugins: [react(), precacheManifest()],
    define: clientEnv,
    server: {
      // 5174 so the mobile and desktop dev servers can run side by side.
      port: 5174,
      // Bound to every interface: the whole point of this client is being
      // opened on a real phone over the LAN, not only in a desktop emulator.
      host: true,
      proxy: { '/api': apiProxy }
    },
    preview: {
      port: 4174,
      host: true,
      // undefined when no certificate has been generated, which leaves the
      // preview server on plain HTTP exactly as before. Only read when
      // previewing, so dev and build never print the certificate warning.
      https: isPreview ? localHttps() : undefined,
      proxy: { '/api': apiProxy }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          // Split by package rather than by the object form's entry-module
          // matching, which assigns only the named entry and leaves each
          // package's actual implementation to land wherever it is first
          // reached — producing a 70-byte "react" chunk and a router chunk
          // with React inside it. Splitting for real means a React patch does
          // not invalidate the router and query chunks in every phone's cache.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts';
            if (id.includes('@tanstack')) return 'query';
            if (id.includes('react-router') || id.includes('@remix-run')) return 'router';
            return 'vendor';
          }
        }
      }
    }
  };
});
