// ============================================================================
// ANALYTICS ROUTES
// Routes for analytics, insights, and performance data
// ============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  getStudentConceptMastery,
  getStudentInsights,
  getStrugglingStudents,
  getClassOverview,
  recalculateClassAnalytics,
} from '../controllers/analytics.controller';
import {
  getPerformanceTimeline,
  getConceptComparison,
  getAssignmentBreakdownHandler,
  getPerformanceDistribution,
  getConceptHeatmap,
  getEngagementMetricsHandler,
  getAssignmentPerformanceHandler,
  compareClasses,
  generateRecommendations,
  updateTeacherNotes,
  trackEvent,
  getStudentEventsHandler,
  exportClassGrades,
  exportStudentReport,
  getComprehensiveClassAnalytics,
} from '../controllers/analytics.extended.controller';

const router = Router();

// Rate limiters
const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
});

// ============================================================================
// CONCEPT MASTERY ROUTES
// ============================================================================

// Get student concept mastery
router.get(
  '/student/:studentId/concepts',
  requireAuth,
  standardLimiter,
  getStudentConceptMastery
);

// ============================================================================
// STUDENT INSIGHTS ROUTES
// ============================================================================

// Get student insights
router.get(
  '/student/:studentId/insights',
  requireAuth,
  standardLimiter,
  getStudentInsights
);

// ============================================================================
// CLASS ANALYTICS ROUTES
// ============================================================================

// Get struggling students in class (teacher only)
router.get(
  '/class/:classId/struggling-students',
  requireAuth,
  standardLimiter,
  getStrugglingStudents
);

// Get class overview (teacher only)
router.get(
  '/class/:classId/overview',
  requireAuth,
  standardLimiter,
  getClassOverview
);

// Get comprehensive class analytics (teacher only) - OPTIMIZED ENDPOINT
router.get(
  '/class/:classId/comprehensive',
  requireAuth,
  standardLimiter,
  getComprehensiveClassAnalytics
);

// Recalculate class analytics (teacher only)
router.post(
  '/class/:classId/recalculate',
  requireAuth,
  standardLimiter,
  recalculateClassAnalytics
);

// ============================================================================
// NEW BATCH 7 ENDPOINTS
// ============================================================================

// Student Performance Timeline
router.get(
  '/student/:studentId/performance-timeline',
  requireAuth,
  standardLimiter,
  getPerformanceTimeline
);

// Concept Comparison
router.get(
  '/student/:studentId/concept-comparison',
  requireAuth,
  standardLimiter,
  getConceptComparison
);

// Assignment Breakdown
router.get(
  '/student/:studentId/assignment-breakdown',
  requireAuth,
  standardLimiter,
  getAssignmentBreakdownHandler
);

// Performance Distribution
router.get(
  '/class/:classId/performance-distribution',
  requireAuth,
  standardLimiter,
  getPerformanceDistribution
);

// Concept Mastery Heatmap
router.get(
  '/class/:classId/concept-mastery-heatmap',
  requireAuth,
  standardLimiter,
  getConceptHeatmap
);

// Engagement Metrics
router.get(
  '/class/:classId/engagement-metrics',
  requireAuth,
  standardLimiter,
  getEngagementMetricsHandler
);

// Assignment Performance
router.get(
  '/class/:classId/assignment-performance',
  requireAuth,
  standardLimiter,
  getAssignmentPerformanceHandler
);

// Class Comparison
router.get(
  '/class/:classId/compare-classes',
  requireAuth,
  standardLimiter,
  compareClasses
);

// Generate AI Recommendations
router.post(
  '/student/:studentId/generate-recommendations',
  requireAuth,
  standardLimiter,
  generateRecommendations
);

// Update Teacher Notes
router.patch(
  '/insights/:insightId/teacher-notes',
  requireAuth,
  standardLimiter,
  updateTeacherNotes
);

// Track Analytics Event
router.post(
  '/events',
  requireAuth,
  standardLimiter,
  trackEvent
);

// Get Student Events
router.get(
  '/events/student/:studentId',
  requireAuth,
  standardLimiter,
  getStudentEventsHandler
);

// Export Class Grades
router.get(
  '/export/class/:classId/grades',
  requireAuth,
  standardLimiter,
  exportClassGrades
);

// Export Student Report
router.get(
  '/export/student/:studentId/report',
  requireAuth,
  standardLimiter,
  exportStudentReport
);

export default router;
