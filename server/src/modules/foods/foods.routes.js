import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './foods.controller.js';
import { createFoodSchema, idParamSchema, searchFoodsSchema, updateFoodSchema } from './foods.schema.js';

// Search can reach out to USDA, so it gets its own ceiling to stay well inside
// the upstream rate limit (1,000 requests/hour on a free FDC key).
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Slow down — too many searches.' } }
});

export const foodsRouter = Router();

foodsRouter.get('/search', searchLimiter, validateQuery(searchFoodsSchema), controller.search);
foodsRouter.get('/stats', controller.stats);
foodsRouter.get('/:id', validateParams(idParamSchema), controller.get);
foodsRouter.post('/', validateBody(createFoodSchema), controller.create);
foodsRouter.patch('/:id', validateParams(idParamSchema), validateBody(updateFoodSchema), controller.update);
foodsRouter.delete('/:id', validateParams(idParamSchema), controller.remove);
