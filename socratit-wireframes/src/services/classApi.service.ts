// ============================================================================
// CLASS API SERVICE
// API calls for class management with curriculum integration
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
 * Create a new class
 */
export async function createClass(data: CreateClassRequest): Promise<ClassDetailsResponse> {
  console.log('[API] createClass called with data:', data);
  console.log('[API] data.curriculumMaterialId:', data.curriculumMaterialId);
  console.log('[API] data.schoolYearStart:', data.schoolYearStart);
  console.log('[API] data.schoolYearEnd:', data.schoolYearEnd);
  console.log('[API] Stringified data:', JSON.stringify(data, null, 2));

  const response = await apiService.post<CreateClassResponse>('/classes', data);

  console.log('[API] Response received:', response.data);
  return response.data.data;
}

/**
 * Get class details
 */
export async function getClass(classId: string): Promise<ClassDetailsResponse> {
  const response = await apiService.get<{ success: boolean; data: ClassDetailsResponse }>(
    `/classes/${classId}`
  );
  return response.data.data;
}

/**
 * Get class students
 */
export async function getClassStudents(classId: string): Promise<StudentInfo[]> {
  const response = await apiService.get<{ success: boolean; data: StudentInfo[] }>(
    `/classes/${classId}/students`
  );
  return response.data.data;
}

/**
 * Get class assignments
 */
export async function getClassAssignments(classId: string): Promise<AssignmentInfo[]> {
  const response = await apiService.get<{ success: boolean; data: AssignmentInfo[] }>(
    `/classes/${classId}/assignments`
  );
  return response.data.data;
}

/**
 * Get class progress data
 */
export async function getClassProgress(classId: string): Promise<ProgressData> {
  const response = await apiService.get<{ success: boolean; data: ProgressData }>(
    `/analytics/classes/${classId}/progress`
  );
  return response.data.data;
}

/**
 * Get curriculum schedule for a class
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

// Export all functions as a service object
export const classApiService = {
  createClass,
  getClass,
  getClassStudents,
  getClassAssignments,
  getClassProgress,
  getClassSchedule,
};

export default classApiService;
