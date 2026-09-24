// Profile and daily targets — the settings page writes here, and every summary
// measures against what this returns.
import { execute, query, queryOne, withTransaction } from '../../db/pool.js';
import { buildUpdate } from '../../utils/sql.js';
import { notFound } from '../../utils/http-error.js';
import { estimateTargets } from '../summary/tdee.js';

const PROFILE_FIELDS = [
  'sex', 'birth_date', 'height_cm', 'activity_level', 'goal_type',
  'calorie_goal', 'protein_goal_g', 'carbs_goal_g', 'fat_goal_g',
  'water_goal_ml', 'units', 'theme', 'timezone'
];

export async function getProfile(userId) {
  const profile = await queryOne(
    `SELECT u.id, u.email, u.name, u.created_at,
            p.sex, p.birth_date, p.height_cm, p.activity_level, p.goal_type,
            p.calorie_goal, p.protein_goal_g, p.carbs_goal_g, p.fat_goal_g,
            p.water_goal_ml, p.units, p.theme, p.timezone
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ?`,
    [userId]
  );
  if (!profile) throw notFound('User not found');
  return profile;
}

export async function updateProfile(userId, patch) {
  const { name, ...profilePatch } = patch;

  await withTransaction(async (conn) => {
    if (name !== undefined) {
      await conn.execute('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    }

    const { clause, params, isEmpty } = buildUpdate(profilePatch, PROFILE_FIELDS);
    if (!isEmpty) {
      await conn.execute(`UPDATE user_profiles SET ${clause} WHERE user_id = ?`, [...params, userId]);
    }
  });

  return getProfile(userId);
}

/**
 * Recalculate targets from the profile's body stats and the latest logged
 * weight. This is what the calculator's "apply" button calls, so the numbers
 * on the dashboard trace back to a real measurement rather than a typed guess.
 */
export async function recalculateTargets(userId) {
  const profile = await getProfile(userId);
  const latestWeight = await queryOne(
    'SELECT weight_kg FROM weight_entries WHERE user_id = ? ORDER BY recorded_on DESC LIMIT 1',
    [userId]
  );

  const targets = estimateTargets({
    sex: profile.sex,
    birthDate: profile.birth_date,
    heightCm: profile.height_cm,
    weightKg: latestWeight?.weight_kg,
    activityLevel: profile.activity_level,
    goalType: profile.goal_type
  });

  await execute(
    `UPDATE user_profiles
        SET calorie_goal = ?, protein_goal_g = ?, carbs_goal_g = ?, fat_goal_g = ?
      WHERE user_id = ?`,
    [targets.calories, targets.protein_g, targets.carbs_g, targets.fat_g, userId]
  );

  return { profile: await getProfile(userId), applied: targets, based_on_weight_kg: latestWeight?.weight_kg ?? null };
}

/** Full export of everything this account owns — data portability, and a real backup. */
export async function exportData(userId) {
  const tables = {
    profile: 'SELECT * FROM user_profiles WHERE user_id = ?',
    meals: 'SELECT * FROM meal_entries WHERE user_id = ? ORDER BY logged_on',
    workouts: 'SELECT * FROM workouts WHERE user_id = ? ORDER BY performed_on',
    weight: 'SELECT * FROM weight_entries WHERE user_id = ? ORDER BY recorded_on',
    goals: 'SELECT * FROM goals WHERE user_id = ? ORDER BY id',
    water: 'SELECT * FROM water_entries WHERE user_id = ? ORDER BY logged_on',
    custom_foods: 'SELECT * FROM foods WHERE created_by = ? ORDER BY id'
  };

  const entries = await Promise.all(
    Object.entries(tables).map(async ([key, sql]) => [key, await query(sql, [userId])])
  );

  return {
    exported_at: new Date().toISOString(),
    user: await getProfile(userId),
    ...Object.fromEntries(entries)
  };
}

/** Account deletion. Foreign keys cascade, so one statement removes everything. */
export async function deleteAccount(userId) {
  const result = await execute('DELETE FROM users WHERE id = ?', [userId]);
  if (!result.affectedRows) throw notFound('User not found');
}
