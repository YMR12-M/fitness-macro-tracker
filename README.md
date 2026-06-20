# FitTrack Pro — Fitness & Macro Tracker

A full-stack web application for tracking daily nutrition, workouts, weight progress, and fitness goals. The project ships with three interchangeable backend implementations and a single-page frontend.

---

## Features

- **Dashboard** — daily calorie summary, macro breakdown (protein / carbs / fat), and workout totals at a glance
- **Food Logging** — log meals by type (breakfast, lunch, dinner, snack) with calorie and macro data; searchable food database pre-seeded with 20 common foods
- **Workout Tracker** — record workout sessions with type, duration, intensity, and calories burned
- **Progress Charts** — visualize weight history and nutrition trends over time
- **Goals** — set fitness goals with a target value, unit, and deadline; mark complete automatically when progress reaches the target
- **TDEE Calculator** — Mifflin-St Jeor formula with activity multiplier and cut/maintain/bulk adjustment; outputs recommended macros
- **Settings** — user profile with height, weight, age, and daily calorie goal

---

## Project Structure

```
Fitness Macro Tracker/
├── index-2.html          # Single-page frontend (all views)
├── style.css             # Dark-theme UI styles
├── app.js                # Frontend logic & API calls
├── charts.js             # Chart rendering (progress graphs)
├── data.js               # Local data helpers / seed data
├── main.py               # Backend option 1 — Python FastAPI
├── api.php               # Backend option 2 — PHP REST API
├── FitTrackApplication.java  # Backend option 3 — Java Spring Boot
└── schema.sql            # MySQL database schema + seed data
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styles | CSS3 (custom dark theme, CSS variables) |
| Logic | Vanilla JavaScript (ES2022) |
| Fonts | IBM Plex Arabic, Barlow Condensed (Google Fonts) |

### Backend (choose one)

| Option | Language | Framework | Default DB |
|--------|----------|-----------|------------|
| `main.py` | Python 3.10+ | FastAPI + SQLAlchemy | SQLite (dev) / any SQL (prod) |
| `api.php` | PHP 8.1+ | Vanilla PHP PDO | MySQL |
| `FitTrackApplication.java` | Java 17+ | Spring Boot 3 + JPA | H2 (dev) / MySQL (prod) |

### Database
MySQL 8+ (production) — schema and seed data in `schema.sql`.

---

## Getting Started

### Option 1 — Python / FastAPI

```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv

# Run (SQLite by default — no setup needed)
uvicorn main:app --reload --port 8000

# Open API docs
# http://localhost:8000/docs
```

Set `DATABASE_URL` env var to switch to another database:

```bash
export DATABASE_URL="mysql+pymysql://user:pass@localhost/fittrack"
```

### Option 2 — PHP

1. Place the project folder inside your web server root (Apache / Nginx / XAMPP).
2. Import `schema.sql` into MySQL:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Edit the credentials at the top of `api.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', 'yourpassword');
   define('DB_NAME', 'fittrack');
   ```
4. Open `index-2.html` in a browser or serve via the web server.

### Option 3 — Java / Spring Boot

```bash
# Dev mode (H2 in-memory, no database setup needed)
mvn spring-boot:run

# API docs
# http://localhost:8080/swagger-ui.html
```

For MySQL in production, uncomment the relevant lines in `application.properties` (see the comment block at the bottom of `FitTrackApplication.java`).

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | User profiles (name, email, height, weight, calorie goal) |
| `meals` | Logged meals with macros per entry |
| `food_database` | Searchable food library (20 pre-seeded items) |
| `workouts` | Workout sessions with duration and calories burned |
| `exercise_sets` | Individual sets within a workout |
| `weight_log` | Daily weight entries with optional body-fat % |
| `goals` | Fitness goals with target value and deadline |
| `water_log` | Daily water intake log |

Initialize the database:
```bash
mysql -u root -p < schema.sql
```

---

## API Endpoints

All backends expose the same REST interface:

### Meals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/meals?user_id=1&date=2024-01-15` | List meals for a date |
| POST | `/meals` | Log a new meal |
| DELETE | `/meals/{id}` | Remove a meal |

### Workouts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/workouts?user_id=1` | List recent workouts |
| POST | `/workouts` | Log a workout |
| DELETE | `/workouts/{id}` | Remove a workout |

### Weight
| Method | Path | Description |
|--------|------|-------------|
| GET | `/weight?user_id=1` | Weight history |
| POST | `/weight` | Log weight entry |

### Goals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/goals?user_id=1` | List goals |
| POST | `/goals` | Create a goal |
| PATCH | `/goals/{id}?current_value=75` | Update progress |
| DELETE | `/goals/{id}` | Delete a goal |

### Utilities
| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary?user_id=1&date=2024-01-15` | Daily nutrition + workout totals |
| GET | `/calc/tdee?weight_kg=80&height_cm=178&age=28&gender=male&activity=moderate&goal=cut` | TDEE & macro targets |

---

## TDEE Calculator

Uses the **Mifflin-St Jeor** equation:

- **Male:** BMR = 10W + 6.25H − 5A + 5
- **Female:** BMR = 10W + 6.25H − 5A − 161

Activity multipliers: `sedentary` 1.2 · `light` 1.375 · `moderate` 1.55 · `active` 1.725 · `very_active` 1.9

Goal adjustments: `cut` −500 kcal · `maintain` ±0 · `bulk` +300 kcal
