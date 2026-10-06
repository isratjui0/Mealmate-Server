import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const shape = schema.shape || schema;
    const toValidate = {};
    if (shape.body || schema.body) toValidate.body = req.body;
    if (shape.query || schema.query) toValidate.query = req.query;
    if (shape.params || schema.params) toValidate.params = req.params;

    const parsed = schema.parse(toValidate);

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) {
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    if (parsed.params !== undefined) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.issues) {
      const formattedErrors = error.issues.map((err) => ({
        field: (err.path.length > 1 ? err.path.slice(1).join('.') : err.path.join('.')) || 'general',
        message: err.message
      }));
      return next(new AppError('Validation failed', 400, formattedErrors));
    }
    next(error);
  }
};
