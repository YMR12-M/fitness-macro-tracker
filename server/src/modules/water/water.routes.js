import { Router } from 'express';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import * as controller from './water.controller.js';
import { addWaterSchema, waterQuerySchema } from './water.schema.js';

export const waterRouter = Router();

waterRouter.get('/', validateQuery(waterQuerySchema), controller.get);
waterRouter.post('/', validateBody(addWaterSchema), controller.add);
waterRouter.delete('/last', validateQuery(waterQuerySchema), controller.undo);
