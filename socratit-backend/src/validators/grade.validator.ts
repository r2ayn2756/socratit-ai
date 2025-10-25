// ============================================================================
// GRADE VALIDATORS
// Joi validation schemas for grade-related requests
// ============================================================================

import Joi from 'joi';

// ============================================================================
// GRADE CATEGORY VALIDATORS
// ============================================================================

export const gradeCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Category name is required',
    'string.max': 'Category name must not exceed 50 characters',
  }),
  weight: Joi.number().min(0).max(100).required().messages({
    'number.base': 'Weight must be a number',
    'number.min': 'Weight must be at least 0',
    'number.max': 'Weight cannot exceed 100',
  }),
  dropLowest: Joi.number().integer().min(0).max(10).default(0).messages({
    'number.base': 'Drop lowest must be a number',
    'number.min': 'Drop lowest must be at least 0',
    'number.max': 'Drop lowest cannot exceed 10',
  }),
  latePenaltyPerDay: Joi.number().min(0).max(100).optional().allow(null),
  maxLatePenalty: Joi.number().min(0).max(100).optional().allow(null),
  allowExtraCredit: Joi.boolean().default(false),
});

export const saveGradeCategoriesValidator = Joi.object({
  classId: Joi.string().uuid().required().messages({
    'string.empty': 'Class ID is required',
    'string.guid': 'Class ID must be a valid UUID',
  }),
  categories: Joi.array().items(gradeCategorySchema).min(1).max(10).required().messages({
    'array.min': 'At least one category is required',
    'array.max': 'Cannot have more than 10 categories',
  }),
}).custom((value, helpers) => {
  // Validate that total weights add up to 100
  const totalWeight = value.categories.reduce(
    (sum: number, cat: any) => sum + cat.weight,
    0
  );

  if (Math.abs(totalWeight - 100) > 0.01) {
    // Allow small floating point errors
    return helpers.error('any.invalid', {
      message: `Total category weights must equal 100% (current total: ${totalWeight}%)`,
    });
  }

  return value;
});

// ============================================================================
// APPLY CURVE VALIDATOR
// ============================================================================

export const applyCurveValidator = Joi.object({
  curveAmount: Joi.number().min(-50).max(50).required().messages({
    'number.base': 'Curve amount must be a number',
    'number.min': 'Curve amount cannot be less than -50%',
    'number.max': 'Curve amount cannot exceed 50%',
    'any.required': 'Curve amount is required',
  }),
});

// ============================================================================
// QUERY VALIDATORS
// ============================================================================

export const getGradeHistoryQueryValidator = Joi.object({
  classId: Joi.string().uuid().optional(),
  gradeType: Joi.string()
    .valid('assignment', 'category', 'overall')
    .optional()
    .messages({
      'any.only': 'Grade type must be one of: assignment, category, overall',
    }),
});
