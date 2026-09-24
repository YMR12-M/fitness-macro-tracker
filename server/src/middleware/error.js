// Terminal error handler. Known errors keep their status and message;
// everything else is logged in full and reported as an opaque 500.
import { HttpError } from '../utils/http-error.js';
import { isProduction } from '../config/env.js';

// MySQL driver errors that map cleanly onto a client-facing status. Without
// these a duplicate email or a bad date reads as "Something went wrong".
const DB_ERROR_STATUS = {
  ER_DUP_ENTRY: [409, 'That record already exists'],
  ER_NO_REFERENCED_ROW_2: [422, 'Referenced record does not exist'],
  ER_ROW_IS_REFERENCED_2: [409, 'Record is still referenced by other data'],
  ER_DATA_TOO_LONG: [422, 'A value is too long for its field'],
  ER_TRUNCATED_WRONG_VALUE: [422, 'A value is not in a format the database accepts'],
  ER_WRONG_VALUE: [422, 'A value is not in a format the database accepts'],
  ER_BAD_NULL_ERROR: [422, 'A required value was missing'],
  ER_LOCK_WAIT_TIMEOUT: [503, 'The database is busy, please retry'],
  ER_CON_COUNT_ERROR: [503, 'Database connection limit reached'],
  ECONNREFUSED: [503, 'Database unavailable'],
  ETIMEDOUT: [503, 'Database timed out'],
  PROTOCOL_CONNECTION_LOST: [503, 'Database connection lost']
};

// body-parser tags its failures with `type`; each deserves its own status
// rather than collapsing into a 500 the client cannot act on.
const BODY_ERROR_STATUS = {
  'entity.parse.failed': [400, 'Request body is not valid JSON'],
  'entity.too.large': [413, 'Request body is too large'],
  'entity.verify.failed': [400, 'Request body failed verification'],
  'request.aborted': [400, 'Request was aborted'],
  'charset.unsupported': [415, 'Unsupported character set'],
  'encoding.unsupported': [415, 'Unsupported content encoding']
};

export function errorHandler(error, req, res, next) {
  // Once a response has started streaming, the only correct move is to hand
  // the socket to Express so it can destroy it — writing a second set of
  // headers throws and masks the original error.
  if (res.headersSent) return next(error);

  let status = 500;
  let message = 'Something went wrong';
  let details;

  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
    details = error.details;
  } else if (DB_ERROR_STATUS[error.code]) {
    [status, message] = DB_ERROR_STATUS[error.code];
  } else if (BODY_ERROR_STATUS[error.type]) {
    [status, message] = BODY_ERROR_STATUS[error.type];
  } else if (error.name === 'CorsError') {
    status = 403;
    message = error.message;
  }

  // Only genuine faults are worth a stack trace in the log. Blocked origins and
  // oversized bodies are routine and would otherwise flood it.
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {}),
      ...(isProduction || status >= 500 ? {} : { stack: error.stack })
    }
  });
}
