import { z } from 'zod';
import { isoDate, pastIsoDate } from '../../utils/date-schema.js';


export const listWeightSchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  days: z.coerce.number().int().min(1).max(730).default(180)
});

export const trendSchema = z.object({
  days: z.coerce.number().int().min(7).max(730).default(30)
});

export const createWeightSchema = z.object({
  weight_kg: z.coerce.number().min(25, 'That looks too low').max(400, 'That looks too high'),
  body_fat_pct: z.coerce.number().min(1).max(70).optional(),
  notes: z.string().trim().max(300).optional(),
  recorded_on: pastIsoDate.optional()
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
