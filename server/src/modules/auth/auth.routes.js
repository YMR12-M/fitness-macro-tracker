import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schema.js';

// Credential endpoints are the ones worth brute-forcing, so they get their own
// tighter limit than the global one.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: { message: 'Too many attempts. Try again in 15 minutes.' } }
});

export const authRouter = Router();

authRouter.post('/register', credentialLimiter, validateBody(registerSchema), controller.register);
authRouter.post('/login', credentialLimiter, validateBody(loginSchema), controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, controller.me);
authRouter.get('/sessions', requireAuth, controller.sessions);
authRouter.post(
  '/change-password',
  credentialLimiter,
  requireAuth,
  validateBody(changePasswordSchema),
  controller.changePassword
);
