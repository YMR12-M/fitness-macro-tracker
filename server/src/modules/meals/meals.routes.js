import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './meals.controller.js';
import { createMealSchema, idParamSchema, listMealsSchema, updateMealSchema } from './meals.schema.js';

export const mealsRouter = Router();

mealsRouter.get('/', validateQuery(listMealsSchema), controller.list);
mealsRouter.get('/frequent', controller.frequent);
mealsRouter.post('/', validateBody(createMealSchema), controller.create);
mealsRouter.patch('/:id', validateParams(idParamSchema), validateBody(updateMealSchema), controller.update);
mealsRouter.delete('/:id', validateParams(idParamSchema), controller.remove);
