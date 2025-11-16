// ============================================================================
// UPLOAD SERVICE
// File upload functionality for curriculum materials
// ============================================================================

import { apiService } from './api.service';

export interface UploadedFile {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: UploadedFile;
}

export interface CurriculumStatus {
  id: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedText?: string;
  errorMessage?: string;
}

/**
 * Upload curriculum file
 * @param file - File to upload
 * @param onProgress - Progress callback (optional)
 * @returns Uploaded file metadata
 */
export async function uploadCurriculumFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiService.post<UploadResponse>(
    '/upload/curriculum',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }
  );

  return response.data.data;
}

/**
 * Download curriculum file
 * @param fileId - File ID to download
 * @returns File blob
 */
export async function downloadCurriculumFile(fileId: string): Promise<Blob> {
  const response = await apiService.get<Blob>(
    `/upload/curriculum/${fileId}`,
    {
      responseType: 'blob',
    }
  );

  return response.data;
}

/**
 * Get curriculum file processing status
 * @param fileId - File ID to check
 * @returns Processing status
 */
export async function getCurriculumStatus(fileId: string): Promise<CurriculumStatus> {
  const response = await apiService.get<{ success: boolean; data: CurriculumStatus }>(
    `/curriculum/${fileId}/status`
  );

  return response.data.data;
}

export const uploadService = {
  uploadCurriculumFile,
  downloadCurriculumFile,
  getCurriculumStatus,
};

export default uploadService;
