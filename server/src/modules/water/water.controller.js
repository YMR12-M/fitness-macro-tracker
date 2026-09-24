import { asyncHandler } from '../../utils/async-handler.js';
import { todayISO } from '../../utils/dates.js';
import * as waterService from './water.service.js';

const goalFor = (req) => Number(req.user.water_goal_ml ?? 2500);
const resolveDate = (req) => req.validatedQuery?.date ?? req.body?.date ?? todayISO(req.user.timezone);

export const get = asyncHandler(async (req, res) => {
  const date = resolveDate(req);
  const [total, entries] = await Promise.all([
    waterService.dayTotal(req.user.id, date, goalFor(req)),
    waterService.listEntries(req.user.id, date)
  ]);
  res.json({ ...total, log: entries });
});

export const add = asyncHandler(async (req, res) => {
  const date = await waterService.addWater(req.user.id, req.body.amount_ml, req.body.date, req.user.timezone);
  res.status(201).json(await waterService.dayTotal(req.user.id, date, goalFor(req)));
});

export const undo = asyncHandler(async (req, res) => {
  const date = resolveDate(req);
  await waterService.undoLast(req.user.id, date);
  res.json(await waterService.dayTotal(req.user.id, date, goalFor(req)));
});
