// Training log: sessions, their per-set detail, and the programs behind them.
import { execute, query, queryOne, withTransaction } from '../../db/pool.js';
import { notFound } from '../../utils/http-error.js';
import { daysAgo, todayISO } from '../../utils/dates.js';
import { safeLimit } from '../../utils/sql.js';

const SELECT_COLUMNS = `
  w.id, w.program_id, w.workout_type, w.duration_minutes, w.calories_burned,
  w.intensity, w.notes, w.performed_on, w.created_at
`;

async function attachSets(workouts) {
  if (!workouts.length) return workouts;
  const ids = workouts.map((w) => w.id);
  const placeholders = ids.map(() => '?').join(', ');
  const sets = await query(
    `SELECT id, workout_id, exercise_name, muscle, set_number, reps, weight_kg, completed
       FROM workout_sets
      WHERE workout_id IN (${placeholders})
      ORDER BY exercise_name, set_number`,
    ids
  );

  const byWorkout = new Map(ids.map((id) => [id, []]));
  for (const set of sets) byWorkout.get(set.workout_id)?.push(set);
  return workouts.map((w) => ({ ...w, sets: byWorkout.get(w.id) ?? [] }));
}

export async function listWorkouts(userId, { from, to, days = 30, limit = 50 } = {}, timezone = 'UTC') {
  const start = from ?? daysAgo(days, timezone);
  const end = to ?? todayISO(timezone);
  const workouts = await query(
    `SELECT ${SELECT_COLUMNS} FROM workouts w
      WHERE w.user_id = ? AND w.performed_on BETWEEN ? AND ?
      ORDER BY w.performed_on DESC, w.id DESC
      LIMIT ${safeLimit(limit, 50, 200)}`,
    [userId, start, end]
  );
  return attachSets(workouts);
}

export async function getWorkout(userId, id) {
  const workout = await queryOne(`SELECT ${SELECT_COLUMNS} FROM workouts w WHERE w.id = ? AND w.user_id = ?`, [
    id,
    userId
  ]);
  if (!workout) throw notFound('Workout not found');
  const [withSets] = await attachSets([workout]);
  return withSets;
}

export async function createWorkout(userId, input, timezone = 'UTC') {
  const id = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO workouts
         (user_id, program_id, workout_type, duration_minutes, calories_burned, intensity, notes, performed_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        input.program_id ?? null,
        input.workout_type,
        input.duration_minutes,
        input.calories_burned ?? 0,
        input.intensity,
        input.notes ?? null,
        input.performed_on ?? todayISO(timezone)
      ]
    );

    for (const set of input.sets ?? []) {
      await conn.execute(
        `INSERT INTO workout_sets (workout_id, exercise_name, muscle, set_number, reps, weight_kg, completed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          result.insertId,
          set.exercise_name,
          set.muscle ?? null,
          set.set_number,
          set.reps ?? null,
          set.weight_kg ?? null,
          set.completed ? 1 : 0
        ]
      );
    }

    return result.insertId;
  });

  return getWorkout(userId, id);
}

export async function deleteWorkout(userId, id) {
  // workout_sets cascade on delete, so one statement is enough.
  const result = await execute('DELETE FROM workouts WHERE id = ? AND user_id = ?', [id, userId]);
  if (!result.affectedRows) throw notFound('Workout not found');
}

export async function setCompletion(userId, workoutId, setId, completed) {
  const result = await execute(
    `UPDATE workout_sets s
       JOIN workouts w ON w.id = s.workout_id AND w.user_id = ?
        SET s.completed = ?
      WHERE s.id = ? AND s.workout_id = ?`,
    [userId, completed ? 1 : 0, setId, workoutId]
  );
  if (!result.affectedRows) throw notFound('Set not found');
  return getWorkout(userId, workoutId);
}

/** Totals for the training page header. */
export async function stats(userId, days = 30, timezone = 'UTC') {
  const start = daysAgo(days, timezone);
  const row = await queryOne(
    `SELECT COUNT(*)                          AS sessions,
            COALESCE(SUM(duration_minutes),0) AS total_minutes,
            COALESCE(SUM(calories_burned),0)  AS total_calories,
            COUNT(DISTINCT performed_on)      AS active_days
       FROM workouts
      WHERE user_id = ? AND performed_on >= ?`,
    [userId, start]
  );
  const volume = await queryOne(
    `SELECT COALESCE(SUM(s.reps * s.weight_kg), 0) AS total_volume_kg
       FROM workout_sets s
       JOIN workouts w ON w.id = s.workout_id
      WHERE w.user_id = ? AND w.performed_on >= ? AND s.completed = 1`,
    [userId, start]
  );

  return {
    window_days: days,
    sessions: Number(row.sessions),
    total_minutes: Number(row.total_minutes),
    total_calories: Number(row.total_calories),
    active_days: Number(row.active_days),
    total_volume_kg: Number(volume.total_volume_kg)
  };
}

// ─── Programs ───────────────────────────────────────────────────────────────

export async function listPrograms(userId) {
  return query(
    `SELECT p.id, p.slug, p.name, p.emoji, p.description, p.days_per_week, p.level, p.accent,
            up.active IS NOT NULL AND up.active = 1 AS is_active,
            (SELECT COUNT(*) FROM program_exercises pe WHERE pe.program_id = p.id) AS exercise_count
       FROM programs p
       LEFT JOIN user_programs up ON up.program_id = p.id AND up.user_id = ?
      ORDER BY p.level, p.name`,
    [userId]
  );
}

export async function activeProgram(userId) {
  return queryOne(
    `SELECT p.id, p.slug, p.name, p.emoji, p.days_per_week, p.level, p.accent, up.started_on
       FROM user_programs up
       JOIN programs p ON p.id = up.program_id
      WHERE up.user_id = ? AND up.active = 1
      LIMIT 1`,
    [userId]
  );
}

export async function selectProgram(userId, programId, timezone = 'UTC') {
  const program = await queryOne('SELECT id FROM programs WHERE id = ?', [programId]);
  if (!program) throw notFound('Program not found');

  await withTransaction(async (conn) => {
    await conn.execute('UPDATE user_programs SET active = 0 WHERE user_id = ?', [userId]);
    await conn.execute(
      `INSERT INTO user_programs (user_id, program_id, started_on, active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE active = 1, started_on = VALUES(started_on)`,
      [userId, programId, todayISO(timezone)]
    );
  });

  return activeProgram(userId);
}

/**
 * The exercises prescribed for today. The day rotates through the program on a
 * fixed cycle from the start date, so "today's session" is derived rather than
 * being a hardcoded list.
 */
export async function todaysSession(userId, timezone = 'UTC') {
  const program = await activeProgram(userId);
  if (!program) return { program: null, day_label: null, exercises: [], logged_today: false };

  const daysSinceStart = Math.floor(
    (new Date(`${todayISO(timezone)}T00:00:00Z`) - new Date(`${String(program.started_on).slice(0, 10)}T00:00:00Z`)) /
      (1000 * 60 * 60 * 24)
  );
  const dayIndex = ((daysSinceStart % program.days_per_week) + program.days_per_week) % program.days_per_week;

  const exercises = await query(
    `SELECT id, day_label, name, muscle, target_sets, target_reps, position
       FROM program_exercises
      WHERE program_id = ? AND day_index = ?
      ORDER BY position, id`,
    [program.id, dayIndex]
  );

  const loggedToday = await queryOne(
    'SELECT id FROM workouts WHERE user_id = ? AND performed_on = ? LIMIT 1',
    [userId, todayISO(timezone)]
  );

  return {
    program,
    day_index: dayIndex,
    day_label: exercises[0]?.day_label ?? null,
    exercises,
    logged_today: Boolean(loggedToday)
  };
}
