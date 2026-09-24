import { z } from 'zod';
import { isoDate } from '../../utils/date-schema.js';


export const dailySchema = z.object({ date: isoDate.optional() });
export const rangeSchema = z.object({ days: z.coerce.number().int().min(1).max(365).default(7) });

export const tdeeSchema = z.object({
  sex: z.enum(['male', 'female']).default('male'),
  weight_kg: z.coerce.number().min(25).max(400),
  height_cm: z.coerce.number().min(80).max(260),
  age: z.coerce.number().int().min(13).max(120),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).default('moderate'),
  goal_type: z.enum(['cut', 'maintain', 'bulk']).default('maintain')
});
