// ============================================================================
// CURRICULUM VALIDATORS
// Request validation schemas for curriculum endpoints
// ============================================================================

import Joi from 'joi';

// ============================================================================
// UPLOAD CURRICULUM VALIDATOR
// ============================================================================

export const uploadCurriculumSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required',
  }),

  description: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'Description must not exceed 2000 characters',
  }),
});

// ============================================================================
// UPDATE CURRICULUM VALIDATOR
// ============================================================================

export const updateCurriculumSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters',
  }),

  description: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'Description must not exceed 2000 characters',
  }),

  aiSummary: Joi.string().max(5000).optional().allow('').messages({
    'string.max': 'AI summary must not exceed 5000 characters',
  }),

  aiOutline: Joi.object().optional().messages({
    'object.base': 'AI outline must be a valid JSON object',
  }),

  isArchived: Joi.boolean().optional(),
});

// ============================================================================
// GENERATE ASSIGNMENT FROM CURRICULUM VALIDATOR
// ============================================================================

export const generateAssignmentSchema = Joi.object({
  // Assignment metadata
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required',
  }),

  description: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'Description must not exceed 2000 characters',
  }),

  classId: Joi.string().uuid().required().messages({
    'string.guid': 'Class ID must be a valid UUID',
    'any.required': 'Class ID is required',
  }),

  // Generation options
  numQuestions: Joi.number().integer().min(1).max(50).default(10).messages({
    'number.min': 'Number of questions must be at least 1',
    'number.max': 'Number of questions must not exceed 50',
  }),

  difficulty: Joi.string().valid('easy', 'medium', 'hard', 'mixed').default('mixed').messages({
    'any.only': 'Difficulty must be: easy, medium, hard, or mixed',
  }),

  questionTypes: Joi.array()
    .items(Joi.string().valid('multiple_choice', 'free_response'))
    .min(1)
    .default(['multiple_choice'])
    .messages({
      'array.min': 'At least one question type is required',
      'any.only': 'Question types must be: multiple_choice or free_response',
    }),

  // Assignment settings (optional)
  type: Joi.string().valid('PRACTICE', 'TEST').default('PRACTICE').messages({
    'any.only': 'Type must be: PRACTICE or TEST',
  }),

  totalPoints: Joi.number().integer().min(1).max(1000).default(100).messages({
    'number.min': 'Total points must be at least 1',
    'number.max': 'Total points must not exceed 1000',
  }),

  dueDate: Joi.date().iso().optional().messages({
    'date.format': 'Due date must be in ISO 8601 format',
  }),

  timeLimit: Joi.number().integer().min(1).max(480).optional().messages({
    'number.min': 'Time limit must be at least 1 minute',
    'number.max': 'Time limit must not exceed 480 minutes (8 hours)',
  }),
});

// ============================================================================
// LIST CURRICULUM VALIDATOR (Query Params)
// ============================================================================

export const listCurriculumSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),

  fileType: Joi.string().valid('pdf', 'docx', 'doc', 'txt', 'image').optional().messages({
    'any.only': 'File type must be: pdf, docx, doc, txt, or image',
  }),

  processingStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed').optional().messages({
    'any.only': 'Processing status must be: pending, processing, completed, or failed',
  }),

  isArchived: Joi.boolean().optional(),

  sortBy: Joi.string().valid('createdAt', 'lastUsedAt', 'usageCount', 'title').default('createdAt').messages({
    'any.only': 'Sort by must be: createdAt, lastUsedAt, usageCount, or title',
  }),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Sort order must be: asc or desc',
  }),
});
