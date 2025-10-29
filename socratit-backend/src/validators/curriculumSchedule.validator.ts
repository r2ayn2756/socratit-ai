// ============================================================================
// CURRICULUM SCHEDULE VALIDATION SCHEMAS
// Joi validation schemas for curriculum scheduling requests
// ============================================================================

import Joi from 'joi';

// ============================================================================
// SCHEDULE VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation for creating a new curriculum schedule
 */
export const createScheduleSchema = Joi.object({
  classId: Joi.string().uuid().required()
    .messages({
      'string.uuid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),

  schoolYearStart: Joi.date().iso().required()
    .messages({
      'date.format': 'School year start must be a valid ISO date',
      'any.required': 'School year start date is required',
    }),

  schoolYearEnd: Joi.date().iso().greater(Joi.ref('schoolYearStart')).required()
    .messages({
      'date.format': 'School year end must be a valid ISO date',
      'date.greater': 'School year end must be after school year start',
      'any.required': 'School year end date is required',
    }),

  meetingPattern: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Meeting pattern must not exceed 100 characters',
    }),

  title: Joi.string().min(3).max(200).required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required',
    }),

  description: Joi.string().max(2000).optional()
    .messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),

  curriculumMaterialId: Joi.string().uuid().optional()
    .messages({
      'string.uuid': 'Curriculum material ID must be a valid UUID',
    }),
});

/**
 * Validation for generating schedule from AI
 */
export const generateScheduleFromAISchema = Joi.object({
  curriculumMaterialId: Joi.string().uuid().required()
    .messages({
      'string.uuid': 'Curriculum material ID must be a valid UUID',
      'any.required': 'Curriculum material ID is required',
    }),

  preferences: Joi.object({
    targetUnits: Joi.number().integer().min(6).max(20).optional()
      .messages({
        'number.min': 'Target units must be at least 6',
        'number.max': 'Target units must not exceed 20',
      }),

    pacingPreference: Joi.string().valid('standard', 'accelerated', 'extended').optional()
      .messages({
        'any.only': 'Pacing preference must be one of: standard, accelerated, extended',
      }),

    includeReviewUnits: Joi.boolean().optional(),

    breakDates: Joi.array().items(Joi.date().iso()).optional()
      .messages({
        'date.format': 'Break dates must be valid ISO dates',
      }),
  }).optional(),
});

/**
 * Validation for updating a schedule
 */
export const updateScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 200 characters',
    }),

  description: Joi.string().max(2000).allow('').optional()
    .messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),

  schoolYearStart: Joi.date().iso().optional()
    .messages({
      'date.format': 'School year start must be a valid ISO date',
    }),

  schoolYearEnd: Joi.date().iso().optional()
    .messages({
      'date.format': 'School year end must be a valid ISO date',
    }),

  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional()
    .messages({
      'any.only': 'Status must be one of: DRAFT, PUBLISHED, ARCHIVED',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation for refining schedule with AI
 */
export const refineScheduleWithAISchema = Joi.object({
  message: Joi.string().min(10).max(1000).required()
    .messages({
      'string.min': 'Message must be at least 10 characters',
      'string.max': 'Message must not exceed 1000 characters',
      'any.required': 'Message is required',
    }),

  conversationHistory: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required(),
    })
  ).max(20).optional()
    .messages({
      'array.max': 'Conversation history must not exceed 20 messages',
    }),
});

// ============================================================================
// UNIT VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation for unit topic structure
 */
const unitTopicSchema = Joi.object({
  name: Joi.string().min(3).max(200).required()
    .messages({
      'string.min': 'Topic name must be at least 3 characters',
      'string.max': 'Topic name must not exceed 200 characters',
      'any.required': 'Topic name is required',
    }),

  subtopics: Joi.array().items(Joi.string().max(200)).min(1).required()
    .messages({
      'array.min': 'At least one subtopic is required',
      'any.required': 'Subtopics are required',
    }),

  concepts: Joi.array().items(Joi.string().max(200)).min(1).required()
    .messages({
      'array.min': 'At least one concept is required',
      'any.required': 'Concepts are required',
    }),

  learningObjectives: Joi.array().items(Joi.string().max(500)).min(1).required()
    .messages({
      'array.min': 'At least one learning objective is required',
      'any.required': 'Learning objectives are required',
    }),
});

/**
 * Validation for creating a curriculum unit
 */
export const createUnitSchema = Joi.object({
  scheduleId: Joi.string().uuid().required()
    .messages({
      'string.uuid': 'Schedule ID must be a valid UUID',
      'any.required': 'Schedule ID is required',
    }),

  title: Joi.string().min(3).max(200).required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required',
    }),

  description: Joi.string().max(2000).optional()
    .messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),

  startDate: Joi.date().iso().required()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
      'any.required': 'Start date is required',
    }),

  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({
      'date.format': 'End date must be a valid ISO date',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required',
    }),

  topics: Joi.array().items(unitTopicSchema).min(1).max(10).required()
    .messages({
      'array.min': 'At least one topic is required',
      'array.max': 'Maximum 10 topics allowed per unit',
      'any.required': 'Topics are required',
    }),

  difficultyLevel: Joi.number().integer().min(1).max(5).required()
    .messages({
      'number.min': 'Difficulty level must be at least 1',
      'number.max': 'Difficulty level must not exceed 5',
      'any.required': 'Difficulty level is required',
    }),

  unitType: Joi.string().valid('CORE', 'ENRICHMENT', 'REVIEW', 'ASSESSMENT', 'PROJECT', 'OPTIONAL').optional()
    .messages({
      'any.only': 'Unit type must be one of: CORE, ENRICHMENT, REVIEW, ASSESSMENT, PROJECT, OPTIONAL',
    }),

  isOptional: Joi.boolean().optional(),
});

/**
 * Validation for updating a curriculum unit
 */
export const updateUnitSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 200 characters',
    }),

  description: Joi.string().max(2000).allow('').optional()
    .messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),

  startDate: Joi.date().iso().optional()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
    }),

  endDate: Joi.date().iso().optional()
    .messages({
      'date.format': 'End date must be a valid ISO date',
    }),

  topics: Joi.array().items(unitTopicSchema).min(1).max(10).optional()
    .messages({
      'array.min': 'At least one topic is required',
      'array.max': 'Maximum 10 topics allowed per unit',
    }),

  difficultyLevel: Joi.number().integer().min(1).max(5).optional()
    .messages({
      'number.min': 'Difficulty level must be at least 1',
      'number.max': 'Difficulty level must not exceed 5',
    }),

  unitType: Joi.string().valid('CORE', 'ENRICHMENT', 'REVIEW', 'ASSESSMENT', 'PROJECT', 'OPTIONAL').optional()
    .messages({
      'any.only': 'Unit type must be one of: CORE, ENRICHMENT, REVIEW, ASSESSMENT, PROJECT, OPTIONAL',
    }),

  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'POSTPONED').optional()
    .messages({
      'any.only': 'Status must be one of: SCHEDULED, IN_PROGRESS, COMPLETED, SKIPPED, POSTPONED',
    }),

  teacherModified: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation for reordering units
 */
export const reorderUnitsSchema = Joi.object({
  scheduleId: Joi.string().uuid().required()
    .messages({
      'string.uuid': 'Schedule ID must be a valid UUID',
      'any.required': 'Schedule ID is required',
    }),

  unitOrders: Joi.array().items(
    Joi.object({
      unitId: Joi.string().uuid().required()
        .messages({
          'string.uuid': 'Unit ID must be a valid UUID',
          'any.required': 'Unit ID is required',
        }),

      orderIndex: Joi.number().integer().min(0).required()
        .messages({
          'number.min': 'Order index must be at least 0',
          'any.required': 'Order index is required',
        }),

      startDate: Joi.date().iso().optional()
        .messages({
          'date.format': 'Start date must be a valid ISO date',
        }),

      endDate: Joi.date().iso().optional()
        .messages({
          'date.format': 'End date must be a valid ISO date',
        }),
    })
  ).min(1).required()
    .messages({
      'array.min': 'At least one unit order is required',
      'any.required': 'Unit orders are required',
    }),
});

// ============================================================================
// QUERY PARAMETER VALIDATION
// ============================================================================

/**
 * Validation for schedule query parameters
 */
export const scheduleQuerySchema = Joi.object({
  includeProgress: Joi.boolean().optional(),
  includeAssignments: Joi.boolean().optional(),
  includeUnits: Joi.boolean().optional(),
});

/**
 * Validation for unit query parameters
 */
export const unitQuerySchema = Joi.object({
  includeProgress: Joi.boolean().optional(),
  includeAssignments: Joi.boolean().optional(),
  includeStudents: Joi.boolean().optional(),
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Custom validator for date ranges (ensures reasonable school year length)
 */
export function validateSchoolYearDates(startDate: Date, endDate: Date): boolean {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // School year should be between 150-365 days
  return diffDays >= 150 && diffDays <= 365;
}

/**
 * Custom validator for unit date ranges (ensures reasonable unit length)
 */
export function validateUnitDates(startDate: Date, endDate: Date): boolean {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Unit should be between 3-90 days (0.5 weeks to 13 weeks)
  return diffDays >= 3 && diffDays <= 90;
}

/**
 * Validate that a unit's dates fall within the schedule's dates
 */
export function validateUnitWithinSchedule(
  unitStart: Date,
  unitEnd: Date,
  scheduleStart: Date,
  scheduleEnd: Date
): boolean {
  return unitStart >= scheduleStart && unitEnd <= scheduleEnd;
}
