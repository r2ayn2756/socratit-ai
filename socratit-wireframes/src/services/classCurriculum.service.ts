// ============================================================================
// CLASS CURRICULUM SERVICE
// Handles class operations WITH curriculum integration features
//
// Purpose: This service provides curriculum-enhanced class operations:
// - Creating classes with curriculum schedule generation
// - Fetching class data with curriculum context
// - Progress tracking tied to curriculum units
// - Student performance within curriculum framework
//
// NOTE: For basic class CRUD without curriculum features, use class.service.ts
// ============================================================================

import { apiService } from './api.service';
import type { CurriculumSchedule } from '../types/curriculum.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateClassRequest {
  name: string;
  subject: string;
  gradeLevel: string;
  academicYear: string;
  description?: string;
  meetingPattern: string;
  color?: string;
  period?: string;
  room?: string;
  scheduleTime?: string;

  // Curriculum schedule fields
  curriculumMaterialId?: string;
  schoolYearStart?: string; // ISO date string
  schoolYearEnd?: string; // ISO date string
  generateWithAI?: boolean;
  aiPreferences?: {
    targetUnits?: number;
    pacingPreference?: 'slow' | 'standard' | 'fast';
    focusAreas?: string[];
  };
}

export interface CreateClassResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    subject: string;
    gradeLevel: string;
    description: string | null;
    schoolId: string;
    scheduleId: string | null;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ClassDetailsResponse {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  description: string | null;
  schoolId: string;
  scheduleId: string | null;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  enrollmentStatus: string;
  averageScore?: number;
}

export interface AssignmentInfo {
  id: string;
  title: string;
  dueDate: string;
  totalSubmissions: number;
  totalStudents: number;
  unitTitle?: string;
}

export interface ProgressData {
  classAverage: number;
  averageTrend: 'up' | 'down' | 'stable';
  strugglingStudents: Array<{
    id: string;
    name: string;
    averageScore: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    averageScore: number;
  }>;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Create a new class with optional curriculum schedule generation
 * @param data - Class creation data including optional curriculum parameters
 * @returns Created class details
 */
export async function createClass(data: CreateClassRequest): Promise<ClassDetailsResponse> {
  console.log('[classCurriculum] createClass called with data:', data);
  console.log('[classCurriculum] data.curriculumMaterialId:', data.curriculumMaterialId);
  console.log('[classCurriculum] data.schoolYearStart:', data.schoolYearStart);
  console.log('[classCurriculum] data.schoolYearEnd:', data.schoolYearEnd);
  console.log('[classCurriculum] Stringified data:', JSON.stringify(data, null, 2));

  // CRITICAL FIX: Create a clean copy to ensure all fields are sent
  const cleanData = {
    name: data.name,
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    academicYear: data.academicYear,
    color: data.color,
    description: data.description,
    meetingPattern: data.meetingPattern,
    period: data.period,
    room: data.room,
    scheduleTime: data.scheduleTime,
    curriculumMaterialId: data.curriculumMaterialId,
    schoolYearStart: data.schoolYearStart,
    schoolYearEnd: data.schoolYearEnd,
    generateWithAI: data.generateWithAI,
    aiPreferences: data.aiPreferences,
  };

  console.log('[classCurriculum] Sending clean data:', JSON.stringify(cleanData, null, 2));

  const response = await apiService.post<CreateClassResponse>('/classes', cleanData);

  console.log('[classCurriculum] Response received:', response.data);
  return response.data.data;
}

/**
 * Get class details
 * @param classId - The class ID
 * @returns Class details
 */
export async function getClass(classId: string): Promise<ClassDetailsResponse> {
  const response = await apiService.get<{ success: boolean; data: ClassDetailsResponse }>(
    `/classes/${classId}`
  );
  return response.data.data;
}

/**
 * Get students enrolled in a class
 * @param classId - The class ID
 * @returns Array of student information
 */
export async function getClassStudents(classId: string): Promise<StudentInfo[]> {
  const response = await apiService.get<{ success: boolean; data: StudentInfo[] }>(
    `/classes/${classId}/students`
  );
  return response.data.data;
}

/**
 * Get assignments for a class
 * @param classId - The class ID
 * @returns Array of assignment information with curriculum context
 */
export async function getClassAssignments(classId: string): Promise<AssignmentInfo[]> {
  const response = await apiService.get<{ success: boolean; data: AssignmentInfo[] }>(
    `/classes/${classId}/assignments`
  );
  return response.data.data;
}

/**
 * Get class-wide progress data
 * @param classId - The class ID
 * @returns Progress analytics including averages and trends
 */
export async function getClassProgress(classId: string): Promise<ProgressData> {
  const response = await apiService.get<{ success: boolean; data: ProgressData }>(
    `/analytics/classes/${classId}/progress`
  );
  return response.data.data;
}

/**
 * Get curriculum schedule for a class
 * @param classId - The class ID
 * @returns Curriculum schedule or null if none exists
 */
export async function getClassSchedule(classId: string): Promise<CurriculumSchedule | null> {
  try {
    const response = await apiService.get<{ success: boolean; data: CurriculumSchedule[] }>(
      `/curriculum-schedules/class/${classId}`
    );
    // Return the first (most recent) schedule, or null if none exist
    return response.data.data && response.data.data.length > 0 ? response.data.data[0] : null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No schedule exists yet
    }
    throw error;
  }
}

// Export all functions as a service object for convenient importing
export const classCurriculumService = {
  createClass,
  getClass,
  getClassStudents,
  getClassAssignments,
  getClassProgress,
  getClassSchedule,
};

export default classCurriculumService;
