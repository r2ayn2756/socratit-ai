// ============================================================================
// CLASS MANAGEMENT SERVICE
// API functions for class and enrollment management
// ============================================================================

import { apiService } from './api.service';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateClassDTO {
  name: string;
  subject?: string;
  gradeLevel?: string;
  academicYear: string;
  period?: string;
  room?: string;
  scheduleTime?: string;
  color?: 'blue' | 'purple' | 'orange';
  codeExpiresAt?: string;
}

export interface UpdateClassDTO {
  name?: string;
  subject?: string;
  gradeLevel?: string;
  academicYear?: string;
  period?: string;
  room?: string;
  scheduleTime?: string;
  color?: 'blue' | 'purple' | 'orange';
  isActive?: boolean;
  codeExpiresAt?: string | null;
}

export interface EnrollmentStatus {
  status: 'APPROVED' | 'REJECTED' | 'REMOVED';
  rejectionReason?: string;
}

export interface AddStudentsDTO {
  studentEmails: string[];
}

export interface EnrollWithCodeDTO {
  classCode: string;
}

export interface ClassWithStats {
  id: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  academicYear: string;
  period?: string;
  room?: string;
  scheduleTime?: string;
  color: string;
  classCode: string;
  codeExpiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teachers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isPrimary: boolean;
  }>;
  enrollmentCounts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    removed: number;
  };
}

export interface Enrollment {
  id: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gradeLevel?: string;
  };
  class?: {
    id: string;
    name: string;
    subject?: string;
    period?: string;
    room?: string;
    color?: string;
    scheduleTime?: string;
    academicYear: string;
    teachers: Array<{
      id: string;
      firstName: string;
      lastName: string;
      isPrimary?: boolean;
    }>;
  };
  processor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ============================================================================
// CLASS SERVICE
// ============================================================================

export const classService = {
  // ============================================================================
  // TEACHER ENDPOINTS
  // ============================================================================

  /**
   * Create a new class
   */
  createClass: async (data: CreateClassDTO) => {
    const response = await apiService.post('/classes', data);
    return response.data;
  },

  /**
   * Get all classes for the current teacher
   */
  getTeacherClasses: async (params?: { academicYear?: string; isActive?: boolean }) => {
    const response = await apiService.get<{ success: boolean; data: ClassWithStats[] }>(
      '/classes',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get class details by ID
   */
  getClassById: async (classId: string) => {
    const response = await apiService.get(`/classes/${classId}`);
    return response.data.data;
  },

  /**
   * Update class details
   */
  updateClass: async (classId: string, data: UpdateClassDTO) => {
    const response = await apiService.patch(`/classes/${classId}`, data);
    return response.data;
  },

  /**
   * Delete class (soft delete)
   */
  deleteClass: async (classId: string) => {
    const response = await apiService.delete(`/classes/${classId}`);
    return response.data;
  },

  /**
   * Regenerate class code
   */
  regenerateClassCode: async (classId: string) => {
    const response = await apiService.post(`/classes/${classId}/regenerate-code`);
    return response.data.data;
  },

  // ============================================================================
  // ENROLLMENT MANAGEMENT (TEACHER)
  // ============================================================================

  /**
   * Get class roster (all enrollments)
   */
  getClassEnrollments: async (classId: string, status?: string) => {
    const response = await apiService.get<{ success: boolean; data: Enrollment[] }>(
      `/classes/${classId}/enrollments`,
      { params: status ? { status } : undefined }
    );
    return response.data.data;
  },

  /**
   * Manually add students to class
   */
  addStudentsToClass: async (classId: string, data: AddStudentsDTO) => {
    const response = await apiService.post(`/classes/${classId}/enrollments`, data);
    return response.data;
  },

  /**
   * Approve, reject, or remove a student enrollment
   */
  processEnrollment: async (classId: string, enrollmentId: string, data: EnrollmentStatus) => {
    const response = await apiService.patch(
      `/classes/${classId}/enrollments/${enrollmentId}`,
      data
    );
    return response.data;
  },

  /**
   * Remove student from class
   */
  removeStudent: async (classId: string, enrollmentId: string) => {
    const response = await apiService.delete(`/classes/${classId}/enrollments/${enrollmentId}`);
    return response.data;
  },

  // ============================================================================
  // STUDENT ENDPOINTS
  // ============================================================================

  /**
   * Enroll in a class with class code
   */
  enrollWithCode: async (data: EnrollWithCodeDTO) => {
    const response = await apiService.post('/enrollments', data);
    return response.data;
  },

  /**
   * Get all enrollments for current student
   */
  getStudentEnrollments: async (params?: { status?: string; academicYear?: string }) => {
    const response = await apiService.get<{ success: boolean; data: Enrollment[] }>(
      '/enrollments',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get enrollment details
   */
  getEnrollmentById: async (enrollmentId: string) => {
    const response = await apiService.get(`/enrollments/${enrollmentId}`);
    return response.data.data;
  },
};

export default classService;
