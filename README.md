# FitTrack Pro — Fitness & Macro Tracker

A full-stack nutrition and training tracker. Real accounts, real persistence, and
nutrition data from **USDA FoodData Central** — every number on every screen is
computed from what the signed-in user actually logged.

- **Clients** — two React 18 + Vite front ends over the same API: a desktop
  client and a separate touch-first mobile client, sharing one brand and one
  account
- **API** — Node.js + Express, MySQL 8 (mysql2), Zod validation
- **Auth** — email + password, bcrypt hashing, JWT access tokens and rotating
  refresh tokens in httpOnly cookies

---

## Getting started

### Requirements

- Node.js 20+
- MySQL 8+ (locally, via Docker, or a managed instance)

### 1. Install

```bash
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Then set a real `JWT_SECRET` — the server refuses to start without one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start MySQL

With Docker:

```bash
npm run db:up
```

Or point `DATABASE_URL` at any MySQL 8 instance you already run. To create the
database and user by hand:

```sql
CREATE DATABASE fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fittrack'@'localhost' IDENTIFIED BY 'fittrack';
GRANT ALL PRIVILEGES ON fittrack.* TO 'fittrack'@'localhost';
```

### 4. Create the schema and seed reference data

```bash
npm run db:migrate
npm run db:seed
```

`db:seed` loads **reference data only** — six training programs with their real
prescribed exercises, and a starter catalog of 63 USDA-derived foods. It creates
no users and no logged entries: everything tied to a person gets there because
that person logged it.

### 5. Run

```bash
npm run dev          # API + desktop client
npm run dev:all      # API + desktop client + mobile client
npm run dev:mobile   # just the mobile client
```

- Desktop client → http://localhost:5173
- Mobile client → http://localhost:5174
- API → http://localhost:4000

The mobile dev server binds to every interface, so it also opens on a real
phone at `http://<your-machine's-LAN-IP>:5174` over the same network. That link
is plain HTTP, so a phone can only add it as a shortcut. It cannot install it as
an app. `mobile/README.md` explains how to install on a phone.

Create an account at `/register`. The body stats you enter set your starting
calorie and macro targets via the Mifflin-St Jeor equation.

---

## Nutrition data

Food search hits the local catalog first and falls back to the live USDA
FoodData Central API when the local catalog is thin for a term. Results from the
API are written back to `foods`, so the catalog grows into the foods your users
actually eat and repeat searches stay fast.

A free API key from <https://fdc.nal.usda.gov/api-key-signup.html> goes in
`USDA_API_KEY`. Without one the app still works — search uses the seeded USDA
reference values and any custom foods a user has created. The Settings page
shows which mode is active and how many foods came from where.

To warm the cache from the live API at seed time:

```bash
npm run db:seed -- --usda
```

---

## Project structure

```
.
├── client/                     React + Vite desktop front end
│   ├── public/                 favicon, icons, web manifest
│   └── src/
│       ├── api/                HTTP client + every endpoint in one place
│       ├── auth/               AuthProvider, context/hook, route guards
│       ├── components/         shared UI (Card, Modal, Toast, charts, …)
│       ├── features/           one folder per screen
│       ├── hooks/              useDebounced, useMutationWithRefresh
│       ├── lib/                formatting, Chart.js setup
│       └── styles/             tokens, base, layout, components
│
├── mobile/                     React + Vite mobile front end — see mobile/README.md
│   ├── public/                 icons, PWA manifest
│   └── src/
│       ├── api/                same client and endpoint table as above
│       ├── auth/               same provider; mobile route guards
│       ├── components/
│       │   ├── shell/          AppShell, AppBar, TabBar, Screen
│       │   ├── ui/             Sheet, SwipeRow, Stepper, DateStrip, …
│       │   ├── data/           CalorieRing, MacroBars
│       │   └── charts/         Chart.js wrappers, deferred where eager
│       ├── features/           one folder per screen, mirroring client/
│       ├── hooks/              pull-to-refresh, condensed header, quick-add
│       ├── lib/                formatting, haptics, scrolling, Chart.js setup
│       └── styles/             tokens, base, shell, components
│
└── server/
    └── src/
        ├── config/             validated environment
        ├── db/                 pool, migrations, seeds
        ├── middleware/         auth, validation, errors
        ├── modules/            one folder per resource:
        │                         schema / service / controller / routes
        ├── utils/              HTTP errors, dates, SQL helpers
        ├── app.js              Express wiring
        ├── routes.js           every route, mounted in one place
        └── index.js            entry point
```

---

## Two clients

Both front ends talk to the same API, hold the same session cookie and render
the same seven screens. They are separate apps because a phone needs a
different shell, not a narrower one:

| | `client/` | `mobile/` |
| --- | --- | --- |
| Navigation | 7-item sidebar | 4 bottom tabs + quick-add; the rest behind the account button |
| Dialogs | Centred modal | Bottom sheet, drag-to-dismiss |
| Deleting | Trash button | Swipe-to-delete **and** the same trash button |
| Choosing a day | Date input | Tappable date strip |
| Signup | One form | Three-step wizard |
| Refresh | Automatic | Pull-to-refresh, and on focus and reconnect |

`src/api/client.js`, `src/api/endpoints.js` and the auth provider are kept
identical in both — they describe the API, not the device, and each copy says so
in its header. Everything else is written for its own form factor.
`mobile/README.md` covers the mobile shell, its design tokens and its
accessibility rules in detail.

## Design

The look is **Paper & Plate**: a training logbook crossed with a nutrition label,
coloured like the plates on a bar — and deliberately not a dark dashboard with a
neon accent.

- **Ink on paper.** Chrome is monochrome (ink on bone in the light theme, bone on
  warm black in the dark one). Sections open with the thick rule a nutrition label
  uses rather than sitting in rounded translucent cards. No gradients, glows or
  glass.
- **Colour means data.** Protein is the red plate, carbs the blue, fat the
  yellow, water the pale blue — the same hue on every bar, chart and legend.
- **Numbers first.** Figures and headings are Big Shoulders Display (condensed
  Chicago signage), text is Libre Franklin. The dashboard's centrepiece is the
  *dial* — 72 ticks that fill as the day is eaten, with the protein / carbs / fat
  split inside it. Macros are *plates* loaded on a bar (`components/Plates.jsx`),
  "over target" is hazard tape, and a logging streak is kept as tally marks.
- **No emoji in the chrome.** Navigation, actions and empty states use the drawn
  icon set in `components/Icon.jsx`. Emoji are kept only where they are content —
  a food's sticker, a goal's badge.

Everything is driven by `styles/tokens.css`, identical in both clients (the phone
adds its touch-shell tokens below it): change a colour or a typeface there and
both apps follow. Two themes share every token name — **Iron** (dark, the
default) and **Paper** (`data-theme="light"`, set from the profile).

---

Each `server/src/modules/<name>/` folder holds the same four files:

| File              | Responsibility                                     |
| ----------------- | -------------------------------------------------- |
| `*.schema.js`     | Zod schemas — the only place input shapes are defined |
| `*.service.js`    | Business logic and SQL. Never touches req/res       |
| `*.controller.js` | Maps HTTP to service calls                          |
| `*.routes.js`     | Route table with validation middleware              |

---

## API

Everything is under `/api`. Only `/api/health` and `/api/auth/*` are reachable
without a session; every other route requires authentication and is scoped to the
signed-in user.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness + database connectivity |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/refresh` | Rotate the session |
| `POST` | `/auth/logout` | Revoke the session |
| `GET` | `/auth/me` | Current user |
| `POST` | `/auth/change-password` | Change password, revoke all sessions |
| `GET`/`PATCH` | `/users/me` | Profile and daily targets |
| `POST` | `/users/me/recalculate-targets` | Recompute targets from latest weight |
| `GET` | `/users/me/export` | Full JSON export of the account |
| `DELETE` | `/users/me` | Delete the account and all its data |
| `GET` | `/summary` | One day's totals vs targets |
| `GET` | `/summary/dashboard` | Everything the dashboard renders |
| `GET` | `/summary/series` | Per-day series over a window |
| `GET` | `/summary/streak` | Logging streak |
| `GET` | `/summary/adherence` | Averages over a window |
| `GET` | `/tdee` | Mifflin-St Jeor calculation |
| `GET`/`POST` | `/meals` | List / log meals |
| `GET` | `/meals/frequent` | Most-logged foods, for quick add |
| `PATCH`/`DELETE` | `/meals/:id` | Edit / remove a meal |
| `GET` | `/foods/search` | Catalog + USDA search |
| `GET` | `/foods/stats` | Catalog size and provenance |
| `POST` | `/foods` | Create a custom food |
| `PATCH`/`DELETE` | `/foods/:id` | Edit / remove a custom food |
| `GET`/`POST` | `/water` | Today's intake / log a drink |
| `DELETE` | `/water/last` | Undo the last drink |
| `GET`/`POST` | `/weight` | Weight history / log an entry |
| `GET` | `/weight/trend` | Trend with 7-day moving average |
| `GET`/`POST` | `/goals` | List / create goals |
| `PATCH`/`DELETE` | `/goals/:id` | Update progress / remove |
| `GET`/`POST` | `/workouts` | List / log workouts |
| `GET` | `/workouts/stats` | Sessions, minutes, volume |
| `GET` | `/workouts/today` | Today's prescribed session |
| `GET` | `/programs` | Available training programs |
| `POST` | `/programs/:id/select` | Follow a program |

---

## Database

Eleven tables, all `utf8mb4` InnoDB with foreign keys that cascade on account
deletion. Migrations are forward-only, tracked in `schema_migrations` with a
checksum so an edited-after-the-fact migration is caught rather than silently
diverging.

```bash
npm run db:migrate           # apply pending migrations
npm run migrate:status -w server
npm run db:reset             # drop everything and re-apply (development only)
```

| Table | Holds |
| --- | --- |
| `users`, `user_profiles`, `sessions` | Accounts, body stats and targets, refresh tokens |
| `foods` | Catalog: USDA-cached, seeded reference, and user-created |
| `meal_entries`, `water_entries` | What was eaten and drunk, per day |
| `programs`, `program_exercises`, `user_programs` | Training templates and who follows what |
| `workouts`, `workout_sets` | Logged sessions and per-set detail |
| `weight_entries`, `goals` | Body weight history and user-defined targets |

Macros are denormalised onto `meal_entries` on purpose: editing a food later must
not silently rewrite what someone already ate.

---

## Security

- Passwords hashed with bcrypt (configurable cost, default 12)
- Refresh tokens stored as SHA-256 hashes, rotated on every use, and revoked on
  logout or password change — a replayed token is rejected
- Access and refresh tokens in httpOnly cookies, `secure` + `SameSite=None` in
  production
- Login response timing does not reveal whether an email is registered
- Every data query filters on `user_id`; there is no ambient user anywhere
- Zod validates every request body, query and param before a handler runs
- `helmet`, CORS with an explicit origin allowlist, and rate limits — global,
  plus tighter limits on credential endpoints and food search
- Dynamic SQL is built only from column whitelists, never from request keys
- Dates are validated against the real calendar, and anything recording a past
  event (a meal, a weigh-in, a workout) is rejected if dated in the future —
  a stray `2099-01-01` otherwise corrupts every average and trend that reads it
- Expired and long-revoked sessions are pruned on boot and every six hours

---

## Testing

```bash
npm test              # 54 unit tests over the pure logic
npm run test:watch -w server
```

Coverage is deliberately concentrated on the parts where a silent wrong answer
does the most damage: the TDEE and macro equations, goal-progress direction
handling, date arithmetic and calendar validation, and the SQL-building
whitelists.

---

## Deployment

The API holds a MySQL connection pool, so it needs a long-lived Node process —
Railway, Render, Fly.io, or any VPS. Serverless platforms that spin up a new
instance per request (including Vercel Functions) will exhaust the connection
pool and are not a fit for this stack.

```bash
npm run build      # both clients → client/dist and mobile/dist
npm run db:migrate # against the production database
npm start          # API
```

Serve `client/dist` and `mobile/dist` as static files alongside the API, and
route `/api` on each client's host to it, so `/api` stays same-origin and the
cookies just work. For example, put the desktop client on `example.com` and the
mobile one on `m.example.com`. The mobile build has to sit at the root of its
host. Its manifest, icons and service worker are all addressed from `/`, so
under a sub-path such as `/m` they would resolve to the desktop client's files,
and the app could no longer be installed. A client served from an origin that
has no `/api` route needs `CORS_ORIGIN` and `VITE_API_URL` set accordingly.

Which client a visitor gets is a routing decision, not an application one: send
phones to the mobile build with a `User-Agent` or `Client-Hints` rule at the
edge, or give people the choice with a link. Neither client redirects to the
other.

The mobile build ships a service worker (`mobile/dist/sw.js`) that precaches the
app shell and is what makes the app installable to a home screen. It must be
served from the root of its origin, uncached or short-cached, and over HTTPS —
browsers will not register a worker on an insecure origin, which is why
installing does not work against the dev server.

> **Known issue in `client/`:** `client/vite.config.js` calls `loadEnv` on the
> shared root `.env` and sets `envDir` to the repo root. `loadEnv` copies any
> `NODE_ENV` it finds into `process.env.VITE_USER_NODE_ENV`, which Vite treats
> as deciding whether a build is production — so the root `.env`'s
> `NODE_ENV=development` makes `npm run build:client` emit a development build:
> React's development bundle, and every `import.meta.env.DEV` branch live. The
> build succeeds and looks normal. `mobile/vite.config.js` works around it in
> `readSharedEnv`; the same fix has not been applied to `client/`.

Production requires: `NODE_ENV=production`, a strong `JWT_SECRET`,
`COOKIE_SECURE=true`, `DB_SSL=true` for managed MySQL, and `CORS_ORIGIN` set to
your real front-end origin.

---

## License

MIT — see [LICENSE](LICENSE).
