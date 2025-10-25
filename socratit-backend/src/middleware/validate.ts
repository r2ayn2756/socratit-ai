// ============================================================================
// VALIDATION MIDDLEWARE
// Validates request body against Joi schemas
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse, ValidationError } from '../types';

/**
 * Middleware to validate request body or query against a Joi schema
 * @param schema - Joi validation schema
 * @param source - Source of data to validate ('body' or 'query')
 */
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors: ValidationError[] = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors,
      };

      res.status(400).json(response);
      return;
    }

    // Replace request source with validated and sanitized value
    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }
    next();
  };
};
