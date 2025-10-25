// ============================================================================
// VALIDATE REQUEST MIDDLEWARE
// Joi-based request validation middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export function validateRequest(
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace request property with validated value
    // For query params, we can't directly assign to req.query (it's a getter)
    // So we use Object.defineProperty to override it
    if (property === 'query' || property === 'params') {
      Object.defineProperty(req, property, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      req[property] = value;
    }

    next();
  };
}
