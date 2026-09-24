import { asyncHandler } from '../../utils/async-handler.js';
import * as usersService from './users.service.js';
import { clearAuthCookies } from '../auth/tokens.js';

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await usersService.getProfile(req.user.id) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await usersService.updateProfile(req.user.id, req.body) });
});

export const recalculateTargets = asyncHandler(async (req, res) => {
  res.json(await usersService.recalculateTargets(req.user.id));
});

export const exportData = asyncHandler(async (req, res) => {
  const data = await usersService.exportData(req.user.id);
  res.setHeader('Content-Disposition', `attachment; filename="fittrack-export-${data.exported_at.slice(0, 10)}.json"`);
  res.json(data);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await usersService.deleteAccount(req.user.id);
  clearAuthCookies(res);
  res.status(204).end();
});
