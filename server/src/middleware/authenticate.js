// Populates req.user from the access-token cookie (or an Authorization header,
// for API clients that are not browsers). Every data route sits behind this —
// there is no ambient "user 1" anywhere in the codebase.
import { queryOne } from '../db/pool.js';
import { unauthorized } from '../utils/http-error.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../modules/auth/tokens.js';

function extractToken(req) {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export async function attachUser(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const payload = verifyAccessToken(token);
    if (!payload?.sub) return next();

    // Re-read the user so a deleted account cannot keep using a live token.
    const user = await queryOne(
      `SELECT u.id, u.email, u.name, p.timezone, p.calorie_goal, p.protein_goal_g,
              p.carbs_goal_g, p.fat_goal_g, p.water_goal_ml, p.units, p.theme
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = ?`,
      [payload.sub]
    );
    if (user) req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  return next();
}
