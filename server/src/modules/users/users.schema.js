import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  sex: z.enum(['male', 'female']).nullable().optional(),
  birth_date: z.string().date().nullable().optional(),
  height_cm: z.coerce.number().min(80).max(260).nullable().optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal_type: z.enum(['cut', 'maintain', 'bulk']).optional(),
  calorie_goal: z.coerce.number().int().min(1000).max(8000).optional(),
  protein_goal_g: z.coerce.number().int().min(20).max(500).optional(),
  carbs_goal_g: z.coerce.number().int().min(0).max(1000).optional(),
  fat_goal_g: z.coerce.number().int().min(10).max(400).optional(),
  water_goal_ml: z.coerce.number().int().min(500).max(8000).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  theme: z.enum(['dark', 'light']).optional(),
  timezone: z.string().max(64).optional()
});

export const deleteAccountSchema = z.object({
  confirm: z.literal('DELETE', { errorMap: () => ({ message: 'Type DELETE to confirm' }) })
});
