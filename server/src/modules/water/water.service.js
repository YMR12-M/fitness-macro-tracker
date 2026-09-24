// Water intake. Stored as individual entries rather than a running total so a
// mis-tap can be undone, and so the day's intake can be reconstructed exactly.
import { execute, query, queryOne } from '../../db/pool.js';
import { notFound } from '../../utils/http-error.js';
import { todayISO } from '../../utils/dates.js';

export async function dayTotal(userId, date, goalMl) {
  const row = await queryOne(
    'SELECT COALESCE(SUM(amount_ml), 0) AS amount_ml, COUNT(*) AS entries FROM water_entries WHERE user_id = ? AND logged_on = ?',
    [userId, date]
  );
  const amount = Number(row.amount_ml);
  return {
    date,
    amount_ml: amount,
    goal_ml: goalMl,
    percent: goalMl > 0 ? Math.round((amount / goalMl) * 100) : 0,
    entries: Number(row.entries)
  };
}

export async function listEntries(userId, date) {
  return query(
    'SELECT id, amount_ml, logged_at FROM water_entries WHERE user_id = ? AND logged_on = ? ORDER BY logged_at DESC',
    [userId, date]
  );
}

export async function addWater(userId, amountMl, date, timezone = 'UTC') {
  const loggedOn = date ?? todayISO(timezone);
  await execute('INSERT INTO water_entries (user_id, amount_ml, logged_on) VALUES (?, ?, ?)', [
    userId,
    amountMl,
    loggedOn
  ]);
  return loggedOn;
}

export async function undoLast(userId, date) {
  const last = await queryOne(
    'SELECT id FROM water_entries WHERE user_id = ? AND logged_on = ? ORDER BY logged_at DESC, id DESC LIMIT 1',
    [userId, date]
  );
  if (!last) throw notFound('Nothing logged to undo');
  await execute('DELETE FROM water_entries WHERE id = ? AND user_id = ?', [last.id, userId]);
}
