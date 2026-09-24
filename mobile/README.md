# FitTrack Pro — mobile client

A second front end for the same API, built for a phone rather than adapted to
one. Same account, same database, same brand; a different shell.

```bash
npm run dev:server      # the API (from the repo root)
npm run dev:mobile      # this client → http://localhost:5174
```

The dev server binds to every interface, so the app opens on a real phone at
`http://<your-laptop's-LAN-IP>:5174` over the same Wi-Fi. That is the only way
to check the parts that cannot be emulated: safe-area insets around a notch, how
a sheet behaves when the keyboard opens under it, and whether a target is
actually hittable with a thumb.

---

## Why a separate client, not a breakpoint

The desktop client is already responsive — it collapses to one column and turns
its sidebar into a drawer. That makes it *usable* on a phone. It does not make
it a phone app, and the gap is structural rather than cosmetic:

| | Desktop client | This client |
| --- | --- | --- |
| Navigation | 7-item sidebar, drawer on small screens | 4-item bottom tab bar + quick-add, rest behind the account button |
| Dialogs | Centred modal | Bottom sheet, drag-to-dismiss |
| Deleting a row | Trash button | Swipe-to-delete **and** the same trash button |
| Picking a day | `<input type="date">` | Tappable date strip, native picker behind a calendar button |
| Quantities | Number field | Stepper with −/+ |
| Signup | One 10-field form | Three-step wizard |
| Refresh | Automatic | Pull-to-refresh, plus refetch on focus and reconnect |
| Charts | 260px tall, full tick density | 210px, capped ticks, wider touch targets |
| First load | One `vendor` chunk, charts eager on the dashboard | Split framework chunks, charts deferred below the fold |

Trying to express both of those from one component tree means a `useMediaQuery`
in every feature and two layouts inside every file. Two clients over one API
keeps each one readable, and the one thing that must not diverge — what the API
looks like — is shared by being literally the same code (see below).

## What is shared, and how

Everything device-independent is a copy that is meant to stay identical, not a
fork:

- `src/api/client.js` — transport, refresh-and-replay, error shape
- `src/api/endpoints.js` — the call table
- `src/auth/AuthProvider.jsx`, `src/auth/auth-context.js` — session state

Each carries a header saying so. They were left as copies rather than extracted
into a fourth workspace because doing that means rewriting every import in the
desktop client — a change to working code that this feature does not need. If a
third client ever appears, that is the moment to extract them; two is the point
where the copy is still cheaper than the indirection.

Everything else here is written for touch.

## Layout

```
mobile/
├── public/                    manifest, icons (same marks as the desktop client)
└── src/
    ├── api/                   HTTP client + endpoint table  (shared, see above)
    ├── auth/                  provider (shared), route guards (mobile)
    ├── components/
    │   ├── shell/             AppShell, AppBar, TabBar, Screen, AccountButton
    │   ├── ui/                Sheet, ActionSheet, SwipeRow, Stepper, DateStrip,
    │   │                      Card, Field, Toast, Icon, Skeleton, Spinner
    │   ├── data/              CalorieRing, MacroBars
    │   └── charts/            Chart.js wrappers + `lazy.jsx`
    ├── features/              one folder per screen, sheets beside the screen
    │                          that owns them
    ├── hooks/                 pull-to-refresh, condensed header, quick-add,
    │                          debounce, mutation+refresh
    ├── lib/                   format, haptics, horizontal scroll, chart setup
    └── styles/                tokens → base → shell → components
```

Feature folders mirror `client/src/features/`, so a screen that exists in both
clients is findable in the same place in each.

## The shell

`AppShell` renders the tab bar and the quick-add sheet; every screen renders one
`<Screen>`, which supplies its own app bar. Titles live with the screens that own
them rather than in a route-keyed lookup table that has to be kept in step with
the router.

**Navigation** is four tabs — Today, Log, Train, Progress — with the quick-add
button straddling the middle. Goals, the TDEE calculator and settings are behind
the account button in the app bar, which routes to `/more`. Nothing is more than
two taps away, and no tab is out of thumb reach.

**Quick add** routes to the screen that owns each kind of entry and asks it to
open its sheet (`useQuickAdd`), rather than duplicating four forms in the shell.
Water is the exception: it has no screen of its own, so its sheet lives there.

## Design tokens

`src/styles/tokens.css` carries the brand half verbatim from
`client/src/styles/tokens.css` — the same greens, the same fixed macro hues, the
same surface and text ramps, the same light theme. A screenshot from either
client should be recognisably the same product.

Below that are the tokens only a phone needs: `--safe-*` insets, `--appbar-h`,
`--tabbar-h` and the `--tabbar-clearance` every screen pads by, `--tap` (44px,
the floor for anything interactive), and `--spring`, the curve used for anything
that moves in space.

Body text sits at 16px because iOS Safari zooms the viewport whenever a focused
input is smaller — and never zooms back out.

## Accessibility

The gestures are shortcuts, never the only route:

- Swipe-to-delete always ships alongside a real delete button in the same row.
- The sheet's drag handle is `aria-hidden`; the ✕, Escape and the backdrop all
  close it, and focus is trapped inside and restored on close.
- `scrollIntoView` is never used to reveal a horizontally-scrolled selection —
  it scrolls the page vertically too. `lib/scroll.js` writes `scrollLeft` only.
- Pinch-zoom is not disabled.
- Haptics are confirmation, never *the* confirmation: every call site also shows
  a toast or moves something, so nothing is lost on iOS Safari, which has no
  Vibration API.

## Offline and installability

`public/sw.js` is a hand-written service worker — no Workbox, matching a
codebase that has no UI or utility libraries either. It does two things: lets
the app open without a network, and satisfies Chrome's criteria for installing
to a home screen as a real app rather than a browser shortcut.

**What it deliberately does not cache is the important part.** Everything under
`/api` is authenticated, per-user and time-sensitive — the premise of the app is
that every number on screen is computed from what the signed-in user actually
logged. A cached copy would show stale macros as current, and would leave one
account's data in Cache Storage for whoever opens the browser next on a shared
phone. API requests are passed to the network untouched; the worker never
inspects their responses.

Everything else is cache-first, which is safe because Vite content-hashes every
filename, so a URL's contents can never change. Navigations are network-first
with the cached shell as fallback, so a new deploy is picked up immediately.
The brand fonts are cached too, so the typography survives offline instead of
dropping to a system stack.

The precache list is generated: `build/precache-plugin.js` rewrites two
placeholders in the worker at build time, because the hashed filenames cannot
be known before the bundle exists. It fails the build loudly if a placeholder
is left unreplaced, rather than shipping a worker that caches the literal string.

Registration (`src/lib/register-sw.js`) happens **in production builds only**. In
development it does the opposite and tears down any worker left behind by a
production build previously opened on the same origin — a worker in front of the
dev server serves yesterday's copy of a file you just edited and turns every HMR
update into a mystery.

Verified with the server stopped: the app boots, routes, and renders from cache,
while `/api` fails with a network error — exactly the split the design intends.

One known characteristic: offline, `/auth/me` cannot reach the server, so the
session cannot be confirmed and the app lands on the sign-in screen. That is
honest rather than ideal — caching an identity would be the wrong fix — but an
explicit "you're offline" state would read better than a login form that cannot
succeed. Worth doing; not done here.

## Installing to a home screen

`public/manifest.webmanifest` declares standalone display, portrait
orientation, the brand icons and three shortcuts (Log, Train, Progress). With
`viewport-fit=cover` and the safe-area padding, the installed app paints under
the notch and the home indicator without putting content there.

### Installing on a real phone during development

Chrome installs an app only from a secure origin, and `http://<LAN-IP>:5174`
is not one. On that link the only thing Chrome offers is **Create shortcut**,
a bookmark that opens in a browser tab. It never offers **Install**. Chrome's
own installability check on the dev link reports exactly one error,
`not-from-secure-origin`; the manifest itself parses cleanly. The dev server
also never registers the service worker (see above).

To install from the laptop:

1. Generate a certificate for the laptop's current LAN address (the command is
   in `vite.config.js`). Then trust mkcert's root CA on the phone, once:
   `rootCA.pem` in `mkcert -CAROOT`, installed on Android through Settings →
   Security → Encryption & credentials → Install a certificate → CA certificate.
2. Run `npm run build:mobile`, then `npm run preview -w mobile`, and open
   `https://<LAN-IP>:4174` on the phone. Chrome's menu then offers
   **Install app**.

The certificate names a single address, and the router can give the laptop a
different one at any time. When that happens the phone gets a certificate
error, and Chrome handles that the same way as plain HTTP: a shortcut again.
So `vite preview` warns at startup when the certificate no longer covers the
current address, and prints the command that fixes it.

An app installed this way belongs to that exact origin. It works while the
laptop is serving it on the same network, and stops working once the address
changes. For a permanent install, deploy it to a stable HTTPS domain.

## Notes

- **The dev proxy strips the `Origin` header.** Through the proxy the browser's
  request is same-origin, but it still attaches an Origin naming the dev server,
  which the API's CORS allowlist then rejects. Allowlisting the port would fix
  only the desktop case — on a phone the origin is whatever LAN address the
  laptop has today. See the comment in `vite.config.js`.
- **Serving this from its own origin in production** (rather than the API's
  domain, which is the recommended setup) means adding that origin to
  `CORS_ORIGIN` and setting `VITE_API_URL`.
- **`envDir` deliberately does not point at the repo root**, and the one
  client-facing variable is injected through `define` instead. `loadEnv` copies
  any `NODE_ENV` it parses into `process.env.VITE_USER_NODE_ENV`, and Vite
  treats that as the authority on whether a build is production — ahead of the
  mode it was invoked with. Since the API shares the root `.env` and
  legitimately sets `NODE_ENV=development` there, the obvious wiring makes every
  `vite build` believe it is a development build: React's development bundle
  ships, and every `import.meta.env.DEV` branch ships live. `readSharedEnv` in
  `vite.config.js` undoes the side effect. Fixing it cut the vendor chunk from
  348 kB to 147 kB.

  **`client/vite.config.js` still has this bug** — it is where the pattern was
  copied from. Its production build ships React's development bundle today.
