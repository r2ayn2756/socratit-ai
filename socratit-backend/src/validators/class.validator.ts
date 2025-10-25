// ============================================================================
// CLASS VALIDATORS
// Joi validation schemas for class management endpoints
// ============================================================================

import Joi from 'joi';

/**
 * Validation schema for creating a class
 */
export const createClassSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).trim().messages({
    'string.empty': 'Class name is required',
    'string.min': 'Class name must be at least 1 character',
    'string.max': 'Class name must not exceed 100 characters',
    'any.required': 'Class name is required',
  }),

  subject: Joi.string().optional().max(50).trim().messages({
    'string.max': 'Subject must not exceed 50 characters',
  }),

  gradeLevel: Joi.string().optional().max(50).trim().messages({
    'string.max': 'Grade level must not exceed 50 characters',
  }),

  academicYear: Joi.string().required().pattern(/^\d{4}-\d{4}$/).messages({
    'string.empty': 'Academic year is required',
    'string.pattern.base': 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)',
    'any.required': 'Academic year is required',
  }),

  period: Joi.string().optional().max(50).trim().messages({
    'string.max': 'Period must not exceed 50 characters',
  }),

  room: Joi.string().optional().max(50).trim().messages({
    'string.max': 'Room must not exceed 50 characters',
  }),

  scheduleTime: Joi.string().optional().max(100).trim().messages({
    'string.max': 'Schedule time must not exceed 100 characters',
  }),

  color: Joi.string().optional().valid('blue', 'purple', 'orange').messages({
    'any.only': 'Color must be one of: blue, purple, orange',
  }),

  codeExpiresAt: Joi.date().optional().iso().min('now').messages({
    'date.min': 'Code expiration date must be in the future',
    'date.base': 'Invalid date format for code expiration',
  }),
});

/**
 * Validation schema for updating a class
 */
export const updateClassSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100).trim().messages({
    'string.min': 'Class name must be at least 1 character',
    'string.max': 'Class name must not exceed 100 characters',
  }),

  subject: Joi.string().optional().max(50).trim().allow('').messages({
    'string.max': 'Subject must not exceed 50 characters',
  }),

  gradeLevel: Joi.string().optional().max(50).trim().allow('').messages({
    'string.max': 'Grade level must not exceed 50 characters',
  }),

  academicYear: Joi.string().optional().pattern(/^\d{4}-\d{4}$/).messages({
    'string.pattern.base': 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)',
  }),

  period: Joi.string().optional().max(50).trim().allow('').messages({
    'string.max': 'Period must not exceed 50 characters',
  }),

  room: Joi.string().optional().max(50).trim().allow('').messages({
    'string.max': 'Room must not exceed 50 characters',
  }),

  scheduleTime: Joi.string().optional().max(100).trim().allow('').messages({
    'string.max': 'Schedule time must not exceed 100 characters',
  }),

  color: Joi.string().optional().valid('blue', 'purple', 'orange').messages({
    'any.only': 'Color must be one of: blue, purple, orange',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),

  codeExpiresAt: Joi.date().optional().iso().allow(null).messages({
    'date.base': 'Invalid date format for code expiration',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation schema for class code format
 */
export const classCodeSchema = Joi.object({
  classCode: Joi.string().required().pattern(/^[A-Z]{3}-[0-9]{4}$/).messages({
    'string.empty': 'Class code is required',
    'string.pattern.base': 'Class code must be in format XXX-1234 (3 letters, hyphen, 4 numbers)',
    'any.required': 'Class code is required',
  }),
});

/**
 * Validation schema for adding multiple teachers to a class
 */
export const addTeachersSchema = Joi.object({
  teacherEmails: Joi.array().items(
    Joi.string().email().messages({
      'string.email': 'Each teacher email must be a valid email address',
    })
  ).min(1).required().messages({
    'array.min': 'At least one teacher email is required',
    'any.required': 'Teacher emails are required',
  }),
});
