import { z } from 'zod';

const unit = z.enum(['g', 'ml', 'piece', 'scoop', 'cup', 'tbsp', 'tsp']);

export const searchFoodsSchema = z.object({
  q: z.string().trim().min(1, 'Enter something to search for').max(120),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const createFoodSchema = z.object({
  name: z.string().trim().min(2).max(255),
  brand: z.string().trim().max(180).optional(),
  category: z.string().trim().max(120).optional(),
  emoji: z.string().max(16).optional(),
  serving_size: z.coerce.number().positive().max(10000).default(100),
  serving_unit: unit.default('g'),
  calories: z.coerce.number().min(0).max(10000),
  protein_g: z.coerce.number().min(0).max(1000).default(0),
  carbs_g: z.coerce.number().min(0).max(1000).default(0),
  fat_g: z.coerce.number().min(0).max(1000).default(0),
  fiber_g: z.coerce.number().min(0).max(1000).optional(),
  sugar_g: z.coerce.number().min(0).max(1000).optional(),
  sodium_mg: z.coerce.number().min(0).max(100000).optional()
});

export const updateFoodSchema = createFoodSchema.partial();
export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
