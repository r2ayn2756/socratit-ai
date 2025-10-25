// ============================================================================
// ANALYTICS CONTROLLER
// Handles analytics, insights, and performance data endpoints
// ============================================================================

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, UserPayload } from '../types';
import {
  calculateClassAnalytics,
} from '../services/analytics.service';

const prisma = new PrismaClient();

// ============================================================================
// GET STUDENT CONCEPT MASTERY
// GET /api/v1/analytics/student/:studentId/concepts
// ============================================================================

export async function getStudentConceptMastery(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId } = req.query;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own concept mastery',
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

    const concepts = await prisma.conceptMastery.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        masteryPercent: 'asc', // Show weakest concepts first
      },
    });

    res.status(200).json({
      success: true,
      data: concepts,
    });
  } catch (error: any) {
    console.error('Error fetching concept mastery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concept mastery',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET STUDENT INSIGHTS
// GET /api/v1/analytics/student/:studentId/insights
// ============================================================================

export async function getStudentInsights(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId } = req.query;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own insights',
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

    const insights = await prisma.studentInsight.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('Error fetching student insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET STRUGGLING STUDENTS IN CLASS
// GET /api/v1/analytics/class/:classId/struggling-students
// ============================================================================

export async function getStrugglingStudents(
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

    const strugglingStudents = await prisma.studentInsight.findMany({
      where: {
        classId,
        schoolId: user.schoolId,
        isStruggling: true,
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
        interventionLevel: 'desc', // Critical first
      },
    });

    res.status(200).json({
      success: true,
      data: strugglingStudents,
    });
  } catch (error: any) {
    console.error('Error fetching struggling students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch struggling students',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET CLASS ANALYTICS OVERVIEW
// GET /api/v1/analytics/class/:classId/overview
// ============================================================================

export async function getClassOverview(
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

    // Get all insights
    const insights = await prisma.studentInsight.findMany({
      where: {
        classId,
        schoolId: user.schoolId,
      },
    });

    // Calculate summary statistics
    const totalStudents = insights.length;
    const strugglingCount = insights.filter((i) => i.isStruggling).length;
    const avgCompletionRate =
      insights.reduce((sum, i) => sum + (i.completionRate || 0), 0) / (totalStudents || 1);
    const avgScore = insights.reduce((sum, i) => sum + (i.averageScore || 0), 0) / (totalStudents || 1);

    // Get intervention level distribution
    const interventionLevels = {
      LOW: insights.filter((i) => i.interventionLevel === 'LOW').length,
      MEDIUM: insights.filter((i) => i.interventionLevel === 'MEDIUM').length,
      HIGH: insights.filter((i) => i.interventionLevel === 'HIGH').length,
      CRITICAL: insights.filter((i) => i.interventionLevel === 'CRITICAL').length,
    };

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        strugglingCount,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        avgScore: Math.round(avgScore * 100) / 100,
        interventionLevels,
      },
    });
  } catch (error: any) {
    console.error('Error fetching class overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class overview',
      errors: [error.message],
    });
  }
}

// ============================================================================
// RECALCULATE ANALYTICS
// POST /api/v1/analytics/class/:classId/recalculate
// ============================================================================

export async function recalculateClassAnalytics(
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

    // Recalculate analytics for entire class
    await calculateClassAnalytics(classId, user.schoolId);

    res.status(200).json({
      success: true,
      message: 'Analytics recalculated successfully',
    });
  } catch (error: any) {
    console.error('Error recalculating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate analytics',
      errors: [error.message],
    });
  }
}
