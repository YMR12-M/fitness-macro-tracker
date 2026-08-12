// GET /api/weight?user_id=   -> weight history: { entries, latest_kg }
// POST /api/weight           -> log a weight entry
const { ensureStore, readJSON, writeJSON, nextId, todayISO, parseBody } = require('../lib/store');

module.exports = (req, res) => {
  ensureStore();
  let weight = readJSON('weight');

  if (req.method === 'GET') {
    const userId = Number(req.query.user_id);
    const entries = weight
      .filter(w => w.user_id === userId)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 60);
    const latest = entries[entries.length - 1];
    return res.status(200).json({ entries, latest_kg: latest ? latest.weight_kg : null });
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
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
    writeJSON('weight', weight);
    return res.status(201).json(entry);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
