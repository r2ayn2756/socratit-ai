// ============================================================================
// ENROLLMENT ROUTES
// API routes for enrollment management
// ============================================================================

import { Router } from 'express';
import {
  enrollWithCode,
  getStudentEnrollments,
  getEnrollmentById,
} from '../controllers/enrollment.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireEnrollmentAccess } from '../middleware/classOwnership';
import { validate } from '../middleware/validate';
import { enrollWithCodeSchema } from '../validators/enrollment.validator';
import { asyncHandler } from '../middleware/errorHandler';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiters
const enrollmentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 enrollment requests per minute
  message: 'Too many enrollment attempts. Please slow down.',
});

// ============================================================================
// STUDENT ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/enrollments
 * @desc    Enroll in a class with class code (student self-enrollment)
 * @access  Student only
 */
router.post(
  '/',
  requireAuth,
  requireRole('STUDENT'),
  enrollmentLimiter,
  validate(enrollWithCodeSchema),
  asyncHandler(enrollWithCode)
);

/**
 * @route   GET /api/v1/enrollments
 * @desc    Get all enrollments for the current student
 * @access  Student only
 */
router.get(
  '/',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(getStudentEnrollments)
);

/**
 * @route   GET /api/v1/enrollments/:enrollmentId
 * @desc    Get enrollment details
 * @access  Student (must be own enrollment) or Teacher (must teach class)
 */
router.get(
  '/:enrollmentId',
  requireAuth,
  requireEnrollmentAccess,
  asyncHandler(getEnrollmentById)
);

// Note: Teacher enrollment management routes (roster) are in class.routes.ts
// Mounted at /api/v1/classes/:classId/enrollments

export default router;
