import { z } from 'zod';
import { isoDate, pastIsoDate } from '../../utils/date-schema.js';


const setSchema = z.object({
  exercise_name: z.string().trim().min(1).max(160),
  muscle: z.string().trim().max(60).optional(),
  set_number: z.coerce.number().int().min(1).max(50),
  reps: z.coerce.number().int().min(0).max(1000).optional(),
  weight_kg: z.coerce.number().min(0).max(1000).optional(),
  completed: z.coerce.boolean().default(true)
});

export const listWorkoutsSchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  days: z.coerce.number().int().min(1).max(730).default(30),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const statsSchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30)
});

export const createWorkoutSchema = z.object({
  program_id: z.coerce.number().int().positive().optional(),
  workout_type: z.string().trim().min(2, 'What kind of session was it?').max(80),
  duration_minutes: z.coerce.number().int().min(1, 'Duration must be at least a minute').max(600),
  calories_burned: z.coerce.number().int().min(0).max(10000).default(0),
  intensity: z.enum(['low', 'moderate', 'high']).default('moderate'),
  notes: z.string().trim().max(500).optional(),
  performed_on: pastIsoDate.optional(),
  sets: z.array(setSchema).max(100).optional()
});

export const setCompletionSchema = z.object({ completed: z.coerce.boolean() });
export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const setParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  setId: z.coerce.number().int().positive()
});
export const programParamSchema = z.object({ programId: z.coerce.number().int().positive() });
