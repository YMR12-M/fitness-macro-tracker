import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), 'Password must contain both a letter and a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(255),
  password,
  // Optional onboarding values; the profile row is created either way.
  sex: z.enum(['male', 'female']).optional(),
  birth_date: z.string().date().optional(),
  height_cm: z.coerce.number().min(80).max(260).optional(),
  weight_kg: z.coerce.number().min(25).max(400).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal_type: z.enum(['cut', 'maintain', 'bulk']).optional(),
  timezone: z.string().max(64).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: password
});
