import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error details for diagnostics
  if (err.statusCode && err.statusCode < 500) {
    logger.warn({ err: err.message, path: req.originalUrl, method: req.method }, 'Client Operational Error');
  } else {
    logger.error(err, 'Unhandled Server Error');
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid format for resource identifier: ${err.value}`;
    error = new AppError(message, 400, [{ field: err.path, message }]);
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    const fieldName = fields[0] || 'field';
    const message = `A record with this ${fieldName} already exists`;
    error = new AppError(message, 409, [{ field: fieldName, message }]);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));
    error = new AppError('Database validation error', 400, errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired', 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';

  const response = {
    success: false,
    message
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (env.NODE_ENV === 'development' && !error.isOperational) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
};
