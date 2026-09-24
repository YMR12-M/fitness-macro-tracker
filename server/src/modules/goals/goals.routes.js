import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './goals.controller.js';
import { createGoalSchema, idParamSchema, listGoalsSchema, updateGoalSchema } from './goals.schema.js';

export const goalsRouter = Router();

goalsRouter.get('/', validateQuery(listGoalsSchema), controller.list);
goalsRouter.post('/', validateBody(createGoalSchema), controller.create);
goalsRouter.patch('/:id', validateParams(idParamSchema), validateBody(updateGoalSchema), controller.update);
goalsRouter.delete('/:id', validateParams(idParamSchema), controller.remove);
