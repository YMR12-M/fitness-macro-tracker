// Account lifecycle: create, verify credentials, issue and rotate sessions.
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { execute, query, queryOne, withTransaction } from '../../db/pool.js';
import { conflict, unauthorized } from '../../utils/http-error.js';
import { todayISO } from '../../utils/dates.js';
import { createRefreshToken, hashToken, refreshExpiryDate, signAccessToken } from './tokens.js';
import { estimateTargets } from '../../modules/summary/tdee.js';

const PUBLIC_USER_COLUMNS = `u.id, u.email, u.name, u.created_at`;

export async function findUserById(id) {
  return queryOne(
    `SELECT ${PUBLIC_USER_COLUMNS},
            p.sex, p.birth_date, p.height_cm, p.activity_level, p.goal_type,
            p.calorie_goal, p.protein_goal_g, p.carbs_goal_g, p.fat_goal_g,
            p.water_goal_ml, p.units, p.theme, p.timezone
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ?`,
    [id]
  );
}

export async function registerUser(input) {
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [input.email]);
  if (existing) throw conflict('An account with that email already exists');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  // Seed the daily targets from the body stats given at signup so a new
  // account starts with numbers that mean something, not a fixed 2000 kcal.
  const targets = estimateTargets({
    sex: input.sex,
    birthDate: input.birth_date,
    heightCm: input.height_cm,
    weightKg: input.weight_kg,
    activityLevel: input.activity_level,
    goalType: input.goal_type
  });

  const userId = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [input.email, passwordHash, input.name]
    );
    const id = result.insertId;

    await conn.execute(
      `INSERT INTO user_profiles
         (user_id, sex, birth_date, height_cm, activity_level, goal_type,
          calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.sex ?? null,
        input.birth_date ?? null,
        input.height_cm ?? null,
        input.activity_level ?? 'moderate',
        input.goal_type ?? 'maintain',
        targets.calories,
        targets.protein_g,
        targets.carbs_g,
        targets.fat_g,
        input.timezone ?? 'UTC'
      ]
    );

    // A starting weight is real data the user gave us — record it as the first
    // point of their weight history rather than throwing it away.
    if (input.weight_kg) {
      await conn.execute(
        'INSERT INTO weight_entries (user_id, weight_kg, recorded_on) VALUES (?, ?, ?)',
        [id, input.weight_kg, todayISO(input.timezone ?? 'UTC')]
      );
    }

    return id;
  });

  return findUserById(userId);
}

export async function verifyCredentials(email, password) {
  const row = await queryOne('SELECT id, password_hash FROM users WHERE email = ?', [email]);

  // Hash even when the account is missing so response time does not reveal
  // whether an email is registered.
  const hash = row?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const valid = await bcrypt.compare(password, hash);

  if (!row || !valid) throw unauthorized('Incorrect email or password');
  return findUserById(row.id);
}

export async function issueSession(user, { userAgent, ip } = {}) {
  const refreshToken = createRefreshToken();
  const expiresAt = refreshExpiryDate();

  await execute(
    'INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
    [user.id, hashToken(refreshToken), userAgent?.slice(0, 255) ?? null, ip?.slice(0, 45) ?? null, expiresAt]
  );

  return { accessToken: signAccessToken(user), refreshToken, refreshExpiresAt: expiresAt };
}

/** Exchange a refresh token for a new pair, invalidating the old one. */
export async function rotateSession(refreshToken, context) {
  if (!refreshToken) throw unauthorized('No refresh token supplied');

  const session = await queryOne(
    `SELECT id, user_id FROM sessions
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW(3)`,
    [hashToken(refreshToken)]
  );
  if (!session) throw unauthorized('Session expired, please sign in again');

  await execute('UPDATE sessions SET revoked_at = NOW(3) WHERE id = ?', [session.id]);

  const user = await findUserById(session.user_id);
  if (!user) throw unauthorized('Account no longer exists');

  return { user, tokens: await issueSession(user, context) };
}

export async function revokeSession(refreshToken) {
  if (!refreshToken) return;
  await execute('UPDATE sessions SET revoked_at = NOW(3) WHERE token_hash = ? AND revoked_at IS NULL', [
    hashToken(refreshToken)
  ]);
}

export async function revokeAllSessions(userId) {
  await execute('UPDATE sessions SET revoked_at = NOW(3) WHERE user_id = ? AND revoked_at IS NULL', [userId]);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const row = await queryOne('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!row || !(await bcrypt.compare(currentPassword, row.password_hash))) {
    throw unauthorized('Current password is incorrect');
  }
  const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
  // A password change signs out every other device.
  await revokeAllSessions(userId);
}

/** Housekeeping: drop sessions that are expired or long revoked. */
export async function pruneSessions() {
  const result = await execute(
    'DELETE FROM sessions WHERE expires_at < NOW(3) OR (revoked_at IS NOT NULL AND revoked_at < NOW(3) - INTERVAL 7 DAY)'
  );
  return result.affectedRows;
}

export async function listSessions(userId) {
  return query(
    `SELECT id, user_agent, ip_address, created_at, expires_at
       FROM sessions
      WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW(3)
      ORDER BY created_at DESC`,
    [userId]
  );
}
