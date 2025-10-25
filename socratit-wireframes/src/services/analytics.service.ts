// ============================================================================
// ANALYTICS SERVICE
// API calls for Analytics & Insights (Batch 5)
// ============================================================================

import apiClient from './api.service';
import {
  ConceptMastery,
  StudentInsight,
  ClassOverview,
  TimelineDataPoint,
  ConceptComparison,
  AssignmentTypeBreakdown,
  DistributionStats,
  ConceptHeatmapData,
  EngagementMetrics,
  AssignmentPerformanceDetail,
  ClassComparisonData,
  RecommendationData,
  TeacherNote,
  AnalyticsEvent,
  StudentReportExport,
} from '../types/analytics.types';

// ============================================================================
// STUDENT ANALYTICS ENDPOINTS
// ============================================================================

export const getStudentConceptMastery = async (
  studentId: string,
  classId?: string
): Promise<ConceptMastery[]> => {
  const params: any = {};
  if (classId) params.classId = classId;

  const response = await apiClient.get(`/analytics/student/${studentId}/concepts`, { params });
  return response.data.data;
};

export const getStudentInsights = async (
  studentId: string,
  classId?: string
): Promise<StudentInsight[]> => {
  const params: any = {};
  if (classId) params.classId = classId;

  const response = await apiClient.get(`/analytics/student/${studentId}/insights`, { params });
  return response.data.data;
};

// ============================================================================
// CLASS ANALYTICS ENDPOINTS (Teacher Only)
// ============================================================================

export const getStrugglingStudents = async (classId: string): Promise<any[]> => {
  const response = await apiClient.get(`/analytics/class/${classId}/struggling-students`);
  return response.data.data;
};

export const getClassOverview = async (classId: string): Promise<ClassOverview> => {
  const response = await apiClient.get(`/analytics/class/${classId}/overview`);
  return response.data.data;
};

export const recalculateClassAnalytics = async (classId: string): Promise<void> => {
  await apiClient.post(`/analytics/class/${classId}/recalculate`);
};

// ============================================================================
// BATCH 7: EXTENDED ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get performance timeline for a student
 * Shows performance trends over time with customizable granularity
 */
export const getPerformanceTimeline = async (
  studentId: string,
  classId: string,
  startDate?: string,
  endDate?: string,
  granularity: 'day' | 'week' | 'month' = 'week'
): Promise<TimelineDataPoint[]> => {
  const params: any = { classId, granularity };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get(`/analytics/student/${studentId}/performance-timeline`, { params });
  return response.data.data;
};

/**
 * Compare student's concept mastery against class average
 */
export const getConceptComparison = async (
  studentId: string,
  classId: string
): Promise<ConceptComparison[]> => {
  const response = await apiClient.get(`/analytics/student/${studentId}/concept-comparison`, {
    params: { classId },
  });
  return response.data.data;
};

/**
 * Get breakdown of performance by assignment type
 */
export const getAssignmentBreakdown = async (
  studentId: string,
  classId: string
): Promise<AssignmentTypeBreakdown[]> => {
  const response = await apiClient.get(`/analytics/student/${studentId}/assignment-breakdown`, {
    params: { classId },
  });
  return response.data.data;
};

/**
 * Get performance distribution for a class
 * Shows grade distribution statistics
 */
export const getPerformanceDistribution = async (classId: string): Promise<DistributionStats> => {
  const response = await apiClient.get(`/analytics/class/${classId}/performance-distribution`);
  return response.data.data;
};

/**
 * Get concept mastery heatmap for entire class
 * Shows which concepts each student has mastered
 */
export const getConceptMasteryHeatmap = async (classId: string): Promise<ConceptHeatmapData[]> => {
  const response = await apiClient.get(`/analytics/class/${classId}/concept-mastery-heatmap`);
  return response.data.data;
};

/**
 * Get engagement metrics for a class
 * Includes time spent, completion rates, active/inactive students
 */
export const getEngagementMetrics = async (classId: string): Promise<EngagementMetrics> => {
  const response = await apiClient.get(`/analytics/class/${classId}/engagement-metrics`);
  return response.data.data;
};

/**
 * Get per-assignment performance details for a class
 * Shows statistics for each assignment
 */
export const getAssignmentPerformance = async (classId: string): Promise<AssignmentPerformanceDetail[]> => {
  const response = await apiClient.get(`/analytics/class/${classId}/assignment-performance`);
  return response.data.data;
};

/**
 * Compare classes within a school
 * Only accessible by school admins
 */
export const compareClasses = async (classId: string): Promise<ClassComparisonData[]> => {
  const response = await apiClient.get(`/analytics/class/${classId}/compare-classes`);
  return response.data.data;
};

/**
 * Generate AI-powered recommendations for a student
 * Uses OpenAI to analyze performance and suggest interventions
 */
export const generateRecommendations = async (
  studentId: string,
  classId: string,
  focus?: 'concepts' | 'assignments' | 'engagement' | 'overall'
): Promise<RecommendationData> => {
  const params: any = { classId };
  if (focus) params.focus = focus;

  const response = await apiClient.post(`/analytics/student/${studentId}/generate-recommendations`, null, { params });
  return response.data.data;
};

/**
 * Update teacher notes for a student insight
 */
export const updateTeacherNotes = async (
  insightId: string,
  notes: string
): Promise<TeacherNote> => {
  const response = await apiClient.patch(`/analytics/insights/${insightId}/teacher-notes`, {
    notes,
  });
  return response.data.data;
};

// ============================================================================
// ANALYTICS EVENT TRACKING
// ============================================================================

/**
 * Track analytics event
 * Records user interactions for analytics
 */
export const trackEvent = async (
  eventType: string,
  metadata?: Record<string, any>
): Promise<void> => {
  await apiClient.post('/analytics/events', {
    eventType,
    metadata,
  });
};

/**
 * Get analytics events for a student
 * Returns event history with optional filtering
 */
export const getStudentEvents = async (
  studentId: string,
  eventType?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<AnalyticsEvent[]> => {
  const params: any = { limit };
  if (eventType) params.eventType = eventType;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get(`/analytics/events/student/${studentId}`, { params });
  return response.data.data;
};

// ============================================================================
// EXPORT ENDPOINTS
// ============================================================================

/**
 * Export class grades to CSV
 * Downloads CSV file with all student grades
 */
export const exportClassGrades = async (classId: string): Promise<Blob> => {
  const response = await apiClient.get(`/analytics/export/class/${classId}/grades`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export individual student report to JSON
 * Comprehensive student performance report
 */
export const exportStudentReport = async (
  studentId: string,
  classId: string
): Promise<StudentReportExport> => {
  const response = await apiClient.get(`/analytics/export/student/${studentId}/report`, {
    params: { classId },
  });
  return response.data.data;
};

// ============================================================================
// EXPORT
// ============================================================================

const analyticsService = {
  // Batch 5 endpoints
  getStudentConceptMastery,
  getStudentInsights,
  getStrugglingStudents,
  getClassOverview,
  recalculateClassAnalytics,
  // Batch 7 endpoints
  getPerformanceTimeline,
  getConceptComparison,
  getAssignmentBreakdown,
  getPerformanceDistribution,
  getConceptMasteryHeatmap,
  getEngagementMetrics,
  getAssignmentPerformance,
  compareClasses,
  generateRecommendations,
  updateTeacherNotes,
  trackEvent,
  getStudentEvents,
  exportClassGrades,
  exportStudentReport,
};

export default analyticsService;
