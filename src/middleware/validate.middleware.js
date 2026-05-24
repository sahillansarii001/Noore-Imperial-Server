import { validationResult } from 'express-validator';
import { error } from '../utils/response.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return error(res, 'Validation failed', 400, formattedErrors);
  };
};
