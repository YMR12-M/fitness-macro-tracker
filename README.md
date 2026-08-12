# FitTrack Pro — Fitness & Macro Tracker

A full-stack web application for tracking daily nutrition, workouts, weight progress, and fitness goals — HTML/CSS/vanilla JS frontend backed by a Node.js serverless API deployed on Vercel.

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
├── index.html                 # Single-page frontend (all views)
├── style.css                  # Dark-theme UI styles
├── app.js                     # Frontend logic & API calls
├── charts.js                  # Chart rendering (progress graphs)
├── data.js                    # Local demo/fallback data (food DB, workout programs, seed state)
└── api/
    └── [...segments].js       # Node.js serverless API (meals, workouts, weight, goals, summary, TDEE)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styles | CSS3 (custom dark theme, CSS variables) |
| Logic | Vanilla JavaScript (ES2022) |
| Charts | Chart.js v4 |
| Backend | Node.js serverless function (Vercel) |
| Fonts | IBM Plex Arabic, Barlow Condensed (Google Fonts) |

---

## Live demo

https://fitness-macro-tracker.vercel.app

> **Storage note:** the API writes to `/tmp` on Vercel's serverless filesystem, which is not durable — data can reset on cold starts or redeploys. Fine for demo purposes; swap in a real database (Vercel Postgres, Supabase, etc.) before relying on this for real user data.

## Run locally

Install the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) and run `vercel dev` from the project root. Open the URL it prints.

---

## API Endpoints

All routes live under `/api`:

### Meals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meals?user_id=1&log_date=2026-01-15` | List meals for a date |
| POST | `/api/meals` | Log a new meal |
| DELETE | `/api/meals/{id}` | Remove a meal |

### Workouts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workouts?user_id=1` | List recent workouts |
| POST | `/api/workouts` | Log a workout |
| DELETE | `/api/workouts/{id}` | Remove a workout |

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
| PATCH | `/api/goals/{id}?current_value=75` | Update progress |
| DELETE | `/api/goals/{id}` | Delete a goal |

### Utilities
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/summary?user_id=1&log_date=2026-01-15` | Daily nutrition + workout totals |
| GET | `/api/calc/tdee?weight_kg=80&height_cm=178&age=28&gender=male&activity=moderate&goal=cut` | TDEE & macro targets |

---

## TDEE Calculator

Uses the **Mifflin-St Jeor** equation:

- **Male:** BMR = 10W + 6.25H − 5A + 5
- **Female:** BMR = 10W + 6.25H − 5A − 161

Activity multipliers: `sedentary` 1.2 · `light` 1.375 · `moderate` 1.55 · `active` 1.725 · `very_active` 1.9

Goal adjustments: `cut` −500 kcal · `maintain` ±0 · `bulk` +300 kcal
