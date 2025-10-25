// ============================================================================
// CLASS ACCESS MIDDLEWARE
// Verify that a student has access to a class (enrolled with APPROVED status)
// OR that a teacher teaches the class
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { isClassTeacher, isStudentEnrolled } from '../utils/validation';

/**
 * Middleware to verify that the current user has access to the class
 * - Teachers: Must teach the class
 * - Students: Must be enrolled with APPROVED status
 * Expects: req.user (from requireAuth middleware)
 * Expects: req.params.classId
 */
export const requireClassAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const classId = req.params.classId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!classId) {
      throw new AppError('Class ID is required', 400);
    }

    // Check if class exists
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: req.user!.schoolId, // Multi-tenancy check
        deletedAt: null,
      },
      include: {
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
      throw new AppError('Class not found', 404);
    }

    let hasAccess = false;

    if (userRole === 'TEACHER') {
      // Teachers must teach this class
      hasAccess = await isClassTeacher(userId, classId);
    } else if (userRole === 'STUDENT') {
      // Students must be enrolled with APPROVED status
      hasAccess = await isStudentEnrolled(userId, classId);
    }

    if (!hasAccess) {
      throw new AppError('You do not have access to this class', 403);
    }

    // Attach class data to request
    req.class = classData;

    next();
  } catch (error) {
    next(error);
  }
};
