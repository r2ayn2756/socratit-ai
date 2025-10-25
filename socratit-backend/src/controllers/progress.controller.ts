// ============================================================================
// PROGRESS CONTROLLER
// Handles student progress, assignment progress, and learning velocity endpoints
// ============================================================================

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, UserPayload } from '../types';
import {
  calculateStudentProgress,
  updateAssignmentTimeSpent,
  getStudentProgressAcrossClasses as getProgressAcrossClasses,
  getClassProgressOverview,
} from '../services/progress.service';

const prisma = new PrismaClient();

// ============================================================================
// GET STUDENT PROGRESS FOR A CLASS
// GET /api/v1/progress/student/:studentId/class/:classId
// ============================================================================

export async function getStudentProgress(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId, classId } = req.params;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own progress',
      });
      return;
    }

    // Teacher check - must be teaching this class
    if (user.role === 'TEACHER') {
      const isTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only view progress for your own classes',
        });
        return;
      }
    }

    const progress = await prisma.studentProgress.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
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
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            gradeLevel: true,
          },
        },
      },
    });

    if (!progress) {
      res.status(404).json({
        success: false,
        message: 'Progress not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET STUDENT PROGRESS ACROSS ALL CLASSES
// GET /api/v1/progress/student/:studentId/classes
// ============================================================================

export async function getStudentProgressAcrossClasses(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own progress',
      });
      return;
    }

    const progressRecords = await getProgressAcrossClasses(studentId);

    res.status(200).json({
      success: true,
      data: progressRecords,
    });
  } catch (error: any) {
    console.error('Error fetching student progress across classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CLASS PROGRESS OVERVIEW
// GET /api/v1/progress/class/:classId/students
// ============================================================================

export async function getClassProgress(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    // Only teachers and admins can view class progress
    if (user.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can view class progress',
      });
      return;
    }

    // Teacher check
    if (user.role === 'TEACHER') {
      const isTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only view progress for your own classes',
        });
        return;
      }
    }

    const progressRecords = await getClassProgressOverview(classId, user.schoolId);

    res.status(200).json({
      success: true,
      data: progressRecords,
    });
  } catch (error: any) {
    console.error('Error fetching class progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// CALCULATE STUDENT PROGRESS
// POST /api/v1/progress/calculate/:studentId/:classId
// ============================================================================

export async function calculateProgress(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId, classId } = req.params;

    // Teacher check
    if (user.role === 'TEACHER') {
      const isTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only calculate progress for your own classes',
        });
        return;
      }
    }

    const progress = await calculateStudentProgress(
      studentId,
      classId,
      user.schoolId
    );

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Progress calculated successfully',
    });
  } catch (error: any) {
    console.error('Error calculating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET ASSIGNMENT PROGRESS FOR STUDENT
// GET /api/v1/progress/assignments/:studentId
// ============================================================================

export async function getAssignmentProgressForStudent(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId, status } = req.query;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own assignment progress',
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

    if (status) {
      whereClause.status = status as string;
    }

    const progressRecords = await prisma.assignmentProgress.findMany({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            dueDate: true,
            totalPoints: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: progressRecords,
    });
  } catch (error: any) {
    console.error('Error fetching assignment progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET ASSIGNMENT PROGRESS
// GET /api/v1/progress/assignment/:assignmentId/student/:studentId
// ============================================================================

export async function getAssignmentProgress(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId, studentId } = req.params;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own assignment progress',
      });
      return;
    }

    const progress = await prisma.assignmentProgress.findUnique({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId,
        },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            dueDate: true,
            totalPoints: true,
          },
        },
      },
    });

    if (!progress) {
      res.status(404).json({
        success: false,
        message: 'Assignment progress not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error fetching assignment progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET ASSIGNMENT PROGRESS FOR CLASS
// GET /api/v1/progress/assignment/:assignmentId/students
// ============================================================================

export async function getAssignmentProgressForClass(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;

    // Only teachers can view this
    if (user.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can view class assignment progress',
      });
      return;
    }

    // Get assignment to check if teacher owns it
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            teachers: true,
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    // Check if user is teaching this class
    if (user.role === 'TEACHER') {
      const isTeacher = assignment.class.teachers.some(
        (t) => t.teacherId === user.id
      );

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only view progress for your own assignments',
        });
        return;
      }
    }

    const progressRecords = await prisma.assignmentProgress.findMany({
      where: {
        assignmentId,
        schoolId: user.schoolId,
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
      orderBy: {
        progressPercentage: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: progressRecords,
    });
  } catch (error: any) {
    console.error('Error fetching assignment progress for class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// UPDATE TIME SPENT ON ASSIGNMENT
// PATCH /api/v1/progress/assignment/:assignmentId/time
// ============================================================================

export async function updateTimeSpent(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;
    const { timeSpentMinutes } = req.body;

    // Only students can update their time
    if (user.role !== 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Only students can update time spent',
      });
      return;
    }

    // Validation
    if (!timeSpentMinutes || timeSpentMinutes < 0 || timeSpentMinutes > 240) {
      res.status(400).json({
        success: false,
        message: 'Invalid time spent value (must be 0-240 minutes)',
      });
      return;
    }

    await updateAssignmentTimeSpent(user.id, assignmentId, timeSpentMinutes);

    res.status(200).json({
      success: true,
      message: 'Time spent updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating time spent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update time spent',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CONCEPT PROGRESS FOR STUDENT
// GET /api/v1/progress/concepts/:studentId/class/:classId
// ============================================================================

export async function getConceptProgress(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId, classId } = req.params;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own concept progress',
      });
      return;
    }

    const concepts = await prisma.conceptMastery.findMany({
      where: {
        studentId,
        classId,
        schoolId: user.schoolId,
      },
      orderBy: {
        masteryPercent: 'asc',
      },
    });

    // Get concept paths for learning recommendations
    const conceptPaths = await prisma.conceptMasteryPath.findMany({
      where: {
        classId,
        schoolId: user.schoolId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        concepts,
        paths: conceptPaths,
      },
    });
  } catch (error: any) {
    console.error('Error fetching concept progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concept progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CONCEPT PROGRESS FOR CLASS
// GET /api/v1/progress/concepts/:conceptName/students/:classId
// ============================================================================

export async function getConceptProgressForClass(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { conceptName, classId } = req.params;

    // Only teachers can view this
    if (user.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can view class concept progress',
      });
      return;
    }

    // Teacher check
    if (user.role === 'TEACHER') {
      const isTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only view progress for your own classes',
        });
        return;
      }
    }

    const concepts = await prisma.conceptMastery.findMany({
      where: {
        classId,
        concept: conceptName,
        schoolId: user.schoolId,
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
      orderBy: {
        masteryPercent: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: concepts,
    });
  } catch (error: any) {
    console.error('Error fetching concept progress for class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concept progress',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CONCEPT PATHS FOR CLASS
// GET /api/v1/progress/concepts/paths/:classId
// ============================================================================

export async function getConceptPathsForClass(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    const paths = await prisma.conceptMasteryPath.findMany({
      where: {
        classId,
        schoolId: user.schoolId,
      },
      include: {
        prerequisite: {
          select: {
            conceptName: true,
            orderIndex: true,
          },
        },
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: paths,
    });
  } catch (error: any) {
    console.error('Error fetching concept paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concept paths',
      errors: [error.message],
    });
  }
}

// ============================================================================
// CREATE CONCEPT PATH
// POST /api/v1/progress/concepts/paths
// ============================================================================

export async function createConceptPath(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId, conceptName, prerequisiteId, orderIndex, difficulty, estimatedHours, description } = req.body;

    // Only teachers can create paths
    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can create concept paths',
      });
      return;
    }

    // Teacher check
    const isTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
    });

    if (!isTeacher) {
      res.status(403).json({
        success: false,
        message: 'You can only create paths for your own classes',
      });
      return;
    }

    const path = await prisma.conceptMasteryPath.create({
      data: {
        classId,
        schoolId: user.schoolId,
        conceptName,
        prerequisiteId: prerequisiteId || null,
        orderIndex,
        difficulty: difficulty || 1,
        estimatedHours,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: path,
      message: 'Concept path created successfully',
    });
  } catch (error: any) {
    console.error('Error creating concept path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create concept path',
      errors: [error.message],
    });
  }
}

// ============================================================================
// UPDATE CONCEPT PATH
// PUT /api/v1/progress/concepts/paths/:pathId
// ============================================================================

export async function updateConceptPath(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { pathId } = req.params;
    const { conceptName, prerequisiteId, orderIndex, difficulty, estimatedHours, description } = req.body;

    // Only teachers can update paths
    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can update concept paths',
      });
      return;
    }

    // Get path to check ownership
    const path = await prisma.conceptMasteryPath.findUnique({
      where: { id: pathId },
      include: {
        class: {
          include: {
            teachers: true,
          },
        },
      },
    });

    if (!path) {
      res.status(404).json({
        success: false,
        message: 'Concept path not found',
      });
      return;
    }

    // Check if user is teaching this class
    const isTeacher = path.class.teachers.some((t) => t.teacherId === user.id);
    if (!isTeacher) {
      res.status(403).json({
        success: false,
        message: 'You can only update paths for your own classes',
      });
      return;
    }

    const updatedPath = await prisma.conceptMasteryPath.update({
      where: { id: pathId },
      data: {
        conceptName,
        prerequisiteId: prerequisiteId || null,
        orderIndex,
        difficulty,
        estimatedHours,
        description,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedPath,
      message: 'Concept path updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating concept path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update concept path',
      errors: [error.message],
    });
  }
}

// ============================================================================
// DELETE CONCEPT PATH
// DELETE /api/v1/progress/concepts/paths/:pathId
// ============================================================================

export async function deleteConceptPath(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { pathId } = req.params;

    // Only teachers can delete paths
    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can delete concept paths',
      });
      return;
    }

    // Get path to check ownership
    const path = await prisma.conceptMasteryPath.findUnique({
      where: { id: pathId },
      include: {
        class: {
          include: {
            teachers: true,
          },
        },
      },
    });

    if (!path) {
      res.status(404).json({
        success: false,
        message: 'Concept path not found',
      });
      return;
    }

    // Check if user is teaching this class
    const isTeacher = path.class.teachers.some((t) => t.teacherId === user.id);
    if (!isTeacher) {
      res.status(403).json({
        success: false,
        message: 'You can only delete paths for your own classes',
      });
      return;
    }

    await prisma.conceptMasteryPath.delete({
      where: { id: pathId },
    });

    res.status(200).json({
      success: true,
      message: 'Concept path deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting concept path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete concept path',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET LEARNING VELOCITY
// GET /api/v1/progress/velocity/:studentId/class/:classId
// ============================================================================

export async function getLearningVelocity(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId, classId } = req.params;
    const { startDate, endDate, limit } = req.query;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own learning velocity',
      });
      return;
    }

    const whereClause: any = {
      studentId,
      classId,
      schoolId: user.schoolId,
    };

    if (startDate && endDate) {
      whereClause.weekStartDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const velocityLogs = await prisma.learningVelocityLog.findMany({
      where: whereClause,
      orderBy: {
        weekStartDate: 'desc',
      },
      take: limit ? parseInt(limit as string) : 12, // Default 12 weeks
    });

    res.status(200).json({
      success: true,
      data: velocityLogs,
    });
  } catch (error: any) {
    console.error('Error fetching learning velocity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning velocity',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CLASS LEARNING VELOCITY
// GET /api/v1/progress/velocity/class/:classId
// ============================================================================

export async function getClassLearningVelocity(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    // Only teachers can view this
    if (user.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can view class learning velocity',
      });
      return;
    }

    // Teacher check
    if (user.role === 'TEACHER') {
      const isTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only view velocity for your own classes',
        });
        return;
      }
    }

    // Get latest velocity for each student
    const students = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'APPROVED',
      },
      select: {
        studentId: true,
      },
    });

    const velocityData = await Promise.all(
      students.map(async (enrollment) => {
        const latestLog = await prisma.learningVelocityLog.findFirst({
          where: {
            studentId: enrollment.studentId,
            classId,
          },
          orderBy: {
            weekStartDate: 'desc',
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

        return latestLog;
      })
    );

    const filteredData = velocityData.filter((log) => log !== null);

    res.status(200).json({
      success: true,
      data: filteredData,
    });
  } catch (error: any) {
    console.error('Error fetching class learning velocity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class learning velocity',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET PROGRESS TRENDS
// GET /api/v1/progress/trends/:studentId/class/:classId
// ============================================================================

export async function getProgressTrends(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId, classId } = req.params;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own progress trends',
      });
      return;
    }

    const progress = await prisma.studentProgress.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    if (!progress) {
      res.status(404).json({
        success: false,
        message: 'Progress not found',
      });
      return;
    }

    // Get historical grade data
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        assignment: {
          classId,
        },
        status: 'GRADED',
      },
      select: {
        percentage: true,
        gradedAt: true,
        assignment: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        gradedAt: 'asc',
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: {
        currentProgress: progress,
        historicalGrades: submissions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching progress trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress trends',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CLASS PROGRESS TRENDS
// GET /api/v1/progress/trends/class/:classId
// ============================================================================

export async function getClassProgressTrends(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;

    // Only teachers can view this
    if (user.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can view class progress trends',
      });
      return;
    }

    // Teacher check
    if (user.role === 'TEACHER') {
      const isTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!isTeacher) {
        res.status(403).json({
          success: false,
          message: 'You can only view trends for your own classes',
        });
        return;
      }
    }

    const progressRecords = await prisma.studentProgress.findMany({
      where: {
        classId,
        schoolId: user.schoolId,
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
      orderBy: {
        averageGrade: 'desc',
      },
    });

    // Calculate class averages
    const classAverages = {
      averageGrade:
        progressRecords.reduce((sum, p) => sum + (p.averageGrade || 0), 0) /
        progressRecords.length,
      averageCompletionRate:
        progressRecords.reduce((sum, p) => sum + p.completionRate, 0) /
        progressRecords.length,
      improvingCount: progressRecords.filter(
        (p) => p.trendDirection === 'IMPROVING'
      ).length,
      decliningCount: progressRecords.filter(
        (p) => p.trendDirection === 'DECLINING'
      ).length,
      stableCount: progressRecords.filter((p) => p.trendDirection === 'STABLE')
        .length,
    };

    res.status(200).json({
      success: true,
      data: {
        students: progressRecords,
        classAverages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching class progress trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class progress trends',
      errors: [error.message],
    });
  }
}
