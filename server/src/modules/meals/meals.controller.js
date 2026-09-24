import { asyncHandler } from '../../utils/async-handler.js';
import * as mealsService from './meals.service.js';

export const list = asyncHandler(async (req, res) => {
  const meals = await mealsService.listMeals(req.user.id, req.validatedQuery, req.user.timezone);
  res.json({ meals });
});

export const frequent = asyncHandler(async (req, res) => {
  res.json({ meals: await mealsService.frequentMeals(req.user.id) });
});

export const create = asyncHandler(async (req, res) => {
  const meal = await mealsService.createMeal(req.user.id, req.body, req.user.timezone);
  res.status(201).json({ meal });
});

export const update = asyncHandler(async (req, res) => {
  const meal = await mealsService.updateMeal(req.user.id, req.params.id, req.body);
  res.json({ meal });
});

export const remove = asyncHandler(async (req, res) => {
  await mealsService.deleteMeal(req.user.id, req.params.id);
  res.status(204).end();
});
