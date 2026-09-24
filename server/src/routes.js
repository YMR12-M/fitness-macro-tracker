// Every route the API exposes, mounted in one place.
//
// Only /auth/* and /health are reachable without a session; requireAuth guards
// the rest, which is why no service needs to re-check ownership by hand.
import { Router } from 'express';
import { requireAuth } from './middleware/authenticate.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { mealsRouter } from './modules/meals/meals.routes.js';
import { foodsRouter } from './modules/foods/foods.routes.js';
import { waterRouter } from './modules/water/water.routes.js';
import { weightRouter } from './modules/weight/weight.routes.js';
import { goalsRouter } from './modules/goals/goals.routes.js';
import { programsRouter, workoutsRouter } from './modules/workouts/workouts.routes.js';
import { summaryRouter, tdeeRouter } from './modules/summary/summary.routes.js';
import { healthCheck } from './db/pool.js';
import { asyncHandler } from './utils/async-handler.js';

export const apiRouter = Router();

apiRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const database = await healthCheck().catch(() => false);
    res.status(database ? 200 : 503).json({
      status: database ? 'ok' : 'degraded',
      database: database ? 'connected' : 'unreachable',
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  })
);

apiRouter.use('/auth', authRouter);

// ─── Authenticated ──────────────────────────────────────────────────────────
apiRouter.use(requireAuth);

apiRouter.use('/users', usersRouter);
apiRouter.use('/meals', mealsRouter);
apiRouter.use('/foods', foodsRouter);
apiRouter.use('/water', waterRouter);
apiRouter.use('/weight', weightRouter);
apiRouter.use('/goals', goalsRouter);
apiRouter.use('/workouts', workoutsRouter);
apiRouter.use('/programs', programsRouter);
apiRouter.use('/summary', summaryRouter);
apiRouter.use('/tdee', tdeeRouter);
