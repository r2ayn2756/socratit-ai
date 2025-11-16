# Assignment System Enhancements - API Implementation Summary

## Overview
This document outlines the backend API implementation for the new assignment system features including essay assignments, interactive math, rubrics, lockdown monitoring, and concept mapping.

## 1. Updated Assignment Validators

### File: `socratit-backend/src/validators/assignment.validator.ts`

**Changes Required:**
Add the following fields to `createAssignmentValidator` and `updateAssignmentValidator`:

```typescript
// Essay-specific configuration
essayConfig: Joi.object({
  minWords: Joi.number().integer().min(1).max(10000).allow(null),
  maxWords: Joi.number().integer().min(1).max(10000).allow(null),
  rubricId: Joi.string().uuid().allow(null),
  allowAttachments: Joi.boolean().default(false),
  citationRequired: Joi.boolean().default(false),
  citationStyle: Joi.string().valid('APA', 'MLA', 'Chicago', 'Harvard').allow(null),
}).allow(null),

// Interactive Math settings
enableGraphingCalculator: Joi.boolean().default(false),
enableBasicCalculator: Joi.boolean().default(false),
enableStepByStepHints: Joi.boolean().default(false),
```

Also update `updateQuestionValidator` to include:
```typescript
curriculumSubUnitId: Joi.string().uuid().allow(null),
```

## 2. Rubric Validator

### File: `socratit-backend/src/validators/rubric.validator.ts` (NEW)

```typescript
// ============================================================================
// RUBRIC VALIDATORS
// Joi validation schemas for rubric-related endpoints
// ============================================================================

import Joi from 'joi';

// Rubric criterion level schema
const rubricLevelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(), // e.g., "Excellent", "Good", "Fair", "Poor"
  points: Joi.number().min(0).max(100).required(),
  description: Joi.string().max(500).required(),
});

// Rubric criterion schema
const rubricCriterionSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(), // e.g., "Content Quality"
  description: Joi.string().max(1000).allow(null, ''),
  points: Joi.number().integer().min(1).max(100).required(),
  levels: Joi.array().items(rubricLevelSchema).min(2).max(10).required(),
});

export const createRubricValidator = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(null, ''),
  isTemplate: Joi.boolean().default(true),
  criteria: Joi.array().items(rubricCriterionSchema).min(1).max(20).required(),
  totalPoints: Joi.number().integer().min(1).max(1000).required(),
  subject: Joi.string().max(100).allow(null, ''),
  gradeLevel: Joi.string().max(50).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).max(20).default([]),
});

export const updateRubricValidator = Joi.object({
  name: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(null, ''),
  isTemplate: Joi.boolean(),
  criteria: Joi.array().items(rubricCriterionSchema).min(1).max(20),
  totalPoints: Joi.number().integer().min(1).max(1000),
  subject: Joi.string().max(100).allow(null, ''),
  gradeLevel: Joi.string().max(50).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).max(20),
}).min(1);

export const getRubricsQueryValidator = Joi.object({
  teacherId: Joi.string().uuid(),
  isTemplate: Joi.boolean(),
  subject: Joi.string().max(100),
  gradeLevel: Joi.string().max(50),
  tags: Joi.array().items(Joi.string().max(50)),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});
```

