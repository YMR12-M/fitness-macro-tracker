import { Router } from 'express';
import { validateQuery } from '../../middleware/validate.js';
import * as controller from './summary.controller.js';
import { dailySchema, rangeSchema, tdeeSchema } from './summary.schema.js';

export const summaryRouter = Router();

summaryRouter.get('/', validateQuery(dailySchema), controller.daily);
summaryRouter.get('/dashboard', controller.dashboard);
summaryRouter.get('/series', validateQuery(rangeSchema), controller.series);
summaryRouter.get('/streak', controller.streak);
summaryRouter.get('/adherence', validateQuery(rangeSchema), controller.adherence);

export const tdeeRouter = Router();
tdeeRouter.get('/', validateQuery(tdeeSchema), controller.tdee);
