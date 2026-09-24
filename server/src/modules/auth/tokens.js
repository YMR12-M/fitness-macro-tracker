// Token handling for the auth flow.
//
// Access token:  short-lived JWT, httpOnly cookie, sent on every request.
// Refresh token: long-lived random string, httpOnly cookie, stored hashed in
//                `sessions` so it can be revoked server-side on logout.
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../../config/env.js';

export const ACCESS_COOKIE = 'fittrack_access';
export const REFRESH_COOKIE = 'fittrack_refresh';

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user.id), email: user.email }, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: 'fittrack'
  });

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { issuer: 'fittrack' });
  } catch {
    return null;
  }
}

export const createRefreshToken = () => randomBytes(48).toString('hex');
export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const refreshExpiryDate = () =>
  new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

const cookieBase = {
  httpOnly: true,
  secure: env.COOKIE_SECURE || isProduction,
  // 'none' is required when the client is on a different origin over HTTPS.
  sameSite: env.COOKIE_SECURE || isProduction ? 'none' : 'lax',
  path: '/',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};

export function setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt }) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 60 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, expires: refreshExpiresAt });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, cookieBase);
  res.clearCookie(REFRESH_COOKIE, cookieBase);
}
