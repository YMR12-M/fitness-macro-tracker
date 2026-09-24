// Errors that carry an HTTP status. Anything else reaching the error handler
// is treated as a bug and reported as a 500 without leaking internals.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    if (details) this.details = details;
  }
}

export const badRequest = (message = 'Bad request', details) => new HttpError(400, message, details);
export const unauthorized = (message = 'Authentication required') => new HttpError(401, message);
export const forbidden = (message = 'You do not have access to this resource') => new HttpError(403, message);
export const notFound = (message = 'Resource not found') => new HttpError(404, message);
export const conflict = (message = 'Resource already exists') => new HttpError(409, message);
export const unprocessable = (message = 'Validation failed', details) => new HttpError(422, message, details);
export const tooManyRequests = (message = 'Too many requests') => new HttpError(429, message);
