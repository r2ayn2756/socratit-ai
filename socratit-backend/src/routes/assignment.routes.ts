// ============================================================================
// ASSIGNMENT ROUTES
// Routes for assignment CRUD, AI generation, submissions, and grading
// ============================================================================

import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  requireAssignmentOwner,
  requireAssignmentAccess,
  requireClassTeacherForAssignment,
} from '../middleware/assignmentOwnership';
import {
  createAssignment,
  generateQuiz,
  generateAssignmentFromLesson,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
} from '../controllers/assignment.controller';
import {
  createAssignmentValidator,
  updateAssignmentValidator,
  publishAssignmentValidator,
  generateQuizValidator,
  getAssignmentsQueryValidator,
} from '../validators/assignment.validator';

const router = Router();

// Rate limiters
const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
});

const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit AI generation requests
  message: 'Too many AI generation requests. Please try again later.',
});

// ============================================================================
// ASSIGNMENT CRUD ROUTES
// ============================================================================

// Create new assignment
router.post(
  '/',
  requireAuth,
  standardLimiter,
  requireClassTeacherForAssignment,
  validateRequest(createAssignmentValidator, 'body'),
  createAssignment
);

// Generate quiz with AI
router.post(
  '/generate',
  requireAuth,
  aiLimiter,
  requireClassTeacherForAssignment,
  validateRequest(generateQuizValidator, 'body'),
  generateQuiz
);

// Generate assignment from lesson transcript
router.post(
  '/generate-from-lesson',
  requireAuth,
  aiLimiter,
  generateAssignmentFromLesson
);

// Get all assignments (filtered by role)
router.get(
  '/',
  requireAuth,
  standardLimiter,
  validateRequest(getAssignmentsQueryValidator, 'query'),
  getAssignments
);

// Get single assignment by ID
router.get(
  '/:assignmentId',
  requireAuth,
  standardLimiter,
  requireAssignmentAccess,
  getAssignment
);

// Update assignment (teacher only)
router.patch(
  '/:assignmentId',
  requireAuth,
  standardLimiter,
  requireAssignmentOwner,
  validateRequest(updateAssignmentValidator, 'body'),
  updateAssignment
);

// Delete assignment (soft delete, teacher only)
router.delete(
  '/:assignmentId',
  requireAuth,
  standardLimiter,
  requireAssignmentOwner,
  deleteAssignment
);

// Publish assignment (teacher only)
router.post(
  '/:assignmentId/publish',
  requireAuth,
  standardLimiter,
  requireAssignmentOwner,
  validateRequest(publishAssignmentValidator, 'body'),
  publishAssignment
);

export default router;
