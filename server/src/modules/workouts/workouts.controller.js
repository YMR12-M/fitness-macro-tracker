import { asyncHandler } from '../../utils/async-handler.js';
import * as workoutsService from './workouts.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ workouts: await workoutsService.listWorkouts(req.user.id, req.validatedQuery, req.user.timezone) });
});

export const stats = asyncHandler(async (req, res) => {
  res.json(await workoutsService.stats(req.user.id, req.validatedQuery.days, req.user.timezone));
});

export const create = asyncHandler(async (req, res) => {
  const workout = await workoutsService.createWorkout(req.user.id, req.body, req.user.timezone);
  res.status(201).json({ workout });
});

export const remove = asyncHandler(async (req, res) => {
  await workoutsService.deleteWorkout(req.user.id, req.params.id);
  res.status(204).end();
});

export const toggleSet = asyncHandler(async (req, res) => {
  const workout = await workoutsService.setCompletion(
    req.user.id,
    req.params.id,
    req.params.setId,
    req.body.completed
  );
  res.json({ workout });
});

export const listPrograms = asyncHandler(async (req, res) => {
  res.json({ programs: await workoutsService.listPrograms(req.user.id) });
});

export const selectProgram = asyncHandler(async (req, res) => {
  const program = await workoutsService.selectProgram(req.user.id, req.params.programId, req.user.timezone);
  res.json({ program });
});

export const today = asyncHandler(async (req, res) => {
  res.json(await workoutsService.todaysSession(req.user.id, req.user.timezone));
});
