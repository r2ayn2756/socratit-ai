// ============================================================================
// EXTENDED ANALYTICS CONTROLLER
// New Batch 7 endpoints for advanced analytics
// ============================================================================

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, UserPayload } from '../types';
import {
  generatePerformanceTimeline,
  generateConceptComparison,
  generateAssignmentBreakdown,
  calculatePerformanceDistribution,
  generateConceptMasteryHeatmap,
  calculateEngagementMetrics,
  getAssignmentPerformance,
  generateAIRecommendations,
  trackAnalyticsEvent,
  getStudentEvents,
  compareClassToSchool,
  calculateStudentMetrics,
} from '../services/analytics.service';
import { getCachedAnalytics, setCachedAnalytics } from '../utils/analyticsCache';
import { exportClassGradesCSV, exportStudentReportJSON } from '../utils/exportUtils';

const prisma = new PrismaClient();

// ============================================================================
// STUDENT PERFORMANCE TIMELINE
// GET /api/v1/analytics/student/:studentId/performance-timeline
// ============================================================================

export async function getPerformanceTimeline(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId, startDate, endDate, granularity } = req.query;

    // Security check
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own performance timeline',
      });
      return;
    }

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'classId is required',
      });
      return;
    }

    // Default dates if not provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const gran = (granularity as 'daily' | 'weekly' | 'monthly') || 'weekly';

    // Check cache
    const cacheKey = `${studentId}:${classId}:${start.toISOString()}:${end.toISOString()}:${gran}`;
    const cached = await getCachedAnalytics('STUDENT_TIMELINE', cacheKey);
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    const timeline = await generatePerformanceTimeline(
      studentId,
      classId as string,
      user.schoolId,
      start,
      end,
      gran
    );

    // Cache result
    await setCachedAnalytics('STUDENT_TIMELINE', timeline, cacheKey);

    res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    console.error('Error fetching performance timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance timeline',
      errors: [error.message],
    });
  }
}

// ============================================================================
// CONCEPT COMPARISON
// GET /api/v1/analytics/student/:studentId/concept-comparison
// ============================================================================

export async function getConceptComparison(
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
        message: 'You can only view your own concept comparison',
      });
      return;
    }

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'classId is required',
      });
      return;
    }

    const comparison = await generateConceptComparison(
      studentId,
      classId as string,
      user.schoolId
    );

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    console.error('Error fetching concept comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concept comparison',
      errors: [error.message],
    });
  }
}

// ============================================================================
// ASSIGNMENT BREAKDOWN
// GET /api/v1/analytics/student/:studentId/assignment-breakdown
// ============================================================================

export async function getAssignmentBreakdownHandler(
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
        message: 'You can only view your own assignment breakdown',
      });
      return;
    }

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'classId is required',
      });
      return;
    }

    const breakdown = await generateAssignmentBreakdown(
      studentId,
      classId as string,
      user.schoolId
    );

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error: any) {
    console.error('Error fetching assignment breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment breakdown',
      errors: [error.message],
    });
  }
}

// ============================================================================
// PERFORMANCE DISTRIBUTION
// GET /api/v1/analytics/class/:classId/performance-distribution
// ============================================================================

export async function getPerformanceDistribution(
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

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Check cache
    const cached = await getCachedAnalytics('PERFORMANCE_DISTRIBUTION', classId);
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    const distribution = await calculatePerformanceDistribution(classId, user.schoolId);

    // Cache result
    await setCachedAnalytics('PERFORMANCE_DISTRIBUTION', distribution, classId);

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error: any) {
    console.error('Error fetching performance distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance distribution',
      errors: [error.message],
    });
  }
}

// ============================================================================
// CONCEPT MASTERY HEATMAP
// GET /api/v1/analytics/class/:classId/concept-mastery-heatmap
// ============================================================================

export async function getConceptHeatmap(
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

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Check cache
    const cached = await getCachedAnalytics('CONCEPT_HEATMAP', classId);
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    const heatmap = await generateConceptMasteryHeatmap(classId, user.schoolId);

    // Cache result
    await setCachedAnalytics('CONCEPT_HEATMAP', heatmap, classId);

    res.status(200).json({
      success: true,
      data: heatmap,
    });
  } catch (error: any) {
    console.error('Error fetching concept heatmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concept heatmap',
      errors: [error.message],
    });
  }
}

// ============================================================================
// ENGAGEMENT METRICS
// GET /api/v1/analytics/class/:classId/engagement-metrics
// ============================================================================

export async function getEngagementMetricsHandler(
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

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Check cache
    const cached = await getCachedAnalytics('ENGAGEMENT_METRICS', classId);
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    const metrics = await calculateEngagementMetrics(classId, user.schoolId);

    // Cache result
    await setCachedAnalytics('ENGAGEMENT_METRICS', metrics, classId);

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engagement metrics',
      errors: [error.message],
    });
  }
}

// ============================================================================
// ASSIGNMENT PERFORMANCE
// GET /api/v1/analytics/class/:classId/assignment-performance
// ============================================================================

export async function getAssignmentPerformanceHandler(
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

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Check cache
    const cached = await getCachedAnalytics('ASSIGNMENT_PERFORMANCE', classId);
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    const performance = await getAssignmentPerformance(classId, user.schoolId);

    // Cache result
    await setCachedAnalytics('ASSIGNMENT_PERFORMANCE', performance, classId);

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error: any) {
    console.error('Error fetching assignment performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment performance',
      errors: [error.message],
    });
  }
}

// ============================================================================
// CLASS COMPARISON
// GET /api/v1/analytics/class/:classId/compare-classes
// ============================================================================

export async function compareClasses(
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

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    const comparison = await compareClassToSchool(classId, user.schoolId);

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    console.error('Error comparing classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare classes',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GENERATE AI RECOMMENDATIONS
// POST /api/v1/analytics/student/:studentId/generate-recommendations
// ============================================================================

export async function generateRecommendations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId, focus } = req.body;

    // Only teachers can generate recommendations
    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can generate recommendations',
      });
      return;
    }

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'classId is required',
      });
      return;
    }

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

    const recommendations = await generateAIRecommendations(
      studentId,
      classId,
      user.schoolId,
      focus || 'overall'
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      errors: [error.message],
    });
  }
}

// ============================================================================
// UPDATE TEACHER NOTES
// PATCH /api/v1/analytics/insights/:insightId/teacher-notes
// ============================================================================

export async function updateTeacherNotes(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { insightId } = req.params;
    const { teacherNotes, dismissAlert } = req.body;

    // Only teachers can update notes
    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can update teacher notes',
      });
      return;
    }

    // Get the insight to verify permission
    const insight = await prisma.studentInsight.findUnique({
      where: { id: insightId },
      include: {
        class: {
          include: {
            teachers: {
              where: {
                teacherId: user.id,
              },
            },
          },
        },
      },
    });

    if (!insight || insight.class.teachers.length === 0) {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Update insight
    const updated = await prisma.studentInsight.update({
      where: { id: insightId },
      data: {
        teacherNotes: teacherNotes || insight.teacherNotes,
        alertDismissed: dismissAlert !== undefined ? dismissAlert : insight.alertDismissed,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating teacher notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher notes',
      errors: [error.message],
    });
  }
}

// ============================================================================
// TRACK ANALYTICS EVENT
// POST /api/v1/analytics/events
// ============================================================================

export async function trackEvent(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { eventType, eventData, assignmentId, submissionId, questionId } = req.body;

    if (!eventType) {
      res.status(400).json({
        success: false,
        message: 'eventType is required',
      });
      return;
    }

    await trackAnalyticsEvent(
      user.id, // studentId
      user.schoolId,
      eventType,
      eventData,
      assignmentId,
      submissionId,
      questionId,
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error: any) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET STUDENT EVENTS
// GET /api/v1/analytics/events/student/:studentId
// ============================================================================

export async function getStudentEventsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { eventType, assignmentId, startDate, endDate, limit } = req.query;

    // Only teachers can view student events
    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can view student events',
      });
      return;
    }

    const events = await getStudentEvents(studentId, user.schoolId, {
      eventType: eventType as string,
      assignmentId: assignmentId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    console.error('Error fetching student events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student events',
      errors: [error.message],
    });
  }
}

// ============================================================================
// EXPORT CLASS GRADES (CSV)
// GET /api/v1/analytics/export/class/:classId/grades
// ============================================================================

export async function exportClassGrades(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.params;
    const { format } = req.query;

    // Verify teacher teaches this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
    });

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    if (format === 'csv') {
      const csv = await exportClassGradesCSV(classId, user.schoolId);

      const filename = `class_grades_${classId}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Supported: csv',
      });
    }
  } catch (error: any) {
    console.error('Error exporting class grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export class grades',
      errors: [error.message],
    });
  }
}

// ============================================================================
// EXPORT STUDENT REPORT (JSON)
// GET /api/v1/analytics/export/student/:studentId/report
// ============================================================================

export async function exportStudentReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { studentId } = req.params;
    const { classId } = req.query;

    // Students can export their own data, teachers can export their students' data
    if (user.role === 'STUDENT' && user.id !== studentId) {
      res.status(403).json({
        success: false,
        message: 'You can only export your own report',
      });
      return;
    }

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'classId is required',
      });
      return;
    }

    // If teacher, verify they teach this class
    if (user.role === 'TEACHER') {
      const classTeacher = await prisma.classTeacher.findFirst({
        where: {
          classId: classId as string,
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

    const report = await exportStudentReportJSON(
      studentId,
      classId as string,
      user.schoolId
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error exporting student report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export student report',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET COMPREHENSIVE CLASS ANALYTICS (OPTIMIZED FOR CLASS ANALYTICS PAGE)
// GET /api/v1/analytics/class/:classId/comprehensive
// ============================================================================

export async function getComprehensiveClassAnalytics(
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

    if (!classTeacher && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not teach this class',
      });
      return;
    }

    // Check Redis cache first
    const cacheKey = `${classId}:${user.schoolId}`;
    const cached = await getCachedAnalytics('CLASS_OVERVIEW', cacheKey);

    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    // Fetch all analytics data in parallel for better performance
    const [
      classInfo,
      insights,
      performanceDistribution,
      conceptHeatmap,
      engagementMetrics,
      assignmentPerformance,
      strugglingStudents,
    ] = await Promise.all([
      // Get class basic info
      prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          name: true,
          subject: true,
          gradeLevel: true,
          academicYear: true,
        },
      }),

      // Get all student insights for this class
      prisma.studentInsight.findMany({
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
      }),

      // Performance distribution
      calculatePerformanceDistribution(classId, user.schoolId),

      // Concept heatmap
      generateConceptMasteryHeatmap(classId, user.schoolId),

      // Engagement metrics
      calculateEngagementMetrics(classId, user.schoolId),

      // Assignment performance
      getAssignmentPerformance(classId, user.schoolId),

      // Struggling students
      prisma.studentInsight.findMany({
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
          interventionLevel: 'desc',
        },
      }),
    ]);

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

    // Compile comprehensive analytics response
    const comprehensiveAnalytics = {
      classInfo,
      overview: {
        totalStudents,
        strugglingCount,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        avgScore: Math.round(avgScore * 100) / 100,
        interventionLevels,
      },
      performanceDistribution,
      conceptHeatmap,
      engagementMetrics,
      assignmentPerformance,
      strugglingStudents: strugglingStudents.map(s => ({
        studentId: s.student.id,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        email: s.student.email,
        averageScore: s.averageScore,
        completionRate: s.completionRate,
        interventionLevel: s.interventionLevel,
        isStruggling: s.isStruggling,
        hasMissedAssignments: s.hasMissedAssignments,
        hasDecliningGrade: s.hasDecliningGrade,
        hasLowEngagement: s.hasLowEngagement,
        hasConceptGaps: s.hasConceptGaps,
        strugglingConcepts: s.strugglingConcepts,
        recommendations: s.recommendations,
      })),
      insights: insights.map(i => ({
        studentId: i.student.id,
        studentName: `${i.student.firstName} ${i.student.lastName}`,
        averageScore: i.averageScore,
        completionRate: i.completionRate,
        classRank: i.classRank,
        percentile: i.percentile,
      })),
      generatedAt: new Date().toISOString(),
    };

    // Cache the result for 5 minutes
    await setCachedAnalytics('CLASS_OVERVIEW', comprehensiveAnalytics, cacheKey);

    res.status(200).json({
      success: true,
      data: comprehensiveAnalytics,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error fetching comprehensive class analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comprehensive class analytics',
      errors: [error.message],
    });
  }
}
