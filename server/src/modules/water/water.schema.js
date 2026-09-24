import { z } from 'zod';
import { isoDate, pastIsoDate } from '../../utils/date-schema.js';


export const waterQuerySchema = z.object({ date: isoDate.optional() });

export const addWaterSchema = z.object({
  amount_ml: z.coerce.number().int().min(10, 'Too small to be a real drink').max(3000),
  date: pastIsoDate.optional()
});
