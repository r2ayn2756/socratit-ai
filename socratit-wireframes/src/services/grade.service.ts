// ============================================================================
// GRADE SERVICE
// API calls for Grading System (Batch 4)
// ============================================================================

import apiClient from './api.service';
import {
  Grade,
  GradeCategory,
  StudentClassGrades,
  GradeDistribution,
  ClassGrades,
} from '../types/grade.types';

// ============================================================================
// STUDENT GRADE ENDPOINTS
// ============================================================================

export const getStudentClassGrades = async (
  studentId: string,
  classId: string
): Promise<StudentClassGrades> => {
  const response = await apiClient.get(`/grades/student/${studentId}/class/${classId}`);
  return response.data.data;
};

export const getStudentAllGrades = async (studentId: string): Promise<Grade[]> => {
  const response = await apiClient.get(`/grades/student/${studentId}`);
  return response.data.data;
};

export const getStudentGradeHistory = async (
  studentId: string,
  classId?: string,
  gradeType?: string
): Promise<Grade[]> => {
  const params: any = {};
  if (classId) params.classId = classId;
  if (gradeType) params.gradeType = gradeType;

  const response = await apiClient.get(`/grades/student/${studentId}/history`, { params });
  return response.data.data;
};

// ============================================================================
// CLASS GRADE ENDPOINTS (Teacher Only)
// ============================================================================

export const getClassGrades = async (classId: string): Promise<ClassGrades[]> => {
  const response = await apiClient.get(`/grades/class/${classId}`);
  return response.data.data;
};

export const getGradeDistribution = async (classId: string): Promise<GradeDistribution> => {
  const response = await apiClient.get(`/grades/class/${classId}/distribution`);
  return response.data.data;
};

// ============================================================================
// GRADE CATEGORY ENDPOINTS
// ============================================================================

export const getGradeCategories = async (classId: string): Promise<GradeCategory[]> => {
  const response = await apiClient.get(`/grades/categories/${classId}`);
  return response.data.data;
};

export const saveGradeCategories = async (
  classId: string,
  categories: Omit<GradeCategory, 'id' | 'classId' | 'schoolId' | 'createdAt' | 'updatedAt'>[]
): Promise<GradeCategory[]> => {
  const response = await apiClient.post('/grades/categories', {
    classId,
    categories,
  });
  return response.data.data;
};

// ============================================================================
// GRADE ADJUSTMENT ENDPOINTS (Teacher Only)
// ============================================================================

export const applyCurve = async (classId: string, curveAmount: number): Promise<void> => {
  await apiClient.post(`/grades/class/${classId}/curve`, {
    curveAmount,
  });
};

// ============================================================================
// EXPORT
// ============================================================================

const gradeService = {
  getStudentClassGrades,
  getStudentAllGrades,
  getStudentGradeHistory,
  getClassGrades,
  getGradeDistribution,
  getGradeCategories,
  saveGradeCategories,
  applyCurve,
};

export default gradeService;
