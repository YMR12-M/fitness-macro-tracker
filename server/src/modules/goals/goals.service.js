// User-defined goals. Progress is a real calculation against start/target and
// the goal's direction, replacing the old `lower: true` guesswork.
import { execute, query, queryOne } from '../../db/pool.js';
import { notFound } from '../../utils/http-error.js';
import { buildUpdate } from '../../utils/sql.js';
import { daysRemaining, isReached, progressPercent } from './goal-progress.js';

const SELECT_COLUMNS = `
  id, title, icon, direction, start_value, current_value, target_value,
  unit, deadline, completed_at, created_at, updated_at
`;

const UPDATABLE = ['title', 'icon', 'direction', 'start_value', 'current_value', 'target_value', 'unit', 'deadline'];

function decorate(goal) {
  const daysLeft = daysRemaining(goal.deadline);
  return {
    ...goal,
    progress_percent: progressPercent(goal),
    completed: Boolean(goal.completed_at),
    days_remaining: daysLeft,
    overdue: daysLeft !== null && daysLeft < 0 && !goal.completed_at
  };
}

export async function listGoals(userId, { include_completed: includeCompleted = true } = {}) {
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM goals
      WHERE user_id = ? ${includeCompleted ? '' : 'AND completed_at IS NULL'}
      ORDER BY completed_at IS NOT NULL, deadline IS NULL, deadline ASC, id ASC`,
    [userId]
  );
  return rows.map(decorate);
}

export async function getGoal(userId, id) {
  const goal = await queryOne(`SELECT ${SELECT_COLUMNS} FROM goals WHERE id = ? AND user_id = ?`, [id, userId]);
  if (!goal) throw notFound('Goal not found');
  return decorate(goal);
}

export async function createGoal(userId, input) {
  // Without an explicit starting point, "progress" would be meaningless, so the
  // current value doubles as the baseline.
  const startValue = input.start_value ?? input.current_value;
  const completedAt = isReached({ ...input, start_value: startValue }) ? new Date() : null;

  const result = await execute(
    `INSERT INTO goals
       (user_id, title, icon, direction, start_value, current_value, target_value, unit, deadline, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.title,
      input.icon,
      input.direction,
      startValue,
      input.current_value,
      input.target_value,
      input.unit,
      input.deadline ?? null,
      completedAt
    ]
  );
  return getGoal(userId, result.insertId);
}

export async function updateGoal(userId, id, patch) {
  const existing = await getGoal(userId, id);
  const { clause, params, isEmpty } = buildUpdate(patch, UPDATABLE);
  if (isEmpty) return existing;

  const merged = { ...existing, ...patch };
  // Completion is derived, never sent by the client: hitting the target marks
  // it done, and moving back away from it un-marks it.
  const completedAt = isReached(merged) ? (existing.completed_at ?? new Date()) : null;

  await execute(`UPDATE goals SET ${clause}, completed_at = ? WHERE id = ? AND user_id = ?`, [
    ...params,
    completedAt,
    id,
    userId
  ]);
  return getGoal(userId, id);
}

export async function deleteGoal(userId, id) {
  const result = await execute('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
  if (!result.affectedRows) throw notFound('Goal not found');
}
