// ============================================================================
// CLASS CONTROLLER
// Handles all class management endpoints for teachers
// ============================================================================

import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse, CreateClassRequestBody, UpdateClassRequestBody } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateClassCode } from '../utils/token';
import { logAudit } from '../services/audit.service';

/**
 * @route   POST /api/v1/classes
 * @desc    Create a new class
 * @access  Teacher only
 */
export const createClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const body = req.body as CreateClassRequestBody;

    // Generate unique class code
    let classCode = generateClassCode();
    let isUnique = false;
    let attempts = 0;

    // Retry up to 5 times if code already exists
    while (!isUnique && attempts < 5) {
      const existing = await prisma.class.findUnique({
        where: { classCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        classCode = generateClassCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new AppError('Failed to generate unique class code. Please try again.', 500);
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name: body.name,
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        academicYear: body.academicYear,
        period: body.period,
        room: body.room,
        scheduleTime: body.scheduleTime,
        color: body.color || 'blue',
        classCode,
        codeExpiresAt: body.codeExpiresAt,
        schoolId,
        isActive: true,
      },
    });

    // Add current teacher as primary teacher
    await prisma.classTeacher.create({
      data: {
        classId: newClass.id,
        teacherId: userId,
        isPrimary: true,
      },
    });

    // Create curriculum schedule if data provided
    let scheduleId: string | undefined;
    if (body.curriculumMaterialId && body.schoolYearStart && body.schoolYearEnd) {
      const schoolYearStart = new Date(body.schoolYearStart);
      const schoolYearEnd = new Date(body.schoolYearEnd);

      // Calculate weeks and days
      const diffTime = Math.abs(schoolYearEnd.getTime() - schoolYearStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.ceil(diffDays / 7);

      // Create schedule in DRAFT status (AI will generate units)
      const schedule = await prisma.curriculumSchedule.create({
        data: {
          classId: newClass.id,
          teacherId: userId,
          schoolId,
          curriculumMaterialId: body.curriculumMaterialId,
          schoolYearStart,
          schoolYearEnd,
          totalWeeks,
          totalDays: diffDays,
          meetingPattern: body.meetingPattern || 'daily',
          title: `${body.name} - Curriculum Schedule`,
          status: body.generateWithAI ? 'DRAFT' : 'PUBLISHED',
          totalUnits: body.aiPreferences?.targetUnits || 0,
          aiGenerated: false, // Will be set to true after AI generation
        },
      });

      scheduleId = schedule.id;

      // Note: AI generation will be triggered by frontend calling separate endpoint
      // POST /api/curriculum-schedules/:scheduleId/generate-ai
    }

    // Log audit event
    await logAudit({
      userId,
      schoolId,
      action: 'CREATE_CLASS',
      resourceType: 'class',
      resourceId: newClass.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        className: newClass.name,
        classCode: newClass.classCode,
      },
    });

    // Fetch complete class data with teachers
    const classWithTeachers = await prisma.class.findUnique({
      where: { id: newClass.id },
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

    const response: ApiResponse = {
      success: true,
      data: {
        ...classWithTeachers,
        scheduleId, // Include schedule ID if curriculum was added
      },
      message: 'Class created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   GET /api/v1/classes
 * @desc    Get all classes for the current teacher
 * @access  Teacher only
 */
export const getTeacherClasses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const { academicYear, isActive } = req.query;

    // Build filter
    const filter: any = {
      teachers: {
        some: {
          teacherId: userId,
        },
      },
      schoolId,
      deletedAt: null,
    };

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Fetch classes
    const classes = await prisma.class.findMany({
      where: filter,
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
        enrollments: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add enrollment counts to each class
    const classesWithStats = classes.map((cls) => {
      const enrollmentCounts = {
        total: cls.enrollments.length,
        pending: cls.enrollments.filter((e) => e.status === 'PENDING').length,
        approved: cls.enrollments.filter((e) => e.status === 'APPROVED').length,
        rejected: cls.enrollments.filter((e) => e.status === 'REJECTED').length,
        removed: cls.enrollments.filter((e) => e.status === 'REMOVED').length,
      };

      // Remove enrollments array and add counts
      const { enrollments, ...classData } = cls;

      return {
        ...classData,
        teachers: cls.teachers.map((ct) => ({
          ...ct.teacher,
          isPrimary: ct.isPrimary,
        })),
        enrollmentCounts,
      };
    });

    const response: ApiResponse = {
      success: true,
      data: classesWithStats,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   GET /api/v1/classes/:classId
 * @desc    Get class details
 * @access  Teacher (must teach class) or Student (must be enrolled)
 */
export const getClassById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Class data is attached by middleware
    const classData = req.class;

    // Fetch complete class data
    const fullClass = await prisma.class.findUnique({
      where: { id: classData.id },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        enrollments: {
          where: {
            status: 'APPROVED',
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                gradeLevel: true,
              },
            },
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: fullClass,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   PATCH /api/v1/classes/:classId
 * @desc    Update class details
 * @access  Teacher (must teach class)
 */
export const updateClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const classData = req.class;
    const body = req.body as UpdateClassRequestBody;

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: classData.id },
      data: {
        name: body.name,
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        academicYear: body.academicYear,
        period: body.period,
        room: body.room,
        scheduleTime: body.scheduleTime,
        color: body.color,
        isActive: body.isActive,
        codeExpiresAt: body.codeExpiresAt,
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

    // Log audit event
    await logAudit({
      userId,
      schoolId,
      action: 'UPDATE_CLASS',
      resourceType: 'class',
      resourceId: classData.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        className: updatedClass.name,
        updates: body,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedClass,
      message: 'Class updated successfully',
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   DELETE /api/v1/classes/:classId
 * @desc    Soft delete a class
 * @access  Teacher (must teach class)
 */
export const deleteClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const classData = req.class;

    // Soft delete
    await prisma.class.update({
      where: { id: classData.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Log audit event
    await logAudit({
      userId,
      schoolId,
      action: 'DELETE_CLASS',
      resourceType: 'class',
      resourceId: classData.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        className: classData.name,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Class deleted successfully',
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   POST /api/v1/classes/:classId/regenerate-code
 * @desc    Regenerate class code
 * @access  Teacher (must teach class)
 */
export const regenerateClassCode = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const classData = req.class;

    // Generate new unique class code
    let classCode = generateClassCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await prisma.class.findUnique({
        where: { classCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        classCode = generateClassCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new AppError('Failed to generate unique class code. Please try again.', 500);
    }

    // Update class with new code
    const updatedClass = await prisma.class.update({
      where: { id: classData.id },
      data: { classCode },
    });

    // Log audit event
    await logAudit({
      userId,
      schoolId,
      action: 'GENERATE_CLASS_CODE',
      resourceType: 'class',
      resourceId: classData.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        className: classData.name,
        oldCode: classData.classCode,
        newCode: classCode,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        classCode: updatedClass.classCode,
      },
      message: 'Class code regenerated successfully',
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};
