import { error } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  // Always log the full error server-side so it appears in Render/production logs
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  if (err.stack) console.error(err.stack);

  const statusCode = err.statusCode || 500;
  // Only expose the real message in development; use a generic message in production
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return error(res, message, statusCode, err.errors || []);
};
