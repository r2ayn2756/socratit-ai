// ============================================================================
// PROGRESS TRACKING ROUTES
// Routes for student progress, assignment progress, and learning velocity
// ============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  getStudentProgress,
  getStudentProgressAcrossClasses,
  getClassProgress,
  calculateProgress,
  getAssignmentProgress,
  getAssignmentProgressForStudent,
  getAssignmentProgressForClass,
  updateTimeSpent,
  getConceptProgress,
  getConceptProgressForClass,
  createConceptPath,
  updateConceptPath,
  deleteConceptPath,
  getConceptPathsForClass,
  getLearningVelocity,
  getClassLearningVelocity,
  getProgressTrends,
  getClassProgressTrends,
} from '../controllers/progress.controller';

const router = Router();

// Rate limiters
const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
});

const timeTrackingLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1, // Max 1 time tracking update per minute
  message: 'Time tracking updates are limited to once per minute.',
});

// ============================================================================
// STUDENT PROGRESS ROUTES
// ============================================================================

// Get overall progress for a student in a specific class
router.get(
  '/student/:studentId/class/:classId',
  requireAuth,
  standardLimiter,
  getStudentProgress
);

// Get progress across all enrolled classes
router.get(
  '/student/:studentId/classes',
  requireAuth,
  standardLimiter,
  getStudentProgressAcrossClasses
);

// Get progress for all students in a class (teachers only)
router.get(
  '/class/:classId/students',
  requireAuth,
  standardLimiter,
  getClassProgress
);

// Trigger progress calculation
router.post(
  '/calculate/:studentId/:classId',
  requireAuth,
  standardLimiter,
  calculateProgress
);

// ============================================================================
// ASSIGNMENT PROGRESS ROUTES
// ============================================================================

// Get progress for all assignments for a student
router.get(
  '/assignments/:studentId',
  requireAuth,
  standardLimiter,
  getAssignmentProgressForStudent
);

// Get progress for a specific assignment
router.get(
  '/assignment/:assignmentId/student/:studentId',
  requireAuth,
  standardLimiter,
  getAssignmentProgress
);

// Get progress for all students on a specific assignment (teachers only)
router.get(
  '/assignment/:assignmentId/students',
  requireAuth,
  standardLimiter,
  getAssignmentProgressForClass
);

// Update time spent on assignment
router.patch(
  '/assignment/:assignmentId/time',
  requireAuth,
  timeTrackingLimiter,
  updateTimeSpent
);

// ============================================================================
// CONCEPT MASTERY PROGRESS ROUTES
// ============================================================================

// Get concept mastery progression for a student
router.get(
  '/concepts/:studentId/class/:classId',
  requireAuth,
  standardLimiter,
  getConceptProgress
);

// Get all students' mastery of a specific concept in a class (teachers only)
router.get(
  '/concepts/:conceptName/students/:classId',
  requireAuth,
  standardLimiter,
  getConceptProgressForClass
);

// ============================================================================
// CONCEPT PATH MANAGEMENT (TEACHERS ONLY)
// ============================================================================

// Get concept paths for a class
router.get(
  '/concepts/paths/:classId',
  requireAuth,
  standardLimiter,
  getConceptPathsForClass
);

// Create concept path
router.post(
  '/concepts/paths',
  requireAuth,
  standardLimiter,
  createConceptPath
);

// Update concept path
router.put(
  '/concepts/paths/:pathId',
  requireAuth,
  standardLimiter,
  updateConceptPath
);

// Delete concept path
router.delete(
  '/concepts/paths/:pathId',
  requireAuth,
  standardLimiter,
  deleteConceptPath
);

// ============================================================================
// LEARNING VELOCITY ROUTES
// ============================================================================

// Get learning velocity for a student
router.get(
  '/velocity/:studentId/class/:classId',
  requireAuth,
  standardLimiter,
  getLearningVelocity
);

// Get learning velocity for all students in a class (teachers only)
router.get(
  '/velocity/class/:classId',
  requireAuth,
  standardLimiter,
  getClassLearningVelocity
);

// ============================================================================
// PROGRESS TRENDS ROUTES
// ============================================================================

// Get grade trends and performance patterns for a student
router.get(
  '/trends/:studentId/class/:classId',
  requireAuth,
  standardLimiter,
  getProgressTrends
);

// Get class-wide trends (teachers only)
router.get(
  '/trends/class/:classId',
  requireAuth,
  standardLimiter,
  getClassProgressTrends
);

export default router;
