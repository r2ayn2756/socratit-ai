// ============================================================================
// CURRICULUM SERVICE
// API service for curriculum file upload and management operations
// ============================================================================

import { apiService } from './api.service';

// ============================================================================
// TYPES
// ============================================================================

export interface CurriculumMaterial {
  id: string;
  teacherId: string;
  schoolId: string;
  title: string;
  description?: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  mimeType?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  textExtractionError?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  aiSummary?: string;
  aiOutline?: {
    topics: Array<{
      name: string;
      subtopics: string[];
    }>;
  };
  suggestedTopics: string[];
  learningObjectives: string[];
  usageCount: number;
  lastUsedAt?: string;
  expiresAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  assignments?: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

export interface UploadCurriculumRequest {
  title: string;
  description?: string;
  file: File;
}

export interface UploadCurriculumResponse {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
  createdAt: string;
}

export interface ProcessingStatus {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  hasExtractedText: boolean;
  error?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
}

export interface ListCurriculumParams {
  page?: number;
  limit?: number;
  fileType?: string;
  processingStatus?: string;
  isArchived?: boolean;
  sortBy?: 'createdAt' | 'lastUsedAt' | 'usageCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ListCurriculumResponse {
  materials: CurriculumMaterial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateCurriculumRequest {
  title?: string;
  description?: string;
  aiSummary?: string;
  aiOutline?: any;
  isArchived?: boolean;
}

export interface GenerateAssignmentRequest {
  title: string;
  description?: string;
  classId: string;
  numQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: Array<'multiple_choice' | 'free_response'>;
  type?: 'PRACTICE' | 'TEST';
  totalPoints?: number;
  dueDate?: string;
  timeLimit?: number;
}

export interface GenerateAssignmentResponse {
  assignment: {
    id: string;
    title: string;
    description?: string;
    totalPoints: number;
    status: string;
  };
  questions: Array<{
    id: string;
    type: string;
    questionText: string;
    points: number;
    questionOrder: number;
  }>;
}

// ============================================================================
// API SERVICE METHODS
// ============================================================================

export const curriculumService = {
  /**
   * Upload a curriculum file
   * POST /api/v1/curriculum/upload
   */
  uploadCurriculum: async (data: UploadCurriculumRequest): Promise<UploadCurriculumResponse> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiService.post<{ success: boolean; data: UploadCurriculumResponse }>(
      '/curriculum/upload',
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
   * Get processing status for a curriculum material
   * GET /api/v1/curriculum/:id/status
   */
  getCurriculumStatus: async (id: string): Promise<ProcessingStatus> => {
    const response = await apiService.get<{ success: boolean; data: ProcessingStatus }>(
      `/curriculum/${id}/status`
    );

    return response.data.data;
  },

  /**
   * Manually trigger processing for a curriculum material
   * POST /api/v1/curriculum/:id/process
   */
  triggerProcessing: async (id: string): Promise<{ extractedTextLength: number; processingTime: number }> => {
    const response = await apiService.post<{
      success: boolean;
      data: { extractedTextLength: number; processingTime: number };
    }>(`/curriculum/${id}/process`);

    return response.data.data;
  },

  /**
   * List curriculum materials
   * GET /api/v1/curriculum
   */
  listCurriculum: async (params?: ListCurriculumParams): Promise<ListCurriculumResponse> => {
    const response = await apiService.get<{
      success: boolean;
      data: CurriculumMaterial[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/curriculum', { params });

    return {
      materials: response.data.data,
      pagination: response.data.pagination,
    };
  },

  /**
   * Get a single curriculum material
   * GET /api/v1/curriculum/:id
   */
  getCurriculum: async (id: string): Promise<CurriculumMaterial> => {
    const response = await apiService.get<{ success: boolean; data: CurriculumMaterial }>(`/curriculum/${id}`);

    return response.data.data;
  },

  /**
   * Update curriculum material
   * PUT /api/v1/curriculum/:id
   */
  updateCurriculum: async (id: string, data: UpdateCurriculumRequest): Promise<CurriculumMaterial> => {
    const response = await apiService.put<{ success: boolean; data: CurriculumMaterial }>(
      `/curriculum/${id}`,
      data
    );

    return response.data.data;
  },

  /**
   * Delete curriculum material
   * DELETE /api/v1/curriculum/:id
   */
  deleteCurriculum: async (id: string): Promise<void> => {
    await apiService.delete(`/curriculum/${id}`);
  },

  /**
   * Download curriculum file
   * GET /api/v1/curriculum/:id/download
   */
  downloadCurriculum: async (id: string, fileName: string): Promise<void> => {
    const response = await apiService.get(`/curriculum/${id}/download`, {
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Generate assignment from curriculum
   * POST /api/v1/curriculum/:id/generate-assignment
   */
  generateAssignment: async (id: string, data: GenerateAssignmentRequest): Promise<GenerateAssignmentResponse> => {
    const response = await apiService.post<{ success: boolean; data: GenerateAssignmentResponse }>(
      `/curriculum/${id}/generate-assignment`,
      data
    );

    return response.data.data;
  },
};
