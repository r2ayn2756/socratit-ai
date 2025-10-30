// ============================================================================
// PROGRESS API SERVICE
// Handles curriculum progress tracking for students and teachers
// ============================================================================

import { apiService } from './api.service';

// ============================================================================
// TYPES
// ============================================================================

export interface UnitProgress {
  unitId: string;
  studentId: string;
  percentComplete: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageScore?: number;
}

export interface ScheduleProgress {
  scheduleId: string;
  studentId: string;
  overallPercentComplete: number;
  unitsCompleted: number;
  totalUnits: number;
  currentUnitId?: string;
  unitProgress: UnitProgress[];
}

export interface UpdateProgressRequest {
  percentComplete?: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get overall schedule progress for a student
 */
export async function getScheduleProgress(scheduleId: string, studentId?: string): Promise<ScheduleProgress> {
  const response = await apiService.get<{ success: boolean; data: ScheduleProgress }>(
    `/curriculum-schedules/${scheduleId}/progress${studentId ? `?studentId=${studentId}` : ''}`
  );
  return response.data.data;
}

/**
 * Get progress for a specific unit
 */
export async function getUnitProgress(unitId: string, studentId?: string): Promise<UnitProgress> {
  const response = await apiService.get<{ success: boolean; data: UnitProgress }>(
    `/curriculum-units/${unitId}/progress${studentId ? `?studentId=${studentId}` : ''}`
  );
  return response.data.data;
}

/**
 * Update unit progress (typically called when assignment is completed)
 */
export async function updateUnitProgress(
  unitId: string,
  data: UpdateProgressRequest
): Promise<UnitProgress> {
  const response = await apiService.patch<{ success: boolean; data: UnitProgress }>(
    `/curriculum-units/${unitId}/progress`,
    data
  );
  return response.data.data;
}

/**
 * Mark a unit as complete
 */
export async function completeUnit(unitId: string): Promise<UnitProgress> {
  return updateUnitProgress(unitId, {
    percentComplete: 100,
    status: 'COMPLETED',
  });
}

/**
 * Start a unit (mark as in progress)
 */
export async function startUnit(unitId: string): Promise<UnitProgress> {
  return updateUnitProgress(unitId, {
    status: 'IN_PROGRESS',
  });
}

/**
 * Calculate and update progress based on assignment completion
 * This is called automatically when a student submits an assignment
 */
export async function recalculateUnitProgress(unitId: string): Promise<UnitProgress> {
  const response = await apiService.post<{ success: boolean; data: UnitProgress }>(
    `/curriculum-units/${unitId}/recalculate-progress`
  );
  return response.data.data;
}

/**
 * Get class-wide progress summary (for teachers)
 */
export async function getClassProgress(
  scheduleId: string
): Promise<{
  averageCompletion: number;
  unitCompletionRates: Array<{
    unitId: string;
    unitTitle: string;
    completionRate: number;
    studentsCompleted: number;
    totalStudents: number;
  }>;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    overallProgress: number;
    currentUnitId?: string;
  }>;
}> {
  const response = await apiService.get(
    `/curriculum-schedules/${scheduleId}/class-progress`
  );
  return response.data.data;
}

// Export all functions as a service object
export const progressApiService = {
  getScheduleProgress,
  getUnitProgress,
  updateUnitProgress,
  completeUnit,
  startUnit,
  recalculateUnitProgress,
  getClassProgress,
};

export default progressApiService;
