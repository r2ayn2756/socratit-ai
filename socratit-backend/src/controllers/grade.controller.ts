// ============================================================================
// GRADE CONTROLLER
// Handles grade retrieval, category management, and grade calculations
// ============================================================================

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, UserPayload } from '../types';
import {
  calculateStudentGrade,
  saveStudentGrades,
  applyCurveToClass,
  getGradeDistribution,
} from '../services/grade.service';
import { createAuditLog } from '../utils/audit';

const prisma = new PrismaClient();

// ============================================================================
// GET STUDENT'S GRADES FOR A CLASS
// GET /api/v1/grades/student/:studentId/class/:classId
// ============================================================================

export async function getStudentClassGrades(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId, classId } = req.params;

    // Security: Students can only view their own grades
    // Teachers can view grades for students in their classes
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own grades',
      });
      return;
    }

    if (user.role === 'TEACHER') {
      // Verify teacher teaches this class
      const classTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!classTeacher) {
        res.status(403).json({
          success: false,
          message: 'You do not teach this class',
        });
        return;
      }
    }

    // Verify student is enrolled in the class
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        studentId,
        classId,
        status: 'APPROVED',
      },
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Student is not enrolled in this class',
      });
      return;
    }

    // Get all grades for this student in this class
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        classId,
        schoolId: user.schoolId,
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            dueDate: true,
          },
        },
      },
      orderBy: [{ gradeType: 'asc' }, { gradeDate: 'desc' }],
    });

    // Calculate current grades
    const currentGrades = await calculateStudentGrade(
      studentId,
      classId,
      user.schoolId
    );

    res.status(200).json({
      success: true,
      data: {
        grades,
        current: currentGrades,
      },
    });
  } catch (error: any) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET ALL STUDENTS' GRADES IN A CLASS (Teacher Only)
// GET /api/v1/grades/class/:classId
// ============================================================================

export async function getClassGrades(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    // Verify teacher teaches this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Get all enrolled students
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'APPROVED',
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get overall grades for all students
    const studentGrades = await Promise.all(
      enrollments.map(async (enrollment) => {
        const overallGrade = await prisma.grade.findFirst({
          where: {
            studentId: enrollment.studentId,
            classId,
            gradeType: 'overall',
          },
        });

        const categoryGrades = await prisma.grade.findMany({
          where: {
            studentId: enrollment.studentId,
            classId,
            gradeType: 'category',
          },
          orderBy: {
            categoryName: 'asc',
          },
        });

        return {
          student: enrollment.student,
          overallGrade,
          categoryGrades,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentGrades,
    });
  } catch (error: any) {
    console.error('Error fetching class grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class grades',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET STUDENT'S GRADES ACROSS ALL CLASSES
// GET /api/v1/grades/student/:studentId
// ============================================================================

export async function getStudentAllGrades(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;

    // Security: Students can only view their own grades
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own grades',
      });
      return;
    }

    // Get all overall grades for this student
    const overallGrades = await prisma.grade.findMany({
      where: {
        studentId,
        schoolId: user.schoolId,
        gradeType: 'overall',
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            academicYear: true,
            color: true,
          },
        },
      },
      orderBy: {
        gradeDate: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: overallGrades,
    });
  } catch (error: any) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      errors: [error.message],
    });
  }
}

// ============================================================================
// CREATE/UPDATE GRADE CATEGORIES FOR A CLASS
// POST /api/v1/grades/categories
// ============================================================================

export async function saveGradeCategories(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId, categories } = req.body;

    // Verify teacher teaches this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Delete existing categories
    await prisma.gradeCategory.deleteMany({
      where: {
        classId,
        schoolId: user.schoolId,
      },
    });

    // Create new categories
    const createdCategories = await Promise.all(
      categories.map((category: any, index: number) =>
        prisma.gradeCategory.create({
          data: {
            classId,
            schoolId: user.schoolId,
            name: category.name,
            weight: category.weight,
            dropLowest: category.dropLowest || 0,
            latePenaltyPerDay: category.latePenaltyPerDay,
            maxLatePenalty: category.maxLatePenalty,
            allowExtraCredit: category.allowExtraCredit || false,
            sortOrder: index,
          },
        })
      )
    );

    // Recalculate grades for all students in this class
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'APPROVED',
      },
      select: {
        studentId: true,
      },
    });

    await Promise.all(
      enrollments.map((enrollment) =>
        saveStudentGrades(enrollment.studentId, classId, user.schoolId)
      )
    );

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'UPDATE_CLASS',
      resourceType: 'grade_category',
      resourceId: classId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        categoriesCount: categories.length,
      },
    });

    res.status(200).json({
      success: true,
      data: createdCategories,
      message: 'Grade categories saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving grade categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save grade categories',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET GRADE CATEGORIES FOR A CLASS
// GET /api/v1/grades/categories/:classId
// ============================================================================

export async function getGradeCategories(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    // Verify user has access to this class
    if (user.role === 'TEACHER') {
      const classTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!classTeacher) {
        res.status(403).json({
          success: false,
          message: 'You do not teach this class',
        });
        return;
      }
    } else if (user.role === 'STUDENT') {
      const enrollment = await prisma.classEnrollment.findFirst({
        where: {
          classId,
          studentId: user.id,
          status: 'APPROVED',
        },
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class',
        });
        return;
      }
    }

    const categories = await prisma.gradeCategory.findMany({
      where: {
        classId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching grade categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade categories',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET GRADE DISTRIBUTION FOR A CLASS
// GET /api/v1/grades/class/:classId/distribution
// ============================================================================

export async function getClassGradeDistribution(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    // Verify teacher teaches this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    const distribution = await getGradeDistribution(classId, user.schoolId);

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error: any) {
    console.error('Error fetching grade distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade distribution',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET STUDENT'S GRADE HISTORY
// GET /api/v1/grades/student/:studentId/history
// ============================================================================

export async function getStudentGradeHistory(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId, gradeType } = req.query;

    // Security: Students can only view their own grades
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own grades',
      });
      return;
    }

    const whereClause: any = {
      studentId,
      schoolId: user.schoolId,
    };

    if (classId) {
      whereClause.classId = classId as string;
    }

    if (gradeType) {
      whereClause.gradeType = gradeType as string;
    }

    const gradeHistory = await prisma.grade.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        gradeDate: 'desc',
      },
      take: 50, // Limit to last 50 grades
    });

    res.status(200).json({
      success: true,
      data: gradeHistory,
    });
  } catch (error: any) {
    console.error('Error fetching grade history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade history',
      errors: [error.message],
    });
  }
}

// ============================================================================
// APPLY CURVE TO CLASS GRADES
// POST /api/v1/grades/class/:classId/curve
// ============================================================================

export async function applyCurve(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;
    const { curveAmount } = req.body;

    // Verify teacher teaches this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    await applyCurveToClass(classId, user.schoolId, curveAmount);

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'GRADE_ASSIGNMENT',
      resourceType: 'grade',
      resourceId: classId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        curveAmount,
      },
    });

    res.status(200).json({
      success: true,
      message: `Curve of ${curveAmount}% applied to all grades`,
    });
  } catch (error: any) {
    console.error('Error applying curve:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply curve',
      errors: [error.message],
    });
  }
}
