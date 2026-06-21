import { ZodError } from 'zod';

export function notFound(req, res, next) {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode === 200 ? err.statusCode || 500 : res.statusCode;

  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: err.errors.map((item) => ({
        field: item.path.join('.'),
        message: item.message
      }))
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', fields: err.keyValue });
  }

  return res.status(statusCode).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}
