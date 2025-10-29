// ============================================================================
// CURRICULUM SCHEDULE ROUTES
// Routes for year-long curriculum scheduling and planning
// ============================================================================

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  createScheduleHandler,
  getScheduleHandler,
  getClassSchedulesHandler,
  updateScheduleHandler,
  publishScheduleHandler,
  deleteScheduleHandler,
  generateScheduleFromAIHandler,
  refineScheduleWithAIHandler,
  getScheduleSuggestionsHandler,
  calculateProgressHandler,
} from '../controllers/curriculumSchedule.controller';

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

// AI operations (more restrictive)
const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow 20 AI requests per 15 minutes
  message: 'Too many AI requests. Please try again in a few minutes.',
});

// Progress calculation (moderate)
const progressLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'Too many progress calculation requests. Please try again shortly.',
});

// ============================================================================
// MIDDLEWARE - All routes require authentication
// ============================================================================

router.use(requireAuth);

// ============================================================================
// SCHEDULE CRUD ROUTES
// ============================================================================

/**
 * POST /api/v1/curriculum-schedules
 * Create a new curriculum schedule
 * Auth: Teacher only
 * Body: { classId, schoolYearStart, schoolYearEnd, title, description?, curriculumMaterialId? }
 */
router.post(
  '/',
  requireRole('TEACHER'),
  standardLimiter,
  createScheduleHandler
);

/**
 * GET /api/v1/curriculum-schedules/:scheduleId
 * Get a specific curriculum schedule
 * Auth: Teachers (creator + class teachers) and Students (enrolled)
 * Query: ?includeProgress=true&includeAssignments=true
 */
router.get(
  '/:scheduleId',
  standardLimiter,
  getScheduleHandler
);

/**
 * PATCH /api/v1/curriculum-schedules/:scheduleId
 * Update a curriculum schedule
 * Auth: Teacher (creator or class teacher) only
 * Body: { title?, description?, schoolYearStart?, schoolYearEnd?, status? }
 */
router.patch(
  '/:scheduleId',
  requireRole('TEACHER'),
  standardLimiter,
  updateScheduleHandler
);

/**
 * POST /api/v1/curriculum-schedules/:scheduleId/publish
 * Publish schedule (make visible to students)
 * Auth: Teacher (creator or class teacher) only
 */
router.post(
  '/:scheduleId/publish',
  requireRole('TEACHER'),
  standardLimiter,
  publishScheduleHandler
);

/**
 * DELETE /api/v1/curriculum-schedules/:scheduleId
 * Delete a curriculum schedule (soft delete)
 * Auth: Teacher (creator only)
 */
router.delete(
  '/:scheduleId',
  requireRole('TEACHER'),
  standardLimiter,
  deleteScheduleHandler
);

// ============================================================================
// CLASS-SPECIFIC ROUTES
// ============================================================================

/**
 * GET /api/v1/curriculum-schedules/class/:classId
 * Get all schedules for a class
 * Auth: Teachers (class teachers) and Students (enrolled)
 */
router.get(
  '/class/:classId',
  standardLimiter,
  getClassSchedulesHandler
);

// ============================================================================
// AI INTEGRATION ROUTES
// ============================================================================

/**
 * POST /api/v1/curriculum-schedules/:scheduleId/generate-ai
 * Generate curriculum schedule from AI
 * Auth: Teacher (creator or class teacher) only
 * Body: { curriculumMaterialId, preferences?: { targetUnits?, pacingPreference?, includeReviewUnits?, breakDates? } }
 * Rate limited: 20 requests per 15 minutes
 */
router.post(
  '/:scheduleId/generate-ai',
  requireRole('TEACHER'),
  aiLimiter,
  generateScheduleFromAIHandler
);

/**
 * POST /api/v1/curriculum-schedules/:scheduleId/refine-ai
 * Refine schedule with AI (chat-based)
 * Auth: Teacher (creator or class teacher) only
 * Body: { message, conversationHistory? }
 * Rate limited: 20 requests per 15 minutes
 */
router.post(
  '/:scheduleId/refine-ai',
  requireRole('TEACHER'),
  aiLimiter,
  refineScheduleWithAIHandler
);

/**
 * GET /api/v1/curriculum-schedules/:scheduleId/suggestions
 * Get AI improvement suggestions for schedule
 * Auth: Teacher (creator or class teacher) only
 * Rate limited: 20 requests per 15 minutes
 */
router.get(
  '/:scheduleId/suggestions',
  requireRole('TEACHER'),
  aiLimiter,
  getScheduleSuggestionsHandler
);

// ============================================================================
// PROGRESS TRACKING ROUTES
// ============================================================================

/**
 * POST /api/v1/curriculum-schedules/:scheduleId/calculate-progress
 * Calculate and update schedule progress
 * Auth: Teacher (creator or class teacher) only
 * Rate limited: 50 requests per 5 minutes
 */
router.post(
  '/:scheduleId/calculate-progress',
  requireRole('TEACHER'),
  progressLimiter,
  calculateProgressHandler
);

export default router;
