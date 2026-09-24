// Zod-backed request validation. The parsed (and coerced) value replaces the
// raw input, so handlers always receive typed, trusted data.
import { unprocessable } from '../utils/http-error.js';

const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message
  }));

const validatePart = (part) => (schema) => (req, _res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    return next(unprocessable(`Invalid request ${part}`, formatIssues(result.error)));
  }
  // req.query is a getter on Express 5; assigning to a scratch field keeps both working.
  if (part === 'query') req.validatedQuery = result.data;
  else req[part] = result.data;
  return next();
};

export const validateBody = validatePart('body');
export const validateQuery = validatePart('query');
export const validateParams = validatePart('params');
