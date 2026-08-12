// Vercel serverless API for FitTrack Pro (meals, workouts, weight, goals,
// daily summary, TDEE calculator).
//
// Single catch-all function: `/api/<segments>` all route through here, with
// `req.query.segments` holding the path parts (e.g. ['meals'] or
// ['goals', '3']). This mirrors the REST shape main.py exposed
// (GET/POST /meals, DELETE /meals/:id, PATCH /goals/:id, etc.) so app.js
// only needed API_BASE pointed at '/api'.
//
// Storage note: Vercel's deployment filesystem is read-only at runtime, so
// writes go to /tmp instead. /tmp is seeded with demo data on first use per
// lambda instance, but it is NOT durable — it can reset on cold starts,
// redeploys, or when a request lands on a different instance. That's fine
// for a portfolio/demo deployment; swap in a real database (Vercel
// Postgres, Supabase, etc.) before relying on this for real user data.

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

function readJSON(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

module.exports = (req, res) => {
  ensureStore();

  const segments = [].concat(req.query.segments || []);
  const [resource, resourceId] = segments;
  const method = req.method;
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // ── MEALS ──────────────────────────────────────
  if (resource === 'meals') {
    let meals = readJSON(FILES.meals);

    if (method === 'GET') {
      const userId = Number(req.query.user_id);
      const logDate = req.query.log_date || todayISO();
      const result = meals
        .filter(m => m.user_id === userId && m.date === logDate)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.status(200).json(result);
    }

    if (method === 'POST') {
      if (!body.user_id || !body.name || body.calories === undefined) {
        return res.status(422).json({ error: 'Missing required fields', fields: ['user_id', 'name', 'calories'] });
      }
      const meal = {
        id: nextId(meals),
        user_id: Number(body.user_id),
        name: String(body.name),
        emoji: body.emoji || '🍽️',
        meal_type: body.meal_type || 'lunch',
        calories: Number(body.calories),
        protein: Number(body.protein) || 0,
        carbs: Number(body.carbs) || 0,
        fat: Number(body.fat) || 0,
        date: body.date || todayISO(),
        created_at: new Date().toISOString()
      };
      meals.push(meal);
      writeJSON(FILES.meals, meals);
      return res.status(201).json(meal);
    }

    if (method === 'DELETE' && resourceId) {
      const id = Number(resourceId);
      const found = meals.some(m => m.id === id);
      if (!found) return res.status(404).json({ error: 'Meal not found' });
      meals = meals.filter(m => m.id !== id);
      writeJSON(FILES.meals, meals);
      return res.status(200).json({ message: 'Meal deleted successfully' });
    }
  }

  // ── WORKOUTS ───────────────────────────────────
  if (resource === 'workouts') {
    let workouts = readJSON(FILES.workouts);

    if (method === 'GET') {
      const userId = Number(req.query.user_id);
      const result = workouts
        .filter(w => w.user_id === userId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);
      return res.status(200).json(result);
    }

    if (method === 'POST') {
      if (!body.user_id || !body.workout_type || !body.duration_minutes) {
        return res.status(422).json({ error: 'Missing required fields', fields: ['user_id', 'workout_type', 'duration_minutes'] });
      }
      const workout = {
        id: nextId(workouts),
        user_id: Number(body.user_id),
        workout_type: String(body.workout_type),
        duration_minutes: Number(body.duration_minutes),
        calories_burned: Number(body.calories_burned) || 0,
        intensity: body.intensity || 'moderate',
        notes: body.notes || '',
        date: body.date || todayISO()
      };
      workouts.push(workout);
      writeJSON(FILES.workouts, workouts);
      return res.status(201).json(workout);
    }

    if (method === 'DELETE' && resourceId) {
      const id = Number(resourceId);
      const found = workouts.some(w => w.id === id);
      if (!found) return res.status(404).json({ error: 'Workout not found' });
      workouts = workouts.filter(w => w.id !== id);
      writeJSON(FILES.workouts, workouts);
      return res.status(200).json({ message: 'Workout deleted successfully' });
    }
  }

  // ── WEIGHT ─────────────────────────────────────
  if (resource === 'weight') {
    let weight = readJSON(FILES.weight);

    if (method === 'GET') {
      const userId = Number(req.query.user_id);
      const entries = weight
        .filter(w => w.user_id === userId)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 60);
      const latest = entries[entries.length - 1];
      return res.status(200).json({ entries, latest_kg: latest ? latest.weight_kg : null });
    }

    if (method === 'POST') {
      if (!body.user_id || body.weight_kg === undefined) {
        return res.status(422).json({ error: 'Missing required fields', fields: ['user_id', 'weight_kg'] });
      }
      const entry = {
        id: nextId(weight),
        user_id: Number(body.user_id),
        weight_kg: Number(body.weight_kg),
        body_fat: body.body_fat !== undefined ? Number(body.body_fat) : null,
        notes: body.notes || '',
        date: body.date || todayISO(),
        logged_at: new Date().toISOString()
      };
      weight.push(entry);
      writeJSON(FILES.weight, weight);
      return res.status(201).json(entry);
    }
  }

  // ── GOALS ──────────────────────────────────────
  if (resource === 'goals') {
    let goals = readJSON(FILES.goals);

    if (method === 'GET') {
      const userId = Number(req.query.user_id);
      const result = goals
        .filter(g => g.user_id === userId)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      return res.status(200).json(result);
    }

    if (method === 'POST') {
      if (!body.user_id || !body.name || body.target_value === undefined || !body.deadline) {
        return res.status(422).json({ error: 'Missing required fields', fields: ['user_id', 'name', 'target_value', 'deadline'] });
      }
      const goal = {
        id: nextId(goals),
        user_id: Number(body.user_id),
        name: String(body.name),
        icon: body.icon || '🎯',
        current_value: Number(body.current_value) || 0,
        target_value: Number(body.target_value),
        unit: body.unit || '',
        deadline: body.deadline,
        completed: false,
        created_at: new Date().toISOString()
      };
      goal.completed = goal.current_value >= goal.target_value;
      goals.push(goal);
      writeJSON(FILES.goals, goals);
      return res.status(201).json(goal);
    }

    if (method === 'PATCH' && resourceId) {
      const id = Number(resourceId);
      const currentValue = Number(req.query.current_value ?? body.current_value);
      const goal = goals.find(g => g.id === id);
      if (!goal) return res.status(404).json({ error: 'Goal not found' });
      goal.current_value = currentValue;
      goal.completed = currentValue >= goal.target_value;
      writeJSON(FILES.goals, goals);
      return res.status(200).json(goal);
    }

    if (method === 'DELETE' && resourceId) {
      const id = Number(resourceId);
      const found = goals.some(g => g.id === id);
      if (!found) return res.status(404).json({ error: 'Goal not found' });
      goals = goals.filter(g => g.id !== id);
      writeJSON(FILES.goals, goals);
      return res.status(200).json({ message: 'Goal deleted successfully' });
    }
  }

  // ── DAILY SUMMARY ──────────────────────────────
  if (resource === 'summary' && method === 'GET') {
    const userId = Number(req.query.user_id);
    const logDate = req.query.log_date || req.query.date || todayISO();
    const meals = readJSON(FILES.meals).filter(m => m.user_id === userId && m.date === logDate);
    const workouts = readJSON(FILES.workouts).filter(w => w.user_id === userId && w.date === logDate);

    const eaten = meals.reduce((sum, m) => sum + Number(m.calories || 0), 0);
    const burned = workouts.reduce((sum, w) => sum + Number(w.calories_burned || 0), 0);
    const minutes = workouts.reduce((sum, w) => sum + Number(w.duration_minutes || 0), 0);

    return res.status(200).json({
      date: logDate,
      calories: { eaten, burned, net: eaten - burned, goal: 2000 },
      macros: {
        protein: Math.round(meals.reduce((s, m) => s + Number(m.protein || 0), 0) * 10) / 10,
        carbs: Math.round(meals.reduce((s, m) => s + Number(m.carbs || 0), 0) * 10) / 10,
        fat: Math.round(meals.reduce((s, m) => s + Number(m.fat || 0), 0) * 10) / 10
      },
      workout: { minutes }
    });
  }

  // ── TDEE CALCULATOR (Mifflin-St Jeor) ──────────
  if (resource === 'calc' && segments[1] === 'tdee' && method === 'GET') {
    const weightKg = Number(req.query.weight_kg);
    const heightCm = Number(req.query.height_cm);
    const age = Number(req.query.age);
    const gender = req.query.gender || 'male';
    const activity = req.query.activity || 'moderate';
    const goal = req.query.goal || 'maintain';

    const bmr = gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = bmr * (multipliers[activity] ?? 1.55);

    const adjustments = { cut: -500, maintain: 0, bulk: 300 };
    const targetCalories = tdee + (adjustments[goal] ?? 0);

    return res.status(200).json({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target_calories: Math.round(targetCalories),
      macros: {
        protein_g: Math.round(weightKg * 2.2),
        fat_g: Math.round(targetCalories * 0.25 / 9),
        carbs_g: Math.round((targetCalories - weightKg * 2.2 * 4 - targetCalories * 0.25) / 4)
      }
    });
  }

  return res.status(404).json({ error: 'Resource not found', available: ['meals', 'workouts', 'goals', 'weight', 'summary', 'calc/tdee'] });
};
