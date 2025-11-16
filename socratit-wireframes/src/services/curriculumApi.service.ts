// ============================================================================
// CURRICULUM API SERVICE
// API client for curriculum scheduling operations
//
// REFACTORED: Now uses shared apiService instead of creating its own axios instance
// This ensures consistent authentication, error handling, and base URL configuration
// ============================================================================

import { apiService } from './api.service';
import type {
  CurriculumSchedule,
  CurriculumUnit,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GenerateScheduleFromAIRequest,
  RefineScheduleWithAIRequest,
  CreateUnitRequest,
  UpdateUnitRequest,
  ReorderUnitsRequest,
  ScheduleResponse,
  UnitResponse,
  AIScheduleResponse,
  AIRefinementResponse,
  AISuggestionsResponse,
  SuggestedAssignmentsResponse,
  StudentUnitProgressResponse,
  UnitProgressResponse,
  APIResponse,
} from '../types/curriculum.types';

// ============================================================================
// SCHEDULE API
// ============================================================================

export const scheduleApi = {
  /**
   * Create a new curriculum schedule
   */
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleResponse> {
    const response = await apiService.post<APIResponse<ScheduleResponse>>(
      '/curriculum-schedules',
      data
    );
    return response.data.data!;
  },

  /**
   * Get schedule by ID
   */
  async getSchedule(
    scheduleId: string,
    options?: { includeProgress?: boolean; includeAssignments?: boolean }
  ): Promise<ScheduleResponse> {
    const params = new URLSearchParams();
    if (options?.includeProgress) params.append('includeProgress', 'true');
    if (options?.includeAssignments) params.append('includeAssignments', 'true');

    const response = await apiService.get<APIResponse<ScheduleResponse>>(
      `/curriculum-schedules/${scheduleId}?${params.toString()}`
    );
    return response.data.data!;
  },

  /**
   * Get all schedules for a class
   */
  async getClassSchedules(classId: string): Promise<CurriculumSchedule[]> {
    const response = await apiService.get<APIResponse<CurriculumSchedule[]>>(
      `/curriculum-schedules/class/${classId}`
    );
    return response.data.data!;
  },

  /**
   * Update schedule
   */
  async updateSchedule(
    scheduleId: string,
    data: UpdateScheduleRequest
  ): Promise<CurriculumSchedule> {
    const response = await apiService.patch<APIResponse<CurriculumSchedule>>(
      `/curriculum-schedules/${scheduleId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Publish schedule
   */
  async publishSchedule(scheduleId: string): Promise<CurriculumSchedule> {
    const response = await apiService.post<APIResponse<CurriculumSchedule>>(
      `/curriculum-schedules/${scheduleId}/publish`
    );
    return response.data.data!;
  },

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await apiService.delete(`/curriculum-schedules/${scheduleId}`);
  },

  /**
   * Generate curriculum preview (before class creation)
   * Analyzes curriculum files and returns unit structure without creating a schedule
   */
  async generateCurriculumPreview(data: {
    curriculumMaterialId: string;
    schoolYearStart: string;
    schoolYearEnd: string;
    meetingPattern: string;
    preferences: {
      targetUnits?: number;
      pacingPreference?: 'slow' | 'standard' | 'fast' | 'accelerated' | 'extended';
    };
  }): Promise<AIScheduleResponse> {
    const response = await apiService.post<APIResponse<AIScheduleResponse>>(
      `/curriculum/analyze-preview`,
      data,
      {
        timeout: 300000, // 5 minutes for AI analysis
      }
    );
    return response.data.data!;
  },

  /**
   * Generate schedule from AI
   * Uses extended timeout (5 minutes) because AI generation takes longer
   */
  async generateScheduleFromAI(
    scheduleId: string,
    data: GenerateScheduleFromAIRequest
  ): Promise<AIScheduleResponse> {
    const response = await apiService.post<APIResponse<AIScheduleResponse>>(
      `/curriculum-schedules/${scheduleId}/generate-ai`,
      data,
      {
        timeout: 300000, // 5 minutes for AI generation (includes Gemini API call + database operations + sub-units processing)
      }
    );
    return response.data.data!;
  },

  /**
   * Refine schedule with AI (chat)
   */
  async refineScheduleWithAI(
    scheduleId: string,
    data: RefineScheduleWithAIRequest
  ): Promise<AIRefinementResponse> {
    const response = await apiService.post<APIResponse<AIRefinementResponse>>(
      `/curriculum-schedules/${scheduleId}/refine-ai`,
      data
    );
    return response.data.data!;
  },

  /**
   * Get AI improvement suggestions
   */
  async getScheduleSuggestions(scheduleId: string): Promise<AISuggestionsResponse> {
    const response = await apiService.get<APIResponse<AISuggestionsResponse>>(
      `/curriculum-schedules/${scheduleId}/suggestions`
    );
    return response.data.data!;
  },

  /**
   * Calculate schedule progress
   */
  async calculateProgress(scheduleId: string): Promise<void> {
    await apiService.post(`/curriculum-schedules/${scheduleId}/calculate-progress`);
  },
};

// ============================================================================
// UNIT API
// ============================================================================

export const unitApi = {
  /**
   * Create a new curriculum unit
   */
  async createUnit(data: CreateUnitRequest): Promise<CurriculumUnit> {
    const response = await apiService.post<APIResponse<CurriculumUnit>>(
      '/curriculum-units',
      data
    );
    return response.data.data!;
  },

  /**
   * Get unit by ID
   */
  async getUnit(
    unitId: string,
    options?: { includeProgress?: boolean; includeAssignments?: boolean }
  ): Promise<UnitResponse> {
    const params = new URLSearchParams();
    if (options?.includeProgress) params.append('includeProgress', 'true');
    if (options?.includeAssignments) params.append('includeAssignments', 'true');

    const response = await apiService.get<APIResponse<UnitResponse>>(
      `/curriculum-units/${unitId}?${params.toString()}`
    );
    return response.data.data!;
  },

  /**
   * Get all units for a schedule
   */
  async getScheduleUnits(scheduleId: string): Promise<CurriculumUnit[]> {
    const response = await apiService.get<APIResponse<CurriculumUnit[]>>(
      `/curriculum-units/schedule/${scheduleId}`
    );
    return response.data.data!;
  },

  /**
   * Update unit
   */
  async updateUnit(unitId: string, data: UpdateUnitRequest): Promise<CurriculumUnit> {
    const response = await apiService.patch<APIResponse<CurriculumUnit>>(
      `/curriculum-units/${unitId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete unit
   */
  async deleteUnit(unitId: string): Promise<void> {
    await apiService.delete(`/curriculum-units/${unitId}`);
  },

  /**
   * Reorder units (drag-and-drop)
   */
  async reorderUnits(data: ReorderUnitsRequest): Promise<void> {
    await apiService.post(`/curriculum-units/schedule/${data.scheduleId}/reorder`, data);
  },

  /**
   * Get unit progress for all students (teacher view)
   */
  async getUnitProgress(unitId: string): Promise<UnitProgressResponse> {
    const response = await apiService.get<APIResponse<UnitProgressResponse>>(
      `/curriculum-units/${unitId}/progress`
    );
    return response.data.data!;
  },

  /**
   * Get AI-suggested assignments for a unit
   */
  async getSuggestedAssignments(unitId: string): Promise<SuggestedAssignmentsResponse> {
    const response = await apiService.get<APIResponse<SuggestedAssignmentsResponse>>(
      `/curriculum-units/${unitId}/suggested-assignments`
    );
    return response.data.data!;
  },
};

// ============================================================================
// STUDENT PROGRESS API
// ============================================================================

export const progressApi = {
  /**
   * Get student's progress across all units
   */
  async getMyProgress(scheduleId: string): Promise<StudentUnitProgressResponse> {
    const response = await apiService.get<APIResponse<StudentUnitProgressResponse>>(
      `/curriculum-units/schedule/${scheduleId}/my-progress`
    );
    return response.data.data!;
  },

  /**
   * Get student's progress for a specific unit
   */
  async getMyUnitProgress(unitId: string): Promise<any> {
    const response = await apiService.get<APIResponse<any>>(
      `/curriculum-units/${unitId}/my-progress`
    );
    return response.data.data!;
  },

  /**
   * Calculate unit progress
   */
  async calculateUnitProgress(unitId: string, studentId?: string): Promise<any> {
    const response = await apiService.post<APIResponse<any>>(
      `/curriculum-units/${unitId}/calculate-progress`,
      studentId ? { studentId } : {}
    );
    return response.data.data!;
  },

  /**
   * Record time spent in a unit
   */
  async recordTimeSpent(unitId: string, minutes: number): Promise<void> {
    await apiService.post(`/curriculum-units/${unitId}/record-time`, { minutes });
  },

  /**
   * Record participation in a unit
   */
  async recordParticipation(unitId: string): Promise<void> {
    await apiService.post(`/curriculum-units/${unitId}/record-participation`);
  },

  /**
   * Get student's strengths
   */
  async getMyStrengths(scheduleId: string): Promise<{ strengths: string[] }> {
    const response = await apiService.get<APIResponse<{ strengths: string[] }>>(
      `/curriculum-units/schedule/${scheduleId}/my-strengths`
    );
    return response.data.data!;
  },

  /**
   * Get student's struggles
   */
  async getMyStruggles(scheduleId: string): Promise<{ struggles: string[] }> {
    const response = await apiService.get<APIResponse<{ struggles: string[] }>>(
      `/curriculum-units/schedule/${scheduleId}/my-struggles`
    );
    return response.data.data!;
  },

  /**
   * Get recommended review topics
   */
  async getMyReviewRecommendations(scheduleId: string): Promise<{ reviewTopics: string[] }> {
    const response = await apiService.get<APIResponse<{ reviewTopics: string[] }>>(
      `/curriculum-units/schedule/${scheduleId}/my-review`
    );
    return response.data.data!;
  },
};

// Export combined API
export const curriculumApi = {
  schedules: scheduleApi,
  units: unitApi,
  progress: progressApi,
};

export default curriculumApi;
