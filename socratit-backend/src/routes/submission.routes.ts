// ============================================================================
// SUBMISSION ROUTES
// Routes for student submissions, answers, and grading
// ============================================================================

import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  requireSubmissionAccess,
} from '../middleware/assignmentOwnership';
import {
  startAssignment,
  submitAnswer,
  submitAssignment,
  getSubmissions,
  getSubmission,
  overrideGrade,
} from '../controllers/submission.controller';
import {
  startAssignmentValidator,
  submitAnswerValidator,
  submitAssignmentValidator,
  getSubmissionsQueryValidator,
  overrideGradeValidator,
} from '../validators/assignment.validator';

const router = Router();

// Rate limiters
const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
});

const submissionLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for active work on assignments
  message: 'Too many submission requests. Please slow down.',
});

// ============================================================================
// SUBMISSION ROUTES
// ============================================================================

// Start assignment (creates submission record)
router.post(
  '/start',
  requireAuth,
  standardLimiter,
  validateRequest(startAssignmentValidator, 'body'),
  startAssignment
);

// Get all submissions (filtered by role)
router.get(
  '/',
  requireAuth,
  standardLimiter,
  validateRequest(getSubmissionsQueryValidator, 'query'),
  getSubmissions
);

// Get single submission
router.get(
  '/:submissionId',
  requireAuth,
  standardLimiter,
  requireSubmissionAccess,
  getSubmission
);

// Submit answer to a question (with instant grading)
router.post(
  '/:submissionId/answers',
  requireAuth,
  submissionLimiter,
  requireSubmissionAccess,
  validateRequest(submitAnswerValidator, 'body'),
  submitAnswer
);

// Submit assignment for final grading
router.post(
  '/:submissionId/submit',
  requireAuth,
  standardLimiter,
  requireSubmissionAccess,
  validateRequest(submitAssignmentValidator, 'body'),
  submitAssignment
);

// Override grade (teacher only)
router.patch(
  '/:submissionId/answers/:answerId/grade',
  requireAuth,
  standardLimiter,
  requireSubmissionAccess,
  validateRequest(overrideGradeValidator, 'body'),
  overrideGrade
);

export default router;
