// ============================================================================
// CLASS API SERVICE
// API calls for class management with curriculum integration
// ============================================================================

import { apiService } from './api.service';
import type { CurriculumSchedule, CurriculumUnit } from '../types/curriculum.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateClassRequest {
  name: string;
  subject: string;
  gradeLevel: string;
  description?: string;
  meetingPattern: string;
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
  const response = await apiService.post<CreateClassResponse>('/classes', data);
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
    const response = await apiService.get<{ success: boolean; data: CurriculumSchedule }>(
      `/classes/${classId}/schedule`
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No schedule exists yet
    }
    throw error;
  }
}

/**
 * Get current unit for a class
 */
export async function getCurrentUnit(scheduleId: string): Promise<CurriculumUnit | null> {
  try {
    const response = await apiService.get<{ success: boolean; data: CurriculumUnit }>(
      `/curriculum-schedules/${scheduleId}/current-unit`
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get upcoming units for a class
 */
export async function getUpcomingUnits(scheduleId: string, limit: number = 3): Promise<CurriculumUnit[]> {
  const response = await apiService.get<{ success: boolean; data: CurriculumUnit[] }>(
    `/curriculum-schedules/${scheduleId}/upcoming-units?limit=${limit}`
  );
  return response.data.data;
}

// Export all functions as a service object
export const classApiService = {
  createClass,
  getClass,
  getClassStudents,
  getClassAssignments,
  getClassProgress,
  getClassSchedule,
  getCurrentUnit,
  getUpcomingUnits,
};

export default classApiService;
