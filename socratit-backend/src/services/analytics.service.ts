// ============================================================================
// ANALYTICS SERVICE
// Handles concept mastery tracking, student insights, and performance analytics
// ============================================================================

import { PrismaClient, MasteryLevel, TrendDirection, AlertSeverity } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

// Lazy initialization to prevent module-load errors
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length === 0) {
      throw new Error('GEMINI_API_KEY environment variable is required for AI recommendations');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

// ============================================================================
// INTERFACES
// ============================================================================

interface StudentPerformanceMetrics {
  completionRate: number;
  averageScore: number;
  classRank: number;
  percentile: number;
  avgTimeOnTask: number;
  totalTimeSpent: number;
}

// ============================================================================
// CONCEPT MASTERY TRACKING
// ============================================================================

/**
 * Calculate concept mastery level from percentage
 */
export function percentToMasteryLevel(percent: number): MasteryLevel {
  if (percent === 0) return MasteryLevel.NOT_STARTED;
  if (percent < 40) return MasteryLevel.BEGINNING;
  if (percent < 70) return MasteryLevel.DEVELOPING;
  if (percent < 90) return MasteryLevel.PROFICIENT;
  return MasteryLevel.MASTERED;
}

/**
 * Calculate trend direction by comparing current and previous percentages
 */
function calculateTrend(current: number, previous: number | null): TrendDirection {
  if (!previous) return TrendDirection.STABLE;
  const difference = current - previous;
  if (difference > 5) return TrendDirection.IMPROVING;
  if (difference < -5) return TrendDirection.DECLINING;
  return TrendDirection.STABLE;
}

/**
 * Calculate concept mastery for a student in a class
 */
export async function calculateConceptMastery(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<void> {
  // Get all answers for this student in this class
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignment: {
        classId,
        schoolId,
      },
      status: 'GRADED',
    },
    include: {
      answers: {
        include: {
          question: {
            select: {
              concept: true,
              difficulty: true,
            },
          },
        },
      },
      assignment: {
        select: {
          class: {
            select: {
              subject: true,
            },
          },
        },
      },
    },
  });

  // Group answers by concept
  const conceptMap: Map<
    string,
    { correct: number; total: number; difficulty: string[]; subject: string }
  > = new Map();

  submissions.forEach((submission) => {
    submission.answers.forEach((answer) => {
      if (answer.question.concept) {
        const concept = answer.question.concept;
        const existing = conceptMap.get(concept) || {
          correct: 0,
          total: 0,
          difficulty: [],
          subject: submission.assignment.class.subject || 'Unknown',
        };

        existing.total++;
        if (answer.isCorrect) existing.correct++;
        if (answer.question.difficulty) {
          existing.difficulty.push(answer.question.difficulty);
        }

        conceptMap.set(concept, existing);
      }
    });
  });

  // Calculate mastery for each concept
  for (const [concept, data] of conceptMap.entries()) {
    const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    const masteryLevel = percentToMasteryLevel(percentage);

    // Get existing mastery record
    const existing = await prisma.conceptMastery.findFirst({
      where: {
        studentId,
        classId,
        concept,
      },
    });

    const trend = calculateTrend(percentage, existing?.masteryPercent || null);

    // Upsert mastery record
    if (existing) {
      await prisma.conceptMastery.update({
        where: { id: existing.id },
        data: {
          masteryLevel,
          masteryPercent: percentage,
          totalAttempts: data.total,
          correctAttempts: data.correct,
          incorrectAttempts: data.total - data.correct,
          trend,
          previousPercent: existing.masteryPercent,
          lastAssessed: new Date(),
        },
      });
    } else {
      await prisma.conceptMastery.create({
        data: {
          studentId,
          classId,
          schoolId,
          concept,
          subject: data.subject,
          masteryLevel,
          masteryPercent: percentage,
          totalAttempts: data.total,
          correctAttempts: data.correct,
          incorrectAttempts: data.total - data.correct,
          trend,
          firstAssessed: new Date(),
          lastAssessed: new Date(),
        },
      });
    }
  }
}

// ============================================================================
// STUDENT PERFORMANCE METRICS
// ============================================================================

/**
 * Calculate comprehensive performance metrics for a student
 */
export async function calculateStudentMetrics(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<StudentPerformanceMetrics> {
  // Get all assignments for this class
  const assignments = await prisma.assignment.findMany({
    where: {
      classId,
      schoolId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  const totalAssignments = assignments.length;

  // Get student's submissions
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignmentId: {
        in: assignments.map((a) => a.id),
      },
    },
    select: {
      status: true,
      percentage: true,
      timeSpent: true,
    },
  });

  // Calculate completion rate
  const completedSubmissions = submissions.filter((s) => s.status === 'GRADED').length;
  const completionRate = totalAssignments > 0 ? (completedSubmissions / totalAssignments) * 100 : 0;

  // Calculate average score
  const gradedSubmissions = submissions.filter((s) => s.status === 'GRADED');
  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) /
        gradedSubmissions.length
      : 0;

  // Calculate time metrics
  const totalTimeSpent = submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
  const avgTimeOnTask = gradedSubmissions.length > 0 ? totalTimeSpent / gradedSubmissions.length : 0;

  // Calculate class ranking
  const allStudentScores = await prisma.submission.findMany({
    where: {
      assignmentId: {
        in: assignments.map((a) => a.id),
      },
      status: 'GRADED',
    },
    select: {
      studentId: true,
      percentage: true,
    },
  });

  const studentAverages: Map<string, number[]> = new Map();
  allStudentScores.forEach((s) => {
    const scores = studentAverages.get(s.studentId) || [];
    scores.push(s.percentage || 0);
    studentAverages.set(s.studentId, scores);
  });

  const averages = Array.from(studentAverages.entries())
    .map(([sid, scores]) => ({
      studentId: sid,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    }))
    .sort((a, b) => b.average - a.average);

  const classRank = averages.findIndex((a) => a.studentId === studentId) + 1;
  const percentile = averages.length > 0 ? ((averages.length - classRank + 1) / averages.length) * 100 : 0;

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    averageScore: Math.round(averageScore * 100) / 100,
    classRank,
    percentile: Math.round(percentile * 100) / 100,
    avgTimeOnTask: Math.round(avgTimeOnTask),
    totalTimeSpent,
  };
}

// ============================================================================
// STRUGGLING STUDENT IDENTIFICATION
// ============================================================================

/**
 * Calculate student insights and identify struggling students
 */
export async function calculateStudentInsights(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<void> {
  // Calculate performance metrics
  const metrics = await calculateStudentMetrics(studentId, classId, schoolId);

  // Get concept masteries
  const conceptMasteries = await prisma.conceptMastery.findMany({
    where: {
      studentId,
      classId,
    },
  });

  // Identify struggling concepts (< 50% mastery)
  const strugglingConcepts = conceptMasteries
    .filter((c) => c.masteryPercent < 50)
    .map((c) => ({ concept: c.concept, mastery: c.masteryPercent }));

  // Identify mastered concepts (> 90% mastery)
  const masteredConcepts = conceptMasteries
    .filter((c) => c.masteryPercent > 90)
    .map((c) => ({ concept: c.concept, mastery: c.masteryPercent }));

  // Check for recent grade trends
  const recentGrades = await prisma.grade.findMany({
    where: {
      studentId,
      classId,
      gradeType: 'assignment',
    },
    orderBy: {
      gradeDate: 'desc',
    },
    take: 5,
  });

  const hasDecliningGrade =
    recentGrades.length >= 3 &&
    recentGrades[0].percentage < recentGrades[1].percentage &&
    recentGrades[1].percentage < recentGrades[2].percentage;

  // Determine flags
  const isStruggling = metrics.averageScore < 70;
  const hasMissedAssignments = metrics.completionRate < 80;
  const hasLowEngagement = metrics.avgTimeOnTask < 300; // Less than 5 minutes average
  const hasConceptGaps = strugglingConcepts.length >= 3;

  // Determine intervention level
  let interventionLevel: AlertSeverity = AlertSeverity.LOW;
  const alertCount = [
    isStruggling,
    hasMissedAssignments,
    hasDecliningGrade,
    hasLowEngagement,
    hasConceptGaps,
  ].filter(Boolean).length;

  if (alertCount >= 4) interventionLevel = AlertSeverity.CRITICAL;
  else if (alertCount >= 3) interventionLevel = AlertSeverity.HIGH;
  else if (alertCount >= 2) interventionLevel = AlertSeverity.MEDIUM;

  // Upsert student insight
  const existing = await prisma.studentInsight.findFirst({
    where: {
      studentId,
      classId,
    },
  });

  if (existing) {
    await prisma.studentInsight.update({
      where: { id: existing.id },
      data: {
        isStruggling,
        hasMissedAssignments,
        hasDecliningGrade,
        hasLowEngagement,
        hasConceptGaps,
        completionRate: metrics.completionRate,
        averageScore: metrics.averageScore,
        classRank: metrics.classRank,
        percentile: metrics.percentile,
        avgTimeOnTask: metrics.avgTimeOnTask,
        totalTimeSpent: metrics.totalTimeSpent,
        strugglingConcepts: JSON.parse(JSON.stringify(strugglingConcepts)),
        masteredConcepts: JSON.parse(JSON.stringify(masteredConcepts)),
        interventionLevel,
        lastCalculated: new Date(),
        dataPoints: recentGrades.length,
      },
    });
  } else {
    await prisma.studentInsight.create({
      data: {
        studentId,
        classId,
        schoolId,
        isStruggling,
        hasMissedAssignments,
        hasDecliningGrade,
        hasLowEngagement,
        hasConceptGaps,
        completionRate: metrics.completionRate,
        averageScore: metrics.averageScore,
        classRank: metrics.classRank,
        percentile: metrics.percentile,
        avgTimeOnTask: metrics.avgTimeOnTask,
        totalTimeSpent: metrics.totalTimeSpent,
        strugglingConcepts: JSON.parse(JSON.stringify(strugglingConcepts)),
        masteredConcepts: JSON.parse(JSON.stringify(masteredConcepts)),
        interventionLevel,
        lastCalculated: new Date(),
        dataPoints: recentGrades.length,
      },
    });
  }
}

// ============================================================================
// CLASS-WIDE ANALYTICS
// ============================================================================

/**
 * Calculate analytics for entire class
 */
export async function calculateClassAnalytics(classId: string, schoolId: string) {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
    select: {
      studentId: true,
    },
  });

  // Calculate insights for all students
  for (const enrollment of enrollments) {
    await calculateConceptMastery(enrollment.studentId, classId, schoolId);
    await calculateStudentInsights(enrollment.studentId, classId, schoolId);
  }
}

// ============================================================================
// PERFORMANCE TIMELINE ANALYTICS
// ============================================================================

interface TimelineDataPoint {
  date: string;
  averageScore: number;
  assignmentCount: number;
  timeSpent: number;
}

/**
 * Generate performance timeline data for charts
 */
export async function generatePerformanceTimeline(
  studentId: string,
  classId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  granularity: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<TimelineDataPoint[]> {
  // Get all submissions in date range
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignment: {
        classId,
        schoolId,
      },
      status: 'GRADED',
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      submittedAt: true,
      percentage: true,
      timeSpent: true,
    },
    orderBy: {
      submittedAt: 'asc',
    },
  });

  // Group by granularity
  const grouped = new Map<string, { scores: number[]; timeSpent: number }>();

  submissions.forEach((sub) => {
    if (!sub.submittedAt || sub.percentage === null) return;

    const date = new Date(sub.submittedAt);
    let key: string;

    if (granularity === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (granularity === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    const existing = grouped.get(key) || { scores: [], timeSpent: 0 };
    existing.scores.push(sub.percentage);
    existing.timeSpent += sub.timeSpent || 0;
    grouped.set(key, existing);
  });

  // Convert to array and calculate averages
  const timeline: TimelineDataPoint[] = Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    averageScore: Math.round((data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length) * 100) / 100,
    assignmentCount: data.scores.length,
    timeSpent: data.timeSpent,
  }));

  return timeline.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// CONCEPT COMPARISON ANALYTICS
// ============================================================================

interface ConceptComparison {
  concept: string;
  studentMastery: number;
  classAverage: number;
  percentile: number;
  trend: string;
}

/**
 * Compare student's concept mastery to class average
 */
export async function generateConceptComparison(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<ConceptComparison[]> {
  // Get student's concept masteries
  const studentConcepts = await prisma.conceptMastery.findMany({
    where: {
      studentId,
      classId,
      schoolId,
    },
  });

  // Get all students in class
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
    select: {
      studentId: true,
    },
  });

  const studentIds = enrollments.map((e) => e.studentId);

  // Get all concept masteries for the class
  const allConcepts = await prisma.conceptMastery.findMany({
    where: {
      classId,
      schoolId,
      studentId: {
        in: studentIds,
      },
    },
  });

  // Calculate class averages by concept
  const conceptAverages = new Map<string, number[]>();
  allConcepts.forEach((cm) => {
    const scores = conceptAverages.get(cm.concept) || [];
    scores.push(cm.masteryPercent);
    conceptAverages.set(cm.concept, scores);
  });

  // Generate comparison data
  const comparisons: ConceptComparison[] = studentConcepts.map((sc) => {
    const classScores = conceptAverages.get(sc.concept) || [sc.masteryPercent];
    const classAverage = classScores.reduce((sum, s) => sum + s, 0) / classScores.length;

    // Calculate percentile
    const lowerScores = classScores.filter((s) => s < sc.masteryPercent).length;
    const percentile = (lowerScores / classScores.length) * 100;

    return {
      concept: sc.concept,
      studentMastery: Math.round(sc.masteryPercent * 100) / 100,
      classAverage: Math.round(classAverage * 100) / 100,
      percentile: Math.round(percentile * 100) / 100,
      trend: sc.trend,
    };
  });

  return comparisons.sort((a, b) => a.studentMastery - b.studentMastery);
}

// ============================================================================
// ASSIGNMENT BREAKDOWN ANALYTICS
// ============================================================================

interface AssignmentTypeBreakdown {
  type: string;
  averageScore: number;
  completionRate: number;
  totalAssignments: number;
  completedAssignments: number;
}

/**
 * Get performance breakdown by assignment type
 */
export async function generateAssignmentBreakdown(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<Record<string, AssignmentTypeBreakdown>> {
  // Get all assignments for this class
  const assignments = await prisma.assignment.findMany({
    where: {
      classId,
      schoolId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: {
      id: true,
      type: true,
    },
  });

  // Get student's submissions
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignmentId: {
        in: assignments.map((a) => a.id),
      },
    },
    select: {
      assignmentId: true,
      status: true,
      percentage: true,
    },
  });

  // Create a map of assignmentId to type
  const assignmentTypes = new Map<string, string>();
  assignments.forEach((a) => {
    assignmentTypes.set(a.id, a.type);
  });

  // Group by assignment type
  const typeMap = new Map<
    string,
    { scores: number[]; total: number; completed: number }
  >();

  assignments.forEach((a) => {
    const type = a.type;
    const existing = typeMap.get(type) || { scores: [], total: 0, completed: 0 };
    existing.total++;
    typeMap.set(type, existing);
  });

  submissions.forEach((sub) => {
    const type = assignmentTypes.get(sub.assignmentId);
    if (!type) return;

    const existing = typeMap.get(type) || { scores: [], total: 0, completed: 0 };

    if (sub.status === 'GRADED' && sub.percentage !== null) {
      existing.scores.push(sub.percentage);
      existing.completed++;
    }

    typeMap.set(type, existing);
  });

  // Convert to result object
  const result: Record<string, AssignmentTypeBreakdown> = {};

  typeMap.forEach((data, type) => {
    const avgScore = data.scores.length > 0
      ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
      : 0;

    result[type.toLowerCase()] = {
      type,
      averageScore: Math.round(avgScore * 100) / 100,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      totalAssignments: data.total,
      completedAssignments: data.completed,
    };
  });

  return result;
}

// ============================================================================
// CLASS PERFORMANCE DISTRIBUTION
// ============================================================================

interface PerformanceDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface DistributionStats {
  distribution: PerformanceDistribution[];
  median: number;
  mean: number;
  stdDev: number;
  totalStudents: number;
}

/**
 * Calculate class performance distribution and statistics
 */
export async function calculatePerformanceDistribution(
  classId: string,
  schoolId: string
): Promise<DistributionStats> {
  const insights = await prisma.studentInsight.findMany({
    where: {
      classId,
      schoolId,
    },
    select: {
      averageScore: true,
    },
  });

  const scores = insights
    .map((i) => i.averageScore || 0)
    .filter((s) => s > 0);

  if (scores.length === 0) {
    return {
      distribution: [],
      median: 0,
      mean: 0,
      stdDev: 0,
      totalStudents: 0,
    };
  }

  // Calculate distribution
  const ranges = [
    { range: 'A (90-100)', min: 90, max: 100 },
    { range: 'B (80-89)', min: 80, max: 89 },
    { range: 'C (70-79)', min: 70, max: 79 },
    { range: 'D (60-69)', min: 60, max: 69 },
    { range: 'F (0-59)', min: 0, max: 59 },
  ];

  const distribution: PerformanceDistribution[] = ranges.map((r) => {
    const count = scores.filter((s) => s >= r.min && s <= r.max).length;
    return {
      range: r.range,
      count,
      percentage: (count / scores.length) * 100,
    };
  });

  // Calculate statistics
  const sortedScores = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const median =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)];

  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  return {
    distribution,
    median: Math.round(median * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    totalStudents: scores.length,
  };
}

// ============================================================================
// CONCEPT MASTERY HEATMAP
// ============================================================================

interface ConceptHeatmapData {
  concept: string;
  subject: string;
  studentMasteryLevels: {
    studentId: string;
    studentName: string;
    masteryLevel: string;
    masteryPercent: number;
  }[];
  classAverage: number;
}

/**
 * Generate concept mastery heatmap data
 */
export async function generateConceptMasteryHeatmap(
  classId: string,
  schoolId: string
): Promise<ConceptHeatmapData[]> {
  // Get all concepts for this class
  const conceptMasteries = await prisma.conceptMastery.findMany({
    where: {
      classId,
      schoolId,
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Group by concept
  const conceptMap = new Map<
    string,
    {
      subject: string;
      students: {
        studentId: string;
        studentName: string;
        masteryLevel: string;
        masteryPercent: number;
      }[];
    }
  >();

  conceptMasteries.forEach((cm) => {
    const key = cm.concept;
    const existing = conceptMap.get(key) || {
      subject: cm.subject || 'Unknown',
      students: [],
    };

    existing.students.push({
      studentId: cm.studentId,
      studentName: `${cm.student.firstName} ${cm.student.lastName}`,
      masteryLevel: cm.masteryLevel,
      masteryPercent: cm.masteryPercent,
    });

    conceptMap.set(key, existing);
  });

  // Convert to array with class averages
  const heatmap: ConceptHeatmapData[] = Array.from(conceptMap.entries()).map(
    ([concept, data]) => {
      const classAverage =
        data.students.reduce((sum, s) => sum + s.masteryPercent, 0) / data.students.length;

      return {
        concept,
        subject: data.subject,
        studentMasteryLevels: data.students,
        classAverage: Math.round(classAverage * 100) / 100,
      };
    }
  );

  return heatmap.sort((a, b) => a.classAverage - b.classAverage);
}

// ============================================================================
// ENGAGEMENT METRICS
// ============================================================================

interface EngagementMetrics {
  avgTimeSpent: number;
  completionRate: number;
  activeStudents: number;
  inactiveStudents: number;
  totalStudents: number;
  avgStreakDays: number;
}

/**
 * Calculate class engagement metrics
 */
export async function calculateEngagementMetrics(
  classId: string,
  schoolId: string
): Promise<EngagementMetrics> {
  const insights = await prisma.studentInsight.findMany({
    where: {
      classId,
      schoolId,
    },
  });

  const totalStudents = insights.length;

  if (totalStudents === 0) {
    return {
      avgTimeSpent: 0,
      completionRate: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      totalStudents: 0,
      avgStreakDays: 0,
    };
  }

  const avgTimeSpent =
    insights.reduce((sum, i) => sum + (i.totalTimeSpent || 0), 0) / totalStudents;

  const avgCompletionRate =
    insights.reduce((sum, i) => sum + (i.completionRate || 0), 0) / totalStudents;

  // Students are active if they have activity in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeStudents = insights.filter(
    (i) => i.lastActivityAt && i.lastActivityAt > sevenDaysAgo
  ).length;

  const avgStreakDays =
    insights.reduce((sum, i) => sum + (i.streakDays || 0), 0) / totalStudents;

  return {
    avgTimeSpent: Math.round(avgTimeSpent),
    completionRate: Math.round(avgCompletionRate * 100) / 100,
    activeStudents,
    inactiveStudents: totalStudents - activeStudents,
    totalStudents,
    avgStreakDays: Math.round(avgStreakDays * 100) / 100,
  };
}

// ============================================================================
// ASSIGNMENT PERFORMANCE
// ============================================================================

interface AssignmentPerformanceData {
  assignmentId: string;
  title: string;
  assignmentType: string;
  avgScore: number;
  completionRate: number;
  submissionCount: number;
  totalStudents: number;
}

/**
 * Get performance breakdown per assignment
 */
export async function getAssignmentPerformance(
  classId: string,
  schoolId: string
): Promise<AssignmentPerformanceData[]> {
  // Get all assignments for class
  const assignments = await prisma.assignment.findMany({
    where: {
      classId,
      schoolId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      type: true,
    },
  });

  // Get total students in class
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
  });

  const totalStudents = enrollments.length;

  // Get all submissions
  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId: {
        in: assignments.map((a) => a.id),
      },
      status: 'GRADED',
    },
    select: {
      assignmentId: true,
      percentage: true,
    },
  });

  // Group submissions by assignment
  const submissionMap = new Map<string, number[]>();
  submissions.forEach((sub) => {
    const scores = submissionMap.get(sub.assignmentId) || [];
    if (sub.percentage !== null) {
      scores.push(sub.percentage);
    }
    submissionMap.set(sub.assignmentId, scores);
  });

  // Build result
  const result: AssignmentPerformanceData[] = assignments.map((a) => {
    const scores = submissionMap.get(a.id) || [];
    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    return {
      assignmentId: a.id,
      title: a.title,
      assignmentType: a.type,
      avgScore: Math.round(avgScore * 100) / 100,
      completionRate: totalStudents > 0 ? (scores.length / totalStudents) * 100 : 0,
      submissionCount: scores.length,
      totalStudents,
    };
  });

  return result.sort((a, b) => b.avgScore - a.avgScore);
}

// ============================================================================
// AI-POWERED RECOMMENDATIONS
// ============================================================================

interface RecommendationData {
  recommendations: string[];
  actionItems: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  focus: string;
}

/**
 * Generate AI-powered recommendations for student intervention
 */
export async function generateAIRecommendations(
  studentId: string,
  classId: string,
  schoolId: string,
  focus: 'concepts' | 'engagement' | 'overall' = 'overall'
): Promise<RecommendationData> {
  try {
    // Get student insight data
    const insight = await prisma.studentInsight.findFirst({
      where: {
        studentId,
        classId,
        schoolId,
      },
    });

    // Get concept masteries
    const concepts = await prisma.conceptMastery.findMany({
      where: {
        studentId,
        classId,
        schoolId,
      },
      orderBy: {
        masteryPercent: 'asc',
      },
      take: 5, // Top 5 struggling concepts
    });

    // Get recent grades
    const recentGrades = await prisma.grade.findMany({
      where: {
        studentId,
        classId,
        gradeType: 'assignment',
      },
      orderBy: {
        gradeDate: 'desc',
      },
      take: 5,
    });

    // Build context for AI
    const context = {
      averageScore: insight?.averageScore || 0,
      completionRate: insight?.completionRate || 0,
      classRank: insight?.classRank || 0,
      percentile: insight?.percentile || 0,
      isStruggling: insight?.isStruggling || false,
      hasMissedAssignments: insight?.hasMissedAssignments || false,
      hasDecliningGrade: insight?.hasDecliningGrade || false,
      hasLowEngagement: insight?.hasLowEngagement || false,
      hasConceptGaps: insight?.hasConceptGaps || false,
      interventionLevel: insight?.interventionLevel || 'LOW',
      strugglingConcepts: concepts.map((c) => ({
        concept: c.concept,
        mastery: c.masteryPercent,
        level: c.masteryLevel,
      })),
      recentScores: recentGrades.map((g) => g.percentage),
      avgTimeOnTask: insight?.avgTimeOnTask || 0,
      streakDays: insight?.streakDays || 0,
    };

    // Construct AI prompt
    const prompt = `You are an educational consultant AI helping teachers provide personalized interventions for students.

Based on the following student performance data, generate specific, actionable recommendations:

**Student Performance Metrics:**
- Average Score: ${context.averageScore}%
- Completion Rate: ${context.completionRate}%
- Class Rank: ${context.classRank}
- Percentile: ${context.percentile}%
- Recent Scores: ${context.recentScores.join(', ')}%
- Average Time on Task: ${Math.round(context.avgTimeOnTask / 60)} minutes
- Current Streak: ${context.streakDays} days

**Performance Indicators:**
- Is Struggling: ${context.isStruggling}
- Has Missed Assignments: ${context.hasMissedAssignments}
- Has Declining Grades: ${context.hasDecliningGrade}
- Has Low Engagement: ${context.hasLowEngagement}
- Has Concept Gaps: ${context.hasConceptGaps}
- Intervention Level: ${context.interventionLevel}

**Struggling Concepts:**
${context.strugglingConcepts.map((c) => `- ${c.concept}: ${c.mastery}% (${c.level})`).join('\n')}

**Focus Area:** ${focus}

Provide your response in the following JSON format:
{
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ],
  "actionItems": [
    {
      "title": "Action item title",
      "description": "Detailed description of what to do",
      "priority": "low" | "medium" | "high" | "critical"
    }
  ],
  "focus": "Brief summary of primary focus area"
}

Make recommendations:
1. Specific and actionable
2. Tailored to the student's unique situation
3. Focus on improvement strategies
4. Include both academic and engagement recommendations
5. Prioritize based on intervention level`;

    // Call Gemini API
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const systemPrompt = 'You are an expert educational consultant providing personalized student intervention recommendations. Always respond with valid JSON.';
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    if (!response) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON from response (Gemini sometimes wraps in code blocks)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const recommendations: RecommendationData = JSON.parse(jsonText);

    // Store recommendations in student insight
    await prisma.studentInsight.update({
      where: {
        id: insight?.id,
      },
      data: {
        recommendations: JSON.parse(JSON.stringify(recommendations)),
        lastCalculated: new Date(),
      },
    });

    return recommendations;
  } catch (error: any) {
    console.error('Error generating AI recommendations:', error);

    // Fallback to template-based recommendations
    return generateTemplateRecommendations(studentId, classId, schoolId);
  }
}

/**
 * Generate template-based recommendations (fallback if AI fails)
 */
async function generateTemplateRecommendations(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<RecommendationData> {
  const insight = await prisma.studentInsight.findFirst({
    where: {
      studentId,
      classId,
      schoolId,
    },
  });

  const recommendations: string[] = [];
  const actionItems: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[] = [];

  if (insight?.isStruggling) {
    recommendations.push('Schedule one-on-one tutoring sessions to address knowledge gaps');
    actionItems.push({
      title: 'Schedule Tutoring',
      description: 'Set up weekly 30-minute tutoring sessions focusing on struggling concepts',
      priority: 'high',
    });
  }

  if (insight?.hasMissedAssignments) {
    recommendations.push('Create a catch-up plan for missed assignments');
    actionItems.push({
      title: 'Assignment Catch-Up Plan',
      description: 'Work with student to create timeline for completing missed work',
      priority: 'medium',
    });
  }

  if (insight?.hasLowEngagement) {
    recommendations.push('Implement engagement strategies such as gamification or interactive content');
    actionItems.push({
      title: 'Increase Engagement',
      description: 'Introduce interactive assignments and provide more frequent feedback',
      priority: 'medium',
    });
  }

  if (insight?.hasConceptGaps) {
    recommendations.push('Provide targeted practice on fundamental concepts');
    actionItems.push({
      title: 'Concept Remediation',
      description: 'Assign practice problems focusing on specific struggling concepts',
      priority: 'high',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue current learning trajectory with consistent practice');
    actionItems.push({
      title: 'Maintain Progress',
      description: 'Encourage student to maintain current performance levels',
      priority: 'low',
    });
  }

  return {
    recommendations,
    actionItems,
    focus: insight?.interventionLevel || 'general',
  };
}

// ============================================================================
// ANALYTICS EVENT TRACKING
// ============================================================================

/**
 * Track analytics event
 */
export async function trackAnalyticsEvent(
  studentId: string,
  schoolId: string,
  eventType: string,
  eventData?: any,
  assignmentId?: string,
  submissionId?: string,
  questionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      studentId,
      schoolId,
      eventType,
      eventData: eventData ? JSON.parse(JSON.stringify(eventData)) : null,
      assignmentId,
      submissionId,
      questionId,
      ipAddress,
      userAgent,
    },
  });

  // Update last activity timestamp
  const enrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId,
      status: 'APPROVED',
    },
    select: {
      classId: true,
    },
  });

  if (enrollment) {
    await prisma.studentInsight.updateMany({
      where: {
        studentId,
        classId: enrollment.classId,
      },
      data: {
        lastActivityAt: new Date(),
      },
    });
  }
}

/**
 * Get analytics events for a student
 */
export async function getStudentEvents(
  studentId: string,
  schoolId: string,
  filters?: {
    eventType?: string;
    assignmentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const where: any = {
    studentId,
    schoolId,
  };

  if (filters?.eventType) where.eventType = filters.eventType;
  if (filters?.assignmentId) where.assignmentId = filters.assignmentId;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const events = await prisma.analyticsEvent.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
  });

  return events;
}

// ============================================================================
// CLASS COMPARISON (SCHOOL-WIDE)
// ============================================================================

interface ClassComparisonData {
  thisClass: {
    classId: string;
    className: string;
    avgScore: number;
    avgCompletionRate: number;
    totalStudents: number;
    strugglingStudents: number;
  };
  schoolAverage: {
    avgScore: number;
    avgCompletionRate: number;
    totalClasses: number;
  };
}

/**
 * Compare class performance to school average
 */
export async function compareClassToSchool(
  classId: string,
  schoolId: string
): Promise<ClassComparisonData> {
  // Get this class's insights
  const thisClassInsights = await prisma.studentInsight.findMany({
    where: {
      classId,
      schoolId,
    },
  });

  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    select: { name: true },
  });

  // Calculate this class stats
  const thisClassAvgScore =
    thisClassInsights.length > 0
      ? thisClassInsights.reduce((sum, i) => sum + (i.averageScore || 0), 0) /
        thisClassInsights.length
      : 0;

  const thisClassAvgCompletion =
    thisClassInsights.length > 0
      ? thisClassInsights.reduce((sum, i) => sum + (i.completionRate || 0), 0) /
        thisClassInsights.length
      : 0;

  const strugglingCount = thisClassInsights.filter((i) => i.isStruggling).length;

  // Get all classes in school
  const allClasses = await prisma.class.findMany({
    where: {
      schoolId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  // Get all insights for school
  const allInsights = await prisma.studentInsight.findMany({
    where: {
      schoolId,
      classId: {
        in: allClasses.map((c) => c.id),
      },
    },
  });

  const schoolAvgScore =
    allInsights.length > 0
      ? allInsights.reduce((sum, i) => sum + (i.averageScore || 0), 0) / allInsights.length
      : 0;

  const schoolAvgCompletion =
    allInsights.length > 0
      ? allInsights.reduce((sum, i) => sum + (i.completionRate || 0), 0) / allInsights.length
      : 0;

  return {
    thisClass: {
      classId,
      className: classInfo?.name || 'Unknown',
      avgScore: Math.round(thisClassAvgScore * 100) / 100,
      avgCompletionRate: Math.round(thisClassAvgCompletion * 100) / 100,
      totalStudents: thisClassInsights.length,
      strugglingStudents: strugglingCount,
    },
    schoolAverage: {
      avgScore: Math.round(schoolAvgScore * 100) / 100,
      avgCompletionRate: Math.round(schoolAvgCompletion * 100) / 100,
      totalClasses: allClasses.length,
    },
  };
}
