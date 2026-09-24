// Body-weight history. One entry per day per user (enforced by a unique key),
// so logging twice corrects the day rather than creating a duplicate point.
import { execute, query, queryOne } from '../../db/pool.js';
import { notFound } from '../../utils/http-error.js';
import { daysAgo, todayISO } from '../../utils/dates.js';

export async function listEntries(userId, { from, to, days = 180 } = {}, timezone = 'UTC') {
  const start = from ?? daysAgo(days, timezone);
  const end = to ?? todayISO(timezone);
  return query(
    `SELECT id, weight_kg, body_fat_pct, notes, recorded_on
       FROM weight_entries
      WHERE user_id = ? AND recorded_on BETWEEN ? AND ?
      ORDER BY recorded_on ASC`,
    [userId, start, end]
  );
}

export async function upsertEntry(userId, input, timezone = 'UTC') {
  const recordedOn = input.recorded_on ?? todayISO(timezone);
  await execute(
    `INSERT INTO weight_entries (user_id, weight_kg, body_fat_pct, notes, recorded_on)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       weight_kg = VALUES(weight_kg),
       body_fat_pct = VALUES(body_fat_pct),
       notes = VALUES(notes)`,
    [userId, input.weight_kg, input.body_fat_pct ?? null, input.notes ?? null, recordedOn]
  );

  return queryOne(
    `SELECT id, weight_kg, body_fat_pct, notes, recorded_on
       FROM weight_entries WHERE user_id = ? AND recorded_on = ?`,
    [userId, recordedOn]
  );
}

export async function deleteEntry(userId, id) {
  const result = await execute('DELETE FROM weight_entries WHERE id = ? AND user_id = ?', [id, userId]);
  if (!result.affectedRows) throw notFound('Weight entry not found');
}

/**
 * Trend over a window. Includes a 7-point moving average because day-to-day
 * body weight swings on water alone — the average is what actually tracks fat
 * loss, and reporting the raw delta as "progress" would be misleading.
 */
export async function trend(userId, days = 30, timezone = 'UTC') {
  const entries = await listEntries(userId, { days }, timezone);
  if (!entries.length) {
    return { entries: [], first: null, latest: null, change_kg: null, weekly_rate_kg: null, moving_average: [] };
  }

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const changeKg = Number((latest.weight_kg - first.weight_kg).toFixed(2));

  const spanDays = Math.max(
    1,
    (new Date(latest.recorded_on) - new Date(first.recorded_on)) / (1000 * 60 * 60 * 24)
  );

  const movingAverage = entries.map((entry, index) => {
    const window = entries.slice(Math.max(0, index - 6), index + 1);
    const mean = window.reduce((sum, e) => sum + Number(e.weight_kg), 0) / window.length;
    return { recorded_on: entry.recorded_on, weight_kg: Number(mean.toFixed(2)) };
  });

  return {
    entries,
    first,
    latest,
    change_kg: changeKg,
    weekly_rate_kg: Number(((changeKg / spanDays) * 7).toFixed(2)),
    moving_average: movingAverage
  };
}

