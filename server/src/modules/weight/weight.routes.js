import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './weight.controller.js';
import { createWeightSchema, idParamSchema, listWeightSchema, trendSchema } from './weight.schema.js';

export const weightRouter = Router();

weightRouter.get('/', validateQuery(listWeightSchema), controller.list);
weightRouter.get('/trend', validateQuery(trendSchema), controller.trend);
weightRouter.post('/', validateBody(createWeightSchema), controller.create);
weightRouter.delete('/:id', validateParams(idParamSchema), controller.remove);
