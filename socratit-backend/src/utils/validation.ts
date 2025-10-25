// ============================================================================
// VALIDATION UTILITIES
// Business logic validation functions
// ============================================================================

import { prisma } from '../config/database';

/**
 * Validate class code format
 * Expected format: XXX-YYYY (3 letters, hyphen, 4 numbers)
 * @param code - Class code to validate
 * @returns true if valid format
 */
export const isValidClassCodeFormat = (code: string): boolean => {
  const regex = /^[A-Z]{3}-[0-9]{4}$/;
  return regex.test(code);
};

/**
 * Check if class code exists and is valid (not expired, active)
 * @param code - Class code to check
 * @returns Object with validation result and class data (if valid)
 */
export const validateClassCode = async (
  code: string
): Promise<{
  isValid: boolean;
  class?: any;
  reason?: string;
}> => {
  // Check format
  if (!isValidClassCodeFormat(code)) {
    return {
      isValid: false,
      reason: 'Invalid class code format. Expected format: XXX-1234',
    };
  }

  // Find class
  const classData = await prisma.class.findUnique({
    where: { classCode: code, deletedAt: null },
    include: {
      school: true,
      teachers: {
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!classData) {
    return {
      isValid: false,
      reason: 'Class code not found',
    };
  }

  // Check if class is active
  if (!classData.isActive) {
    return {
      isValid: false,
      reason: 'This class is no longer active',
    };
  }

  // Check if code is expired
  if (classData.codeExpiresAt && classData.codeExpiresAt < new Date()) {
    return {
      isValid: false,
      reason: 'This class code has expired',
    };
  }

  return {
    isValid: true,
    class: classData,
  };
};

/**
 * Check if a user is a teacher of a specific class
 * @param userId - User ID to check
 * @param classId - Class ID to check
 * @returns true if user is a teacher of the class
 */
export const isClassTeacher = async (
  userId: string,
  classId: string
): Promise<boolean> => {
  const classTeacher = await prisma.classTeacher.findFirst({
    where: {
      classId,
      teacherId: userId,
    },
  });

  return !!classTeacher;
};

/**
 * Check if a student is enrolled in a class with approved status
 * @param studentId - Student ID to check
 * @param classId - Class ID to check
 * @returns true if student is enrolled with APPROVED status
 */
export const isStudentEnrolled = async (
  studentId: string,
  classId: string
): Promise<boolean> => {
  const enrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId,
      classId,
      status: 'APPROVED',
    },
  });

  return !!enrollment;
};
