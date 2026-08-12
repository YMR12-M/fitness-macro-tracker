// GET /api/meals?user_id=&log_date=   -> list meals for a day
// POST /api/meals                     -> log a meal
// DELETE /api/meals?id=               -> remove a meal
const { ensureStore, readJSON, writeJSON, nextId, todayISO, parseBody } = require('../lib/store');

module.exports = (req, res) => {
  ensureStore();
  let meals = readJSON('meals');

  if (req.method === 'GET') {
    const userId = Number(req.query.user_id);
    const logDate = req.query.log_date || todayISO();
    const result = meals
      .filter(m => m.user_id === userId && m.date === logDate)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
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
    writeJSON('meals', meals);
    return res.status(201).json(meal);
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    const found = meals.some(m => m.id === id);
    if (!found) return res.status(404).json({ error: 'Meal not found' });
    meals = meals.filter(m => m.id !== id);
    writeJSON('meals', meals);
    return res.status(200).json({ message: 'Meal deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
