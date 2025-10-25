// ============================================================================
// GRADE ROUTES
// Routes for grade management and calculations
// ============================================================================

import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  getStudentClassGrades,
  getClassGrades,
  getStudentAllGrades,
  saveGradeCategories,
  getGradeCategories,
  getClassGradeDistribution,
  getStudentGradeHistory,
  applyCurve,
} from '../controllers/grade.controller';
import {
  saveGradeCategoriesValidator,
  applyCurveValidator,
  getGradeHistoryQueryValidator,
} from '../validators/grade.validator';

const router = Router();

// Rate limiters
const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
});

// ============================================================================
// GRADE RETRIEVAL ROUTES
// ============================================================================

// Get student's grades for a specific class
router.get(
  '/student/:studentId/class/:classId',
  requireAuth,
  standardLimiter,
  getStudentClassGrades
);

// Get all students' grades in a class (teacher only)
router.get(
  '/class/:classId',
  requireAuth,
  standardLimiter,
  getClassGrades
);

// Get student's grades across all classes
router.get(
  '/student/:studentId',
  requireAuth,
  standardLimiter,
  getStudentAllGrades
);

// Get student's grade history
router.get(
  '/student/:studentId/history',
  requireAuth,
  standardLimiter,
  validateRequest(getGradeHistoryQueryValidator, 'query'),
  getStudentGradeHistory
);

// ============================================================================
// GRADE CATEGORY ROUTES
// ============================================================================

// Create/update grade categories for a class (teacher only)
router.post(
  '/categories',
  requireAuth,
  standardLimiter,
  validateRequest(saveGradeCategoriesValidator, 'body'),
  saveGradeCategories
);

// Get grade categories for a class
router.get(
  '/categories/:classId',
  requireAuth,
  standardLimiter,
  getGradeCategories
);

// ============================================================================
// GRADE ANALYTICS ROUTES
// ============================================================================

// Get grade distribution for a class (teacher only)
router.get(
  '/class/:classId/distribution',
  requireAuth,
  standardLimiter,
  getClassGradeDistribution
);

// ============================================================================
// GRADE ADJUSTMENT ROUTES
// ============================================================================

// Apply curve to class grades (teacher only)
router.post(
  '/class/:classId/curve',
  requireAuth,
  standardLimiter,
  validateRequest(applyCurveValidator, 'body'),
  applyCurve
);

export default router;
