// Shared JSON file storage for the FitTrack Pro API (api/*.js).
//
// Storage note: Vercel's deployment filesystem is read-only at runtime, so
// writes go to /tmp instead. /tmp is seeded with demo data on first use per
// lambda instance, but it is NOT durable — it can reset on cold starts,
// redeploys, or when a request lands on a different instance. That's fine
// for a portfolio/demo deployment; swap in a real database (Vercel
// Postgres, Supabase, etc.) before relying on this for real user data.
//
// Lives outside api/ on purpose: only files directly under api/ become
// deployed routes, so this module is just a plain import, not an endpoint.

const fs = require('fs');
const path = require('path');

const TMP_DIR = '/tmp/fittrack-data';
const FILES = {
  meals: path.join(TMP_DIR, 'meals.json'),
  workouts: path.join(TMP_DIR, 'workouts.json'),
  weight: path.join(TMP_DIR, 'weight.json'),
  goals: path.join(TMP_DIR, 'goals.json')
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function seedData() {
  const today = todayISO();
  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  return {
    meals: [
      { id: 1, user_id: 1, name: 'Oats with milk', emoji: '🥣', meal_type: 'breakfast', calories: 310, protein: 12, carbs: 48, fat: 7, date: today, created_at: now },
      { id: 2, user_id: 1, name: 'Chicken breast and rice', emoji: '🍗', meal_type: 'lunch', calories: 580, protein: 52, carbs: 64, fat: 8, date: today, created_at: now },
      { id: 3, user_id: 1, name: 'Boiled eggs ×3', emoji: '🥚', meal_type: 'snack', calories: 210, protein: 18, carbs: 2, fat: 14, date: today, created_at: now },
      { id: 4, user_id: 1, name: 'Grilled salmon', emoji: '🐟', meal_type: 'dinner', calories: 380, protein: 34, carbs: 5, fat: 22, date: today, created_at: now }
    ],
    workouts: [],
    weight: [
      { id: 1, user_id: 1, weight_kg: 87.0, body_fat: null, notes: '', date: `${year}-01-05`, logged_at: now },
      { id: 2, user_id: 1, weight_kg: 85.5, body_fat: null, notes: '', date: `${year}-02-05`, logged_at: now },
      { id: 3, user_id: 1, weight_kg: 84.2, body_fat: null, notes: '', date: `${year}-03-05`, logged_at: now },
      { id: 4, user_id: 1, weight_kg: 83.1, body_fat: null, notes: '', date: `${year}-04-05`, logged_at: now },
      { id: 5, user_id: 1, weight_kg: 82.5, body_fat: null, notes: '', date: `${year}-05-05`, logged_at: now }
    ],
    goals: [
      { id: 1, user_id: 1, name: 'Reach 77 kg', icon: '⚖️', current_value: 82.5, target_value: 77, unit: 'kg', deadline: `${year}-12-01`, completed: false, created_at: now },
      { id: 2, user_id: 1, name: 'Bench 100kg', icon: '💪', current_value: 80, target_value: 100, unit: 'kg', deadline: `${year}-11-01`, completed: false, created_at: now },
      { id: 3, user_id: 1, name: '10km in 50 min', icon: '🏃', current_value: 62, target_value: 50, unit: 'min', deadline: `${year}-10-15`, completed: false, created_at: now },
      { id: 4, user_id: 1, name: 'Burn 300 kcal daily', icon: '🔥', current_value: 220, target_value: 300, unit: 'kcal', deadline: `${year}-09-01`, completed: false, created_at: now }
    ]
  };
}

function ensureStore() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const seed = seedData();
  Object.keys(FILES).forEach(key => {
    if (!fs.existsSync(FILES[key])) {
      fs.writeFileSync(FILES[key], JSON.stringify(seed[key], null, 2));
    }
  });
}

function readJSON(resource) {
  try {
    const data = JSON.parse(fs.readFileSync(FILES[resource], 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeJSON(resource, data) {
  fs.writeFileSync(FILES[resource], JSON.stringify(data, null, 2));
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

function parseBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

module.exports = { ensureStore, readJSON, writeJSON, nextId, todayISO, parseBody };
