// ============================================================================
// CLASS ROUTES
// API routes for class management
// ============================================================================

import { Router } from 'express';
import {
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  regenerateClassCode,
} from '../controllers/class.controller';
import {
  getClassEnrollments,
  addStudentsToClass,
  processEnrollment,
  removeStudentFromClass,
} from '../controllers/enrollment.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireClassTeacher } from '../middleware/classOwnership';
import { requireClassAccess } from '../middleware/classAccess';
import { validate } from '../middleware/validate';
import { createClassSchema, updateClassSchema } from '../validators/class.validator';
import { addStudentsSchema, processEnrollmentSchema } from '../validators/enrollment.validator';
import { asyncHandler } from '../middleware/errorHandler';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiters
// Development: generous limits for testing
// Production: tighter limits to prevent abuse
const classCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // 100 dev, 20 prod
  message: 'Too many class creation attempts. Please try again later.',
});

const classCodeLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 50 : 10, // 50 dev, 10 prod
  message: 'Too many class code requests. Please slow down.',
});

// ============================================================================
// TEACHER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/classes
 * @desc    Create a new class
 * @access  Teacher only
 */
router.post(
  '/',
  requireAuth,
  requireRole('TEACHER'),
  classCreationLimiter,
  validate(createClassSchema),
  asyncHandler(createClass)
);

/**
 * @route   GET /api/v1/classes
 * @desc    Get all classes for the current teacher
 * @access  Teacher only
 */
router.get(
  '/',
  requireAuth,
  requireRole('TEACHER'),
  asyncHandler(getTeacherClasses)
);

/**
 * @route   GET /api/v1/classes/:classId
 * @desc    Get class details
 * @access  Teacher (must teach class) or Student (must be enrolled)
 */
router.get(
  '/:classId',
  requireAuth,
  requireClassAccess,
  asyncHandler(getClassById)
);

/**
 * @route   PATCH /api/v1/classes/:classId
 * @desc    Update class details
 * @access  Teacher (must teach class)
 */
router.patch(
  '/:classId',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  validate(updateClassSchema),
  asyncHandler(updateClass)
);

/**
 * @route   DELETE /api/v1/classes/:classId
 * @desc    Soft delete a class
 * @access  Teacher (must teach class)
 */
router.delete(
  '/:classId',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  asyncHandler(deleteClass)
);

/**
 * @route   POST /api/v1/classes/:classId/regenerate-code
 * @desc    Regenerate class code
 * @access  Teacher (must teach class)
 */
router.post(
  '/:classId/regenerate-code',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  classCodeLimiter,
  asyncHandler(regenerateClassCode)
);

// ============================================================================
// ENROLLMENT MANAGEMENT ROUTES (Teacher only)
// ============================================================================

/**
 * @route   GET /api/v1/classes/:classId/enrollments
 * @desc    Get all enrollments for a class (roster)
 * @access  Teacher (must teach class)
 */
router.get(
  '/:classId/enrollments',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  asyncHandler(getClassEnrollments)
);

/**
 * @route   POST /api/v1/classes/:classId/enrollments
 * @desc    Manually add students to class (auto-approved)
 * @access  Teacher (must teach class)
 */
router.post(
  '/:classId/enrollments',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  validate(addStudentsSchema),
  asyncHandler(addStudentsToClass)
);

/**
 * @route   PATCH /api/v1/classes/:classId/enrollments/:enrollmentId
 * @desc    Approve, reject, or remove a student enrollment
 * @access  Teacher (must teach class)
 */
router.patch(
  '/:classId/enrollments/:enrollmentId',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  validate(processEnrollmentSchema),
  asyncHandler(processEnrollment)
);

/**
 * @route   DELETE /api/v1/classes/:classId/enrollments/:enrollmentId
 * @desc    Remove a student from class (soft delete)
 * @access  Teacher (must teach class)
 */
router.delete(
  '/:classId/enrollments/:enrollmentId',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  asyncHandler(removeStudentFromClass)
);

export default router;
