// GET /api/summary?user_id=&log_date=   -> daily nutrition + workout totals
const { ensureStore, readJSON, todayISO } = require('../lib/store');

module.exports = (req, res) => {
  ensureStore();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = Number(req.query.user_id);
  const logDate = req.query.log_date || req.query.date || todayISO();
  const meals = readJSON('meals').filter(m => m.user_id === userId && m.date === logDate);
  const workouts = readJSON('workouts').filter(w => w.user_id === userId && w.date === logDate);

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
};
