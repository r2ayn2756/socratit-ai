// ============================================================================
// ERROR HANDLER MIDDLEWARE
// Centralized error handling for the application
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { env } from '../config/env';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  const response: ApiResponse = {
    success: false,
    message,
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development' && err.stack) {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler middleware
 * Handles routes that don't exist
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(response);
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
