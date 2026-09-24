import { asyncHandler } from '../../utils/async-handler.js';
import * as goalsService from './goals.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ goals: await goalsService.listGoals(req.user.id, req.validatedQuery) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ goal: await goalsService.createGoal(req.user.id, req.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ goal: await goalsService.updateGoal(req.user.id, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await goalsService.deleteGoal(req.user.id, req.params.id);
  res.status(204).end();
});
