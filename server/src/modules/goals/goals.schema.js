import { z } from 'zod';
import { isoDate } from '../../utils/date-schema.js';

const value = z.coerce.number().min(-100000).max(1000000);

export const listGoalsSchema = z.object({
  include_completed: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true')
});

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, 'Give the goal a name').max(160),
  icon: z.string().max(16).default('🎯'),
  direction: z.enum(['increase', 'decrease']).default('increase'),
  start_value: value.optional(),
  current_value: value,
  target_value: value,
  unit: z.string().trim().max(24).default(''),
  deadline: isoDate.optional()
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  icon: z.string().max(16).optional(),
  direction: z.enum(['increase', 'decrease']).optional(),
  start_value: value.optional(),
  current_value: value.optional(),
  target_value: value.optional(),
  unit: z.string().trim().max(24).optional(),
  deadline: isoDate.nullable().optional()
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
