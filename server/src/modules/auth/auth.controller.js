import { asyncHandler } from '../../utils/async-handler.js';
import * as authService from './auth.service.js';
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from './tokens.js';

const requestContext = (req) => ({ userAgent: req.get('user-agent'), ip: req.ip });

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const tokens = await authService.issueSession(user, requestContext(req));
  setAuthCookies(res, tokens);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.verifyCredentials(req.body.email, req.body.password);
  const tokens = await authService.issueSession(user, requestContext(req));
  setAuthCookies(res, tokens);
  res.json({ user });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.rotateSession(req.cookies?.[REFRESH_COOKIE], requestContext(req));
  setAuthCookies(res, tokens);
  res.json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: await authService.findUserById(req.user.id) });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
  clearAuthCookies(res);
  res.status(204).end();
});

export const sessions = asyncHandler(async (req, res) => {
  res.json({ sessions: await authService.listSessions(req.user.id) });
});
