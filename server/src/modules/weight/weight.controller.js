import { asyncHandler } from '../../utils/async-handler.js';
import * as weightService from './weight.service.js';

export const list = asyncHandler(async (req, res) => {
  const entries = await weightService.listEntries(req.user.id, req.validatedQuery, req.user.timezone);
  const latest = entries.length ? entries[entries.length - 1] : null;
  res.json({ entries, latest });
});

export const trend = asyncHandler(async (req, res) => {
  res.json(await weightService.trend(req.user.id, req.validatedQuery.days, req.user.timezone));
});

export const create = asyncHandler(async (req, res) => {
  const entry = await weightService.upsertEntry(req.user.id, req.body, req.user.timezone);
  res.status(201).json({ entry });
});

export const remove = asyncHandler(async (req, res) => {
  await weightService.deleteEntry(req.user.id, req.params.id);
  res.status(204).end();
});
