// ============================================================================
// LESSON SERVICE
// API integration for class lesson management
// ============================================================================

import { apiService } from './api.service';
import type { ClassLesson, CreateLessonDTO, UpdateLessonDTO, LessonContext } from '../types/lesson.types';

export const lessonService = {
  /**
   * Create a new lesson with audio recording
   */
  createLesson: async (classId: string, data: CreateLessonDTO): Promise<ClassLesson> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('lessonDate', data.lessonDate);
    formData.append('audio', data.audioFile);
    if (data.durationSeconds) {
      formData.append('durationSeconds', data.durationSeconds.toString());
    }

    const response = await apiService.post<{ success: boolean; data: ClassLesson }>(
      `/classes/${classId}/lessons`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Get all lessons for a class
   */
  getClassLessons: async (
    classId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ClassLesson[]> => {
    const response = await apiService.get<{ success: boolean; data: ClassLesson[] }>(
      `/classes/${classId}/lessons`,
      { params: options }
    );
    return response.data.data;
  },

  /**
   * Get aggregated context from all lessons (teachers only)
   */
  getClassLessonContext: async (classId: string): Promise<LessonContext> => {
    const response = await apiService.get<{ success: boolean; data: LessonContext }>(
      `/classes/${classId}/lessons/context`
    );
    return response.data.data;
  },

  /**
   * Get a single lesson by ID
   */
  getLessonById: async (lessonId: string): Promise<ClassLesson> => {
    const response = await apiService.get<{ success: boolean; data: ClassLesson }>(
      `/lessons/${lessonId}`
    );
    return response.data.data;
  },

  /**
   * Update a lesson
   */
  updateLesson: async (lessonId: string, data: UpdateLessonDTO): Promise<ClassLesson> => {
    const response = await apiService.patch<{ success: boolean; data: ClassLesson }>(
      `/lessons/${lessonId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete a lesson
   */
  deleteLesson: async (lessonId: string): Promise<void> => {
    await apiService.delete(`/lessons/${lessonId}`);
  },
};

export default lessonService;
