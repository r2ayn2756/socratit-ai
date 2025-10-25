// ============================================================================
// ENROLLMENT VALIDATORS
// Joi validation schemas for enrollment management endpoints
// ============================================================================

import Joi from 'joi';

/**
 * Validation schema for enrolling with a class code
 */
export const enrollWithCodeSchema = Joi.object({
  classCode: Joi.string().required().pattern(/^[A-Z]{3}-[0-9]{4}$/).messages({
    'string.empty': 'Class code is required',
    'string.pattern.base': 'Class code must be in format XXX-1234 (3 letters, hyphen, 4 numbers)',
    'any.required': 'Class code is required',
  }),
});

/**
 * Validation schema for manually adding students to a class
 */
export const addStudentsSchema = Joi.object({
  studentEmails: Joi.array().items(
    Joi.string().email().messages({
      'string.email': 'Each student email must be a valid email address',
    })
  ).min(1).max(50).required().messages({
    'array.min': 'At least one student email is required',
    'array.max': 'Cannot add more than 50 students at once',
    'any.required': 'Student emails are required',
  }),
});

/**
 * Validation schema for processing an enrollment (approve/reject/remove)
 */
export const processEnrollmentSchema = Joi.object({
  status: Joi.string().required().valid('APPROVED', 'REJECTED', 'REMOVED').messages({
    'string.empty': 'Status is required',
    'any.only': 'Status must be one of: APPROVED, REJECTED, REMOVED',
    'any.required': 'Status is required',
  }),

  rejectionReason: Joi.when('status', {
    is: 'REJECTED',
    then: Joi.string().optional().max(500).trim().messages({
      'string.max': 'Rejection reason must not exceed 500 characters',
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Rejection reason can only be provided when status is REJECTED',
    }),
  }),
});
