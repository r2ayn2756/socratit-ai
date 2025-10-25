// ============================================================================
// CLASS OWNERSHIP MIDDLEWARE
// Verify that a teacher owns/teaches a specific class
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { isClassTeacher } from '../utils/validation';

/**
 * Middleware to verify that the current user is a teacher of the class
 * Expects: req.user (from requireAuth middleware)
 * Expects: req.params.classId
 */
export const requireClassTeacher = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const classId = req.params.classId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!classId) {
      throw new AppError('Class ID is required', 400);
    }

    // Check if class exists and user has access to it
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: req.user!.schoolId, // Multi-tenancy check
        deletedAt: null,
      },
    });

    if (!classData) {
      throw new AppError('Class not found', 404);
    }

    // Check if user is a teacher of this class
    const isTeacher = await isClassTeacher(userId, classId);

    if (!isTeacher) {
      throw new AppError('You do not have permission to access this class', 403);
    }

    // Attach class data to request for use in controller
    req.class = classData;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify that the current user owns the enrollment
 * (either as the student or as a teacher of the class)
 * Expects: req.user (from requireAuth middleware)
 * Expects: req.params.enrollmentId
 */
export const requireEnrollmentAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const enrollmentId = req.params.enrollmentId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!enrollmentId) {
      throw new AppError('Enrollment ID is required', 400);
    }

    // Find enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
      },
      include: {
        class: true,
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Multi-tenancy check
    if (enrollment.class.schoolId !== req.user!.schoolId) {
      throw new AppError('Access denied', 403);
    }

    // Check if user is the student OR a teacher of the class
    const isStudent = enrollment.studentId === userId;
    const isTeacher = await isClassTeacher(userId, enrollment.classId);

    if (!isStudent && !isTeacher) {
      throw new AppError('You do not have permission to access this enrollment', 403);
    }

    // Attach enrollment to request
    req.enrollment = enrollment;

    next();
  } catch (error) {
    next(error);
  }
};
