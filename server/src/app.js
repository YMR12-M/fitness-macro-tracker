// Express application wiring. Kept separate from index.js so tests can import
// the app and drive it without binding a port.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { corsOrigins, isProduction, isTest } from './config/env.js';
import { attachUser } from './middleware/authenticate.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/not-found.js';
import { apiRouter } from './routes.js';

export function createApp() {
  const app = express();

  // Behind a proxy (Railway, Render, Fly, nginx) so req.ip and secure cookies
  // reflect the real client rather than the load balancer.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser callers send no Origin header.
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        // Tagged so the error handler answers 403 instead of a 500 with a
        // stack trace — a blocked origin is an expected outcome, not a fault.
        const error = new Error(`Origin ${origin} is not allowed`);
        error.name = 'CorsError';
        return callback(error);
      },
      credentials: true // required for the auth cookies
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  if (!isTest) {
    app.use(morgan(isProduction ? 'combined' : 'dev'));
  }

  // Broad ceiling; credential and search endpoints add their own tighter ones.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: () => isTest
    })
  );

  app.use(attachUser);
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
