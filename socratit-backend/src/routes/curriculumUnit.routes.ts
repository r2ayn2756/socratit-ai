// ============================================================================
// CURRICULUM UNIT ROUTES
// Routes for curriculum unit management and student progress tracking
// ============================================================================

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  createUnitHandler,
  getUnitHandler,
  getScheduleUnitsHandler,
  updateUnitHandler,
  deleteUnitHandler,
  reorderUnitsHandler,
  getUnitProgressHandler,
  getSuggestedAssignmentsHandler,
  getMyProgressHandler,
  getMyUnitProgressHandler,
  calculateUnitProgressHandler,
  recordTimeSpentHandler,
  recordParticipationHandler,
  getMyStrengthsHandler,
  getMyStrugglesHandler,
  getMyReviewRecommendationsHandler,
} from '../controllers/curriculumUnit.controller';

const router = Router();

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Standard operations (CRUD)
const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
});

// AI operations (suggested assignments)
const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many AI requests. Please try again in a few minutes.',
});

// Progress tracking (more lenient for student activity)
const progressLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Allow frequent progress updates
  message: 'Too many progress updates. Please try again shortly.',
});

// Time tracking (very lenient for engagement)
const timeLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Allow 1 per second
  message: 'Too many time tracking requests.',
});

// ============================================================================
// MIDDLEWARE - All routes require authentication
// ============================================================================

router.use(requireAuth);

// ============================================================================
// UNIT CRUD ROUTES
// ============================================================================

/**
 * POST /api/v1/curriculum-units
 * Create a new curriculum unit
 * Auth: Teacher only
 * Body: { scheduleId, title, description?, startDate, endDate, topics, difficultyLevel, unitType?, isOptional? }
 */
router.post(
  '/',
  requireRole('TEACHER'),
  standardLimiter,
  createUnitHandler
);

/**
 * GET /api/v1/curriculum-units/:unitId
 * Get a specific curriculum unit
 * Auth: Teachers (creator + class teachers) and Students (enrolled)
 * Query: ?includeProgress=true&includeAssignments=true
 */
router.get(
  '/:unitId',
  standardLimiter,
  getUnitHandler
);

/**
 * PATCH /api/v1/curriculum-units/:unitId
 * Update a curriculum unit
 * Auth: Teacher (creator or class teacher) only
 * Body: { title?, description?, startDate?, endDate?, topics?, difficultyLevel?, unitType?, status? }
 */
router.patch(
  '/:unitId',
  requireRole('TEACHER'),
  standardLimiter,
  updateUnitHandler
);

/**
 * DELETE /api/v1/curriculum-units/:unitId
 * Delete a curriculum unit (soft delete)
 * Auth: Teacher (creator or class teacher) only
 */
router.delete(
  '/:unitId',
  requireRole('TEACHER'),
  standardLimiter,
  deleteUnitHandler
);

// ============================================================================
// SCHEDULE-SPECIFIC UNIT ROUTES
// ============================================================================

/**
 * GET /api/v1/curriculum-units/schedule/:scheduleId
 * Get all units for a schedule
 * Auth: Teachers (class teachers) and Students (enrolled)
 */
router.get(
  '/schedule/:scheduleId',
  standardLimiter,
  getScheduleUnitsHandler
);

/**
 * POST /api/v1/curriculum-units/schedule/:scheduleId/reorder
 * Reorder units (drag-and-drop)
 * Auth: Teacher (creator or class teacher) only
 * Body: { scheduleId, unitOrders: [{ unitId, orderIndex, startDate?, endDate? }] }
 */
router.post(
  '/schedule/:scheduleId/reorder',
  requireRole('TEACHER'),
  standardLimiter,
  reorderUnitsHandler
);

// ============================================================================
// TEACHER PROGRESS TRACKING ROUTES
// ============================================================================

/**
 * GET /api/v1/curriculum-units/:unitId/progress
 * Get unit progress for all students (teacher view)
 * Auth: Teacher (creator or class teacher) only
 */
router.get(
  '/:unitId/progress',
  requireRole('TEACHER'),
  standardLimiter,
  getUnitProgressHandler
);

/**
 * GET /api/v1/curriculum-units/:unitId/suggested-assignments
 * Get AI-suggested assignments for a unit
 * Auth: Teacher (creator or class teacher) only
 * Rate limited: 30 requests per 15 minutes
 */
router.get(
  '/:unitId/suggested-assignments',
  requireRole('TEACHER'),
  aiLimiter,
  getSuggestedAssignmentsHandler
);

// ============================================================================
// STUDENT PROGRESS TRACKING ROUTES
// ============================================================================

/**
 * GET /api/v1/curriculum-units/schedule/:scheduleId/my-progress
 * Get student's progress across all units in a schedule
 * Auth: Student (enrolled in class)
 */
router.get(
  '/schedule/:scheduleId/my-progress',
  requireRole('STUDENT'),
  standardLimiter,
  getMyProgressHandler
);

/**
 * GET /api/v1/curriculum-units/:unitId/my-progress
 * Get student's progress for a specific unit
 * Auth: Student (enrolled in class)
 */
router.get(
  '/:unitId/my-progress',
  requireRole('STUDENT'),
  standardLimiter,
  getMyUnitProgressHandler
);

/**
 * POST /api/v1/curriculum-units/:unitId/calculate-progress
 * Calculate/update progress for a unit
 * Auth: Student (for own progress) or Teacher (for any student)
 * Body: { studentId? } (optional for teachers)
 * Rate limited: 100 requests per 5 minutes
 */
router.post(
  '/:unitId/calculate-progress',
  progressLimiter,
  calculateUnitProgressHandler
);

/**
 * POST /api/v1/curriculum-units/:unitId/record-time
 * Record time spent in a unit (for engagement tracking)
 * Auth: Student (enrolled in class)
 * Body: { minutes } (1-600)
 * Rate limited: 60 requests per minute
 */
router.post(
  '/:unitId/record-time',
  requireRole('STUDENT'),
  timeLimiter,
  recordTimeSpentHandler
);

/**
 * POST /api/v1/curriculum-units/:unitId/record-participation
 * Record student participation in a unit
 * Auth: Student (enrolled in class) or Teacher
 * Rate limited: 100 requests per 5 minutes
 */
router.post(
  '/:unitId/record-participation',
  progressLimiter,
  recordParticipationHandler
);

// ============================================================================
// STUDENT INSIGHTS & ANALYTICS ROUTES
// ============================================================================

/**
 * GET /api/v1/curriculum-units/schedule/:scheduleId/my-strengths
 * Get student's strengths across a schedule
 * Auth: Student (enrolled in class)
 */
router.get(
  '/schedule/:scheduleId/my-strengths',
  requireRole('STUDENT'),
  standardLimiter,
  getMyStrengthsHandler
);

/**
 * GET /api/v1/curriculum-units/schedule/:scheduleId/my-struggles
 * Get student's struggles across a schedule
 * Auth: Student (enrolled in class)
 */
router.get(
  '/schedule/:scheduleId/my-struggles',
  requireRole('STUDENT'),
  standardLimiter,
  getMyStrugglesHandler
);

/**
 * GET /api/v1/curriculum-units/schedule/:scheduleId/my-review
 * Get recommended review topics for student
 * Auth: Student (enrolled in class)
 */
router.get(
  '/schedule/:scheduleId/my-review',
  requireRole('STUDENT'),
  standardLimiter,
  getMyReviewRecommendationsHandler
);

export default router;
