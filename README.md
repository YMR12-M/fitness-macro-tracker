# FitTrack Pro — Fitness & Macro Tracker

A full-stack web application for tracking daily nutrition, workouts, weight progress, and fitness goals — HTML/CSS/vanilla JS frontend backed by a plain Node.js serverless API.

---

## Features

- **Dashboard** — daily calorie summary, macro breakdown (protein / carbs / fat), and workout totals at a glance
- **Food Logging** — log meals by type (breakfast, lunch, dinner, snack) with calorie and macro data; searchable food database pre-seeded with common foods
- **Workout Tracker** — record workout sessions with type, duration, intensity, and calories burned
- **Progress Charts** — visualize weight history and nutrition trends over time
- **Goals** — set fitness goals with a target value, unit, and deadline; mark complete automatically when progress reaches the target
- **TDEE Calculator** — Mifflin-St Jeor formula with activity multiplier and cut/maintain/bulk adjustment; outputs recommended macros
- **Settings** — user profile with height, weight, age, and daily calorie goal

The app works fully offline on local demo data (`data.js`) and transparently switches to syncing with the live API whenever it's reachable — see "Server Connection Status" in Settings.

---

## Project Structure

```
Fitness Macro Tracker/
├── index.html          # Single-page frontend (all views)
├── style.css           # Dark-theme UI styles
├── app.js              # Frontend logic & API calls
├── charts.js           # Chart rendering (progress graphs)
├── data.js             # Local demo/fallback data (food DB, workout programs, seed state)
├── lib/
│   └── store.js        # Shared JSON file storage used by the api/ routes
└── api/
    ├── meals.js         # GET/POST /api/meals, DELETE /api/meals?id=
    ├── workouts.js      # GET/POST /api/workouts, DELETE /api/workouts?id=
    ├── weight.js        # GET/POST /api/weight
    ├── goals.js         # GET/POST/PATCH/DELETE /api/goals
    ├── summary.js        # GET /api/summary
    └── tdee.js           # GET /api/tdee
```

Each file under `api/` is a plain, independent Node.js function (`module.exports = (req, res) => {...}`) — no framework, no routing config, no platform-specific config file (e.g. no `vercel.json`). Deploying it just means pointing a host that runs one Node.js function per file in an `api/` folder at this repo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styles | CSS3 (custom dark theme, CSS variables) |
| Logic | Vanilla JavaScript (ES2022) |
| Charts | Chart.js v4 |
| Backend | Node.js serverless functions (plain, host-agnostic) |
| Fonts | IBM Plex Arabic, Barlow Condensed (Google Fonts) |

---

## Live demo

https://fitness-macro-tracker.vercel.app (currently hosted on Vercel; the code itself has no Vercel-specific config)

> **Storage note:** the API writes to `/tmp`, which on most serverless hosts is not durable — data can reset on cold starts or redeploys. Fine for demo purposes; swap in a real database (Postgres, Supabase, etc.) before relying on this for real user data.

## Run locally

Any static-file + Node-serverless-function host works. With the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`), run `vercel dev` from the project root and open the URL it prints.

---

## API Endpoints

All routes live under `/api`:

### Meals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meals?user_id=1&log_date=2026-01-15` | List meals for a date |
| POST | `/api/meals` | Log a new meal |
| DELETE | `/api/meals?id=1` | Remove a meal |

### Workouts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workouts?user_id=1` | List recent workouts |
| POST | `/api/workouts` | Log a workout |
| DELETE | `/api/workouts?id=1` | Remove a workout |

### Weight
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/weight?user_id=1` | Weight history (`{ entries, latest_kg }`) |
| POST | `/api/weight` | Log weight entry |

### Goals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals?user_id=1` | List goals |
| POST | `/api/goals` | Create a goal |
| PATCH | `/api/goals?id=1&current_value=75` | Update progress |
| DELETE | `/api/goals?id=1` | Delete a goal |

### Utilities
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/summary?user_id=1&log_date=2026-01-15` | Daily nutrition + workout totals |
| GET | `/api/tdee?weight_kg=80&height_cm=178&age=28&gender=male&activity=moderate&goal=cut` | TDEE & macro targets |

---

## TDEE Calculator

Uses the **Mifflin-St Jeor** equation:

- **Male:** BMR = 10W + 6.25H − 5A + 5
- **Female:** BMR = 10W + 6.25H − 5A − 161

Activity multipliers: `sedentary` 1.2 · `light` 1.375 · `moderate` 1.55 · `active` 1.725 · `very_active` 1.9

Goal adjustments: `cut` −500 kcal · `maintain` ±0 · `bulk` +300 kcal
