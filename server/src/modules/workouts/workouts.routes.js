import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './workouts.controller.js';
import {
  createWorkoutSchema,
  idParamSchema,
  listWorkoutsSchema,
  programParamSchema,
  setCompletionSchema,
  setParamsSchema,
  statsSchema
} from './workouts.schema.js';

export const workoutsRouter = Router();

workoutsRouter.get('/', validateQuery(listWorkoutsSchema), controller.list);
workoutsRouter.get('/stats', validateQuery(statsSchema), controller.stats);
workoutsRouter.get('/today', controller.today);
workoutsRouter.post('/', validateBody(createWorkoutSchema), controller.create);
workoutsRouter.delete('/:id', validateParams(idParamSchema), controller.remove);
workoutsRouter.patch(
  '/:id/sets/:setId',
  validateParams(setParamsSchema),
  validateBody(setCompletionSchema),
  controller.toggleSet
);

export const programsRouter = Router();
programsRouter.get('/', controller.listPrograms);
programsRouter.post('/:programId/select', validateParams(programParamSchema), controller.selectProgram);
