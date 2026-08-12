// GET /api/workouts?user_id=   -> list recent workouts
// POST /api/workouts           -> log a workout
// DELETE /api/workouts?id=     -> remove a workout
const { ensureStore, readJSON, writeJSON, nextId, todayISO, parseBody } = require('../lib/store');

module.exports = (req, res) => {
  ensureStore();
  let workouts = readJSON('workouts');

  if (req.method === 'GET') {
    const userId = Number(req.query.user_id);
    const result = workouts
      .filter(w => w.user_id === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
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
    writeJSON('workouts', workouts);
    return res.status(201).json(workout);
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    const found = workouts.some(w => w.id === id);
    if (!found) return res.status(404).json({ error: 'Workout not found' });
    workouts = workouts.filter(w => w.id !== id);
    writeJSON('workouts', workouts);
    return res.status(200).json({ message: 'Workout deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
