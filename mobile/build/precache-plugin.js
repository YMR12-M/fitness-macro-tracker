import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Fills in the two placeholders in `public/sw.js` with the real build output.
 *
 * Vite content-hashes every emitted filename, so the list of things to
 * precache cannot exist until the bundle does. This plugin collects it from
 * the bundle and writes it into the copy of the service worker that lands in
 * `dist/`, leaving the authored file in `public/` untouched.
 *
 * Two hooks rather than one, because they run at different moments:
 *  - `generateBundle` is where the emitted filenames are known.
 *  - `closeBundle` is the only point guaranteed to be after Vite has copied
 *    `public/` into `dist/` — rewriting `dist/sw.js` any earlier races with
 *    that copy and the placeholders survive into production.
 *
 * Source maps are excluded: they are build artefacts for debugging, not part
 * of the app, and precaching them would roughly triple the install payload.
 */
export function precacheManifest({
  fileName = 'sw.js',
  // Files from `public/` are not in the bundle, so the ones the app actually
  // needs offline are named here. The manifest and icons matter because an
  // installed app re-reads them.
  extraAssets = [
    '/',
    // Named explicitly rather than picked up from the bundle: Vite emits the
    // HTML from a `post`-stage plugin, which runs after this one's
    // generateBundle, so it is never visible there. The service worker's
    // offline fallback looks this up by path, so a missing entry would only
    // surface as a blank screen the first time someone opened the app on a
    // train.
    '/index.html',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/icons/favicon.svg',
    '/icons/apple-touch-icon.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
  ]
} = {}) {
  let precache = [];

  return {
    name: 'fittrack:precache-manifest',
    apply: 'build',

    generateBundle(_options, bundle) {
      const emitted = Object.keys(bundle)
        .filter((name) => !name.endsWith('.map') && name !== fileName)
        .map((name) => `/${name}`);

      // Sorted so the version hash below depends on the content of the build,
      // not on the order Rollup happened to emit things in.
      precache = [...new Set([...extraAssets, ...emitted])].sort();
    },

    async closeBundle() {
      if (!precache.length) return;

      const outDir = resolve(this.environment?.config?.build?.outDir ?? 'dist');
      const target = resolve(outDir, fileName);

      let source;
      try {
        source = await readFile(target, 'utf8');
      } catch {
        this.error(
          `${fileName} was not found in ${outDir}. The service worker is authored in ` +
            `public/${fileName} and copied at build time; if it has been moved, update this plugin.`
        );
        return;
      }

      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);

      const filled = source
        .replace("'__PRECACHE_VERSION__'", JSON.stringify(version))
        .replace("'__PRECACHE_MANIFEST__'", JSON.stringify(precache));

      // A silent no-op here would ship a worker that caches the literal string
      // "__PRECACHE_MANIFEST__" and fails its install on every device.
      if (filled.includes('__PRECACHE_')) {
        this.error(`Placeholders were left unreplaced in ${fileName}; its contents have drifted from this plugin.`);
        return;
      }

      await writeFile(target, filled);
      this.info(`precached ${precache.length} files as fittrack-mobile-${version}`);
    }
  };
}
