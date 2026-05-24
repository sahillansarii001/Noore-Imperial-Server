import { error } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return error(res, message, statusCode, err.errors || []);
};
