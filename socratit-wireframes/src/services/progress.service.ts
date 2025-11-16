// ============================================================================
// PROGRESS SERVICE
// API calls for Progress Tracking system (Batch 8)
// ============================================================================

import apiClient from './api.service';
import {
  StudentProgress,
  AssignmentProgress,
  ConceptMastery,
  ConceptMasteryPath,
  LearningVelocityLog,
  ProgressTrends,
  ClassProgressTrends,
  CreateConceptPathRequest,
  UpdateConceptPathRequest,
  UpdateTimeSpentRequest,
  GetAssignmentProgressParams,
  GetLearningVelocityParams,
} from '../types/progress.types';

// ============================================================================
// STUDENT PROGRESS ENDPOINTS
// ============================================================================

/**
 * Get overall progress for a student in a specific class
 */
export const getStudentProgress = async (
  studentId: string,
  classId: string
): Promise<StudentProgress> => {
  const response = await apiClient.get(`/progress/student/${studentId}/class/${classId}`);
  return response.data.data;
};

/**
 * Get progress across all enrolled classes
 */
export const getStudentProgressAcrossClasses = async (
  studentId: string
): Promise<StudentProgress[]> => {
  const response = await apiClient.get(`/progress/student/${studentId}/classes`);
  return response.data.data;
};

/**
 * Get progress for all students in a class (teachers only)
 */
export const getClassProgress = async (classId: string): Promise<StudentProgress[]> => {
  const response = await apiClient.get(`/progress/class/${classId}/students`);
  return response.data.data;
};

/**
 * Trigger progress calculation for a student in a class
 */
export const calculateProgress = async (
  studentId: string,
  classId: string
): Promise<StudentProgress> => {
  const response = await apiClient.post(`/progress/calculate/${studentId}/${classId}`);
  return response.data.data;
};

// ============================================================================
// ASSIGNMENT PROGRESS ENDPOINTS
// ============================================================================

/**
 * Get progress for all assignments for a student
 */
export const getAssignmentProgressForStudent = async (
  studentId: string,
  params?: GetAssignmentProgressParams
): Promise<AssignmentProgress[]> => {
  const response = await apiClient.get(`/progress/assignments/${studentId}`, { params });
  return response.data.data;
};

/**
 * Get progress for a specific assignment
 */
export const getAssignmentProgress = async (
  assignmentId: string,
  studentId: string
): Promise<AssignmentProgress> => {
  const response = await apiClient.get(`/progress/assignment/${assignmentId}/student/${studentId}`);
  return response.data.data;
};

/**
 * Get progress for all students on a specific assignment (teachers only)
 */
export const getAssignmentProgressForClass = async (
  assignmentId: string
): Promise<AssignmentProgress[]> => {
  const response = await apiClient.get(`/progress/assignment/${assignmentId}/students`);
  return response.data.data;
};

/**
 * Update time spent on an assignment
 * Rate-limited to 1 request per minute
 */
export const updateTimeSpent = async (
  assignmentId: string,
  timeSpentMinutes: number
): Promise<void> => {
  const data: UpdateTimeSpentRequest = { timeSpentMinutes };
  await apiClient.patch(`/progress/assignment/${assignmentId}/time`, data);
};

// ============================================================================
// CONCEPT MASTERY PROGRESS ENDPOINTS
// ============================================================================

/**
 * Get concept mastery progression for a student
 */
export const getConceptProgress = async (
  studentId: string,
  classId: string
): Promise<{ concepts: ConceptMastery[]; paths: ConceptMasteryPath[] }> => {
  const response = await apiClient.get(`/progress/concepts/${studentId}/class/${classId}`);
  return response.data.data;
};

/**
 * Get all students' mastery of a specific concept in a class (teachers only)
 */
export const getConceptProgressForClass = async (
  conceptName: string,
  classId: string
): Promise<ConceptMastery[]> => {
  const response = await apiClient.get(
    `/progress/concepts/${encodeURIComponent(conceptName)}/students/${classId}`
  );
  return response.data.data;
};

// ============================================================================
// CONCEPT PATH MANAGEMENT (TEACHERS ONLY)
// ============================================================================

/**
 * Get concept paths for a class
 */
export const getConceptPathsForClass = async (
  classId: string
): Promise<ConceptMasteryPath[]> => {
  const response = await apiClient.get(`/progress/concepts/paths/${classId}`);
  return response.data.data;
};

/**
 * Create a new concept path
 */
export const createConceptPath = async (
  data: CreateConceptPathRequest
): Promise<ConceptMasteryPath> => {
  const response = await apiClient.post('/progress/concepts/paths', data);
  return response.data.data;
};

/**
 * Update a concept path
 */
export const updateConceptPath = async (
  pathId: string,
  data: UpdateConceptPathRequest
): Promise<ConceptMasteryPath> => {
  const response = await apiClient.put(`/progress/concepts/paths/${pathId}`, data);
  return response.data.data;
};

/**
 * Delete a concept path
 */
export const deleteConceptPath = async (pathId: string): Promise<void> => {
  await apiClient.delete(`/progress/concepts/paths/${pathId}`);
};

// ============================================================================
// LEARNING VELOCITY ENDPOINTS
// ============================================================================

/**
 * Get learning velocity for a student
 */
export const getLearningVelocity = async (
  studentId: string,
  classId: string,
  params?: GetLearningVelocityParams
): Promise<LearningVelocityLog[]> => {
  const response = await apiClient.get(`/progress/velocity/${studentId}/class/${classId}`, {
    params,
  });
  return response.data.data;
};

/**
 * Get learning velocity for all students in a class (teachers only)
 */
export const getClassLearningVelocity = async (
  classId: string
): Promise<LearningVelocityLog[]> => {
  const response = await apiClient.get(`/progress/velocity/class/${classId}`);
  return response.data.data;
};

// ============================================================================
// PROGRESS TRENDS ENDPOINTS
// ============================================================================

/**
 * Get grade trends and performance patterns for a student
 */
export const getProgressTrends = async (
  studentId: string,
  classId: string
): Promise<ProgressTrends> => {
  const response = await apiClient.get(`/progress/trends/${studentId}/class/${classId}`);
  return response.data.data;
};

/**
 * Get class-wide trends (teachers only)
 */
export const getClassProgressTrends = async (classId: string): Promise<ClassProgressTrends> => {
  const response = await apiClient.get(`/progress/trends/class/${classId}`);
  return response.data.data;
};

// ============================================================================
// CONCEPT MASTERY ENDPOINTS (for practice assignments)
// ============================================================================

/**
 * Get student's concept mastery data from practice assignments
 */
export const getConceptMasteryData = async (
  studentId: string,
  classId: string
): Promise<{
  conceptId: string;
  conceptName: string;
  subtopicName: string;
  unitTitle?: string;
  masteryScore: number;
  questionsAttempted: number;
  questionsCorrect: number;
  averageScore: number;
  trend: 'improving' | 'declining' | 'stable';
  lastPracticed?: string;
  recommendations?: string[];
}[]> => {
  const response = await apiClient.get(
    `/progress/concepts/${studentId}/class/${classId}/mastery`
  );
  return response.data.data;
};

/**
 * Update concept mastery score after practice question response
 * This is typically called automatically by the backend after answer submission
 */
export const updateConceptMastery = async (
  studentId: string,
  conceptId: string,
  data: {
    questionId: string;
    isCorrect: boolean;
    score: number;
    timeSpent?: number;
  }
): Promise<void> => {
  await apiClient.post(`/progress/concepts/${studentId}/update`, {
    conceptId,
    ...data,
  });
};

/**
 * Get concept mastery summary for a specific concept across all students (teachers only)
 */
export const getConceptMasterySummary = async (
  conceptId: string,
  classId: string
): Promise<{
  conceptId: string;
  conceptName: string;
  classAverage: number;
  studentsCount: number;
  studentsAbove70: number;
  studentsBelow50: number;
  topPerformers: Array<{ studentId: string; studentName: string; score: number }>;
  needsSupport: Array<{ studentId: string; studentName: string; score: number }>;
}> => {
  const response = await apiClient.get(
    `/progress/concepts/${conceptId}/class/${classId}/summary`
  );
  return response.data.data;
};
