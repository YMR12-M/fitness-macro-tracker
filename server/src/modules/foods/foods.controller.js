import { asyncHandler } from '../../utils/async-handler.js';
import * as foodsService from './foods.service.js';

export const search = asyncHandler(async (req, res) => {
  const { q, limit } = req.validatedQuery;
  const result = await foodsService.searchFoods(req.user.id, q, limit);
  res.json(result);
});

export const stats = asyncHandler(async (_req, res) => {
  res.json(await foodsService.catalogStats());
});

export const get = asyncHandler(async (req, res) => {
  res.json({ food: await foodsService.getFood(req.user.id, req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ food: await foodsService.createFood(req.user.id, req.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ food: await foodsService.updateFood(req.user.id, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await foodsService.deleteFood(req.user.id, req.params.id);
  res.status(204).end();
});
