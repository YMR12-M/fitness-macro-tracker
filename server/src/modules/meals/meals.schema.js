import { z } from 'zod';
import { isoDate, pastIsoDate } from '../../utils/date-schema.js';

const unit = z.enum(['g', 'ml', 'piece', 'scoop', 'cup', 'tbsp', 'tsp']);
const mealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const listMealsSchema = z.object({
  date: isoDate.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  meal_type: mealType.optional()
});

// Two ways to log: reference a catalog food and a quantity (macros are derived
// server-side from the food row), or supply the macros directly.
export const createMealSchema = z
  .object({
    food_id: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(255).optional(),
    emoji: z.string().max(16).optional(),
    meal_type: mealType.default('lunch'),
    quantity: z.coerce.number().positive().max(10000).default(100),
    unit: unit.default('g'),
    calories: z.coerce.number().min(0).max(20000).optional(),
    protein_g: z.coerce.number().min(0).max(2000).default(0),
    carbs_g: z.coerce.number().min(0).max(2000).default(0),
    fat_g: z.coerce.number().min(0).max(2000).default(0),
    logged_on: pastIsoDate.optional()
  })
  .refine((v) => v.food_id || (v.name && v.calories !== undefined), {
    message: 'Provide either food_id, or both name and calories'
  });

export const updateMealSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  emoji: z.string().max(16).optional(),
  meal_type: mealType.optional(),
  quantity: z.coerce.number().positive().max(10000).optional(),
  unit: unit.optional(),
  calories: z.coerce.number().min(0).max(20000).optional(),
  protein_g: z.coerce.number().min(0).max(2000).optional(),
  carbs_g: z.coerce.number().min(0).max(2000).optional(),
  fat_g: z.coerce.number().min(0).max(2000).optional(),
  logged_on: pastIsoDate.optional()
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
