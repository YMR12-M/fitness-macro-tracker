// GET /api/goals?user_id=                        -> list goals
// POST /api/goals                                 -> create a goal
// PATCH /api/goals?id=&current_value=             -> update progress
// DELETE /api/goals?id=                           -> delete a goal
const { ensureStore, readJSON, writeJSON, nextId, parseBody } = require('../lib/store');

module.exports = (req, res) => {
  ensureStore();
  let goals = readJSON('goals');

  if (req.method === 'GET') {
    const userId = Number(req.query.user_id);
    const result = goals
      .filter(g => g.user_id === userId)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
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
    writeJSON('goals', goals);
    return res.status(201).json(goal);
  }

  if (req.method === 'PATCH') {
    const id = Number(req.query.id);
    const body = parseBody(req);
    const currentValue = Number(req.query.current_value ?? body.current_value);
    const goal = goals.find(g => g.id === id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    goal.current_value = currentValue;
    goal.completed = currentValue >= goal.target_value;
    writeJSON('goals', goals);
    return res.status(200).json(goal);
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    const found = goals.some(g => g.id === id);
    if (!found) return res.status(404).json({ error: 'Goal not found' });
    goals = goals.filter(g => g.id !== id);
    writeJSON('goals', goals);
    return res.status(200).json({ message: 'Goal deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
