import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './users.controller.js';
import { deleteAccountSchema, updateProfileSchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.get('/me', controller.getProfile);
usersRouter.patch('/me', validateBody(updateProfileSchema), controller.updateProfile);
usersRouter.post('/me/recalculate-targets', controller.recalculateTargets);
usersRouter.get('/me/export', controller.exportData);
usersRouter.delete('/me', validateBody(deleteAccountSchema), controller.deleteAccount);
