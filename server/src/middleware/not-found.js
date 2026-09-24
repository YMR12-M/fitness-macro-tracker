import { notFound } from '../utils/http-error.js';

export function notFoundHandler(req, _res, next) {
  next(notFound(`No route for ${req.method} ${req.originalUrl}`));
}
