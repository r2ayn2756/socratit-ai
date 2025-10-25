// ============================================================================
// PROGRESS TRACKING SERVICE
// Handles student progress calculations, learning velocity, and concept mastery
// ============================================================================

import { PrismaClient, SubmissionStatus, TrendDirection } from '@prisma/client';
import { sendProgressUpdateEvent, sendConceptMasteryEvent, sendVelocityAlertEvent } from './websocket.service';

const prisma = new PrismaClient();

// ============================================================================
// CONSTANTS
// ============================================================================

const VELOCITY_ALERT_THRESHOLD = 0.25; // 25% drop triggers alert
const STRUGGLING_THRESHOLD = 60; // <60% mastery = struggling
const TREND_THRESHOLD = 5; // 5% change to consider trend significant

// ============================================================================
// INTERFACES
// ============================================================================

interface ProgressCalculationResult {
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  notStartedAssignments: number;
  completionRate: number;
  averageGrade: number | null;
  trendDirection: TrendDirection;
  trendPercentage: number | null;
  totalTimeSpent: number;
  averageTimePerAssignment: number | null;
  learningVelocity: number;
}

interface AssignmentProgressData {
  status: SubmissionStatus;
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  progressPercentage: number;
  timeSpent: number;
  attemptCount: number;
}

interface GradeTrend {
  direction: TrendDirection;
  percentage: number | null;
  averageGrade: number | null;
}

// ============================================================================
// CALCULATE STUDENT PROGRESS FOR A CLASS
// Real-time calculation after each assignment interaction
// ============================================================================

export async function calculateStudentProgress(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<ProgressCalculationResult> {
  // Get all assignments for the class
  const assignments = await prisma.assignment.findMany({
    where: {
      classId,
      schoolId,
      status: { in: ['ACTIVE', 'CLOSED'] },
      deletedAt: null,
    },
  });

  const totalAssignments = assignments.length;

  // Get all assignment progress records for this student
  const progressRecords = await prisma.assignmentProgress.findMany({
    where: {
      studentId,
      classId,
      schoolId,
    },
  });

  // Count by status
  const completedAssignments = progressRecords.filter(
    (p) => p.status === 'GRADED' || p.status === 'SUBMITTED'
  ).length;
  const inProgressAssignments = progressRecords.filter(
    (p) => p.status === 'IN_PROGRESS'
  ).length;
  const notStartedAssignments = totalAssignments - completedAssignments - inProgressAssignments;

  // Calculate completion rate
  const completionRate =
    totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  // Calculate grade trend
  const gradeTrend = await calculateGradeTrend(studentId, classId, schoolId);

  // Calculate time metrics
  const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
  const averageTimePerAssignment =
    completedAssignments > 0 ? totalTimeSpent / completedAssignments : null;

  // Calculate learning velocity (assignments completed in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentCompletions = progressRecords.filter(
    (p) =>
      p.completedAt &&
      p.completedAt >= sevenDaysAgo &&
      (p.status === 'GRADED' || p.status === 'SUBMITTED')
  ).length;

  const learningVelocity = recentCompletions; // assignments per week

  // Upsert StudentProgress record
  const studentProgress = await prisma.studentProgress.upsert({
    where: {
      studentId_classId: {
        studentId,
        classId,
      },
    },
    update: {
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      notStartedAssignments,
      completionRate,
      averageGrade: gradeTrend.averageGrade,
      trendDirection: gradeTrend.direction,
      trendPercentage: gradeTrend.percentage,
      totalTimeSpent,
      averageTimePerAssignment,
      learningVelocity,
      lastCalculated: new Date(),
    },
    create: {
      studentId,
      classId,
      schoolId,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      notStartedAssignments,
      completionRate,
      averageGrade: gradeTrend.averageGrade,
      trendDirection: gradeTrend.direction,
      trendPercentage: gradeTrend.percentage,
      totalTimeSpent,
      averageTimePerAssignment,
      learningVelocity,
      lastCalculated: new Date(),
    },
  });

  // Emit WebSocket event
  await sendProgressUpdateEvent(studentId, classId, studentProgress);

  return {
    totalAssignments,
    completedAssignments,
    inProgressAssignments,
    notStartedAssignments,
    completionRate,
    averageGrade: gradeTrend.averageGrade,
    trendDirection: gradeTrend.direction,
    trendPercentage: gradeTrend.percentage,
    totalTimeSpent,
    averageTimePerAssignment,
    learningVelocity,
  };
}

// ============================================================================
// CALCULATE GRADE TREND
// Compares recent grades vs earlier grades to determine trend
// ============================================================================

async function calculateGradeTrend(
  studentId: string,
  classId: string,
  schoolId: string
): Promise<GradeTrend> {
  // Get last 10 graded submissions
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignment: {
        classId,
        schoolId,
        deletedAt: null,
      },
      status: 'GRADED',
      percentage: { not: null },
    },
    orderBy: {
      gradedAt: 'desc',
    },
    take: 10,
  });

  if (submissions.length < 3) {
    // Not enough data for trend
    const averageGrade =
      submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) /
          submissions.length
        : null;
    return {
      direction: TrendDirection.STABLE,
      percentage: null,
      averageGrade,
    };
  }

  // Calculate overall average
  const averageGrade =
    submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) /
    submissions.length;

  // Compare recent 3 vs earlier submissions
  const recentGrades = submissions.slice(0, 3);
  const earlierGrades = submissions.slice(3);

  const recentAverage =
    recentGrades.reduce((sum, s) => sum + (s.percentage || 0), 0) /
    recentGrades.length;
  const earlierAverage =
    earlierGrades.reduce((sum, s) => sum + (s.percentage || 0), 0) /
    earlierGrades.length;

  const change = recentAverage - earlierAverage;
  const changePercentage = (change / earlierAverage) * 100;

  let direction: TrendDirection = TrendDirection.STABLE;
  if (Math.abs(changePercentage) >= TREND_THRESHOLD) {
    direction = (change > 0 ? TrendDirection.IMPROVING : TrendDirection.DECLINING) as TrendDirection;
  }

  return {
    direction,
    percentage: changePercentage,
    averageGrade,
  };
}

// ============================================================================
// UPDATE ASSIGNMENT PROGRESS
// Called when student starts, continues, or completes an assignment
// ============================================================================

export async function updateAssignmentProgress(
  studentId: string,
  assignmentId: string,
  classId: string,
  schoolId: string,
  data: Partial<AssignmentProgressData>
): Promise<void> {
  // Get assignment to get total questions
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { questions: true },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const questionsTotal = assignment.questions.length;

  // Get or create assignment progress
  const existing = await prisma.assignmentProgress.findUnique({
    where: {
      studentId_assignmentId: {
        studentId,
        assignmentId,
      },
    },
  });

  const questionsAnswered = data.questionsAnswered ?? existing?.questionsAnswered ?? 0;
  const progressPercentage =
    questionsTotal > 0 ? (questionsAnswered / questionsTotal) * 100 : 0;

  // Determine status
  let status = data.status ?? existing?.status ?? SubmissionStatus.NOT_STARTED;
  if (questionsAnswered === 0) {
    status = SubmissionStatus.NOT_STARTED;
  } else if (questionsAnswered < questionsTotal) {
    status = SubmissionStatus.IN_PROGRESS;
  } else if (questionsAnswered === questionsTotal) {
    status = SubmissionStatus.SUBMITTED;
  }

  // Upsert assignment progress
  const progress = await prisma.assignmentProgress.upsert({
    where: {
      studentId_assignmentId: {
        studentId,
        assignmentId,
      },
    },
    update: {
      status,
      questionsAnswered,
      questionsCorrect: data.questionsCorrect ?? existing?.questionsCorrect ?? 0,
      progressPercentage,
      timeSpent: data.timeSpent ?? existing?.timeSpent ?? 0,
      attemptCount: data.attemptCount ?? existing?.attemptCount ?? 0,
      lastAttemptAt: new Date(),
      ...(status === SubmissionStatus.IN_PROGRESS && !existing?.startedAt
        ? { startedAt: new Date() }
        : {}),
      ...(status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.GRADED
        ? { completedAt: new Date() }
        : {}),
    },
    create: {
      studentId,
      assignmentId,
      classId,
      schoolId,
      status,
      questionsTotal,
      questionsAnswered,
      questionsCorrect: data.questionsCorrect ?? 0,
      progressPercentage,
      timeSpent: data.timeSpent ?? 0,
      attemptCount: data.attemptCount ?? 0,
      startedAt: status !== SubmissionStatus.NOT_STARTED ? new Date() : null,
      completedAt:
        status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.GRADED
          ? new Date()
          : null,
      lastAttemptAt: new Date(),
    },
  });

  // Emit WebSocket event
  await sendProgressUpdateEvent(studentId, classId, progress);

  // Recalculate overall student progress
  await calculateStudentProgress(studentId, classId, schoolId);
}

// ============================================================================
// UPDATE TIME SPENT ON ASSIGNMENT
// Called periodically from frontend (every 5 minutes)
// ============================================================================

export async function updateAssignmentTimeSpent(
  studentId: string,
  assignmentId: string,
  additionalMinutes: number
): Promise<void> {
  // Validate input
  if (additionalMinutes < 0 || additionalMinutes > 240) {
    // Max 4 hours per update
    throw new Error('Invalid time spent value');
  }

  // Update assignment progress
  const progress = await prisma.assignmentProgress.findUnique({
    where: {
      studentId_assignmentId: {
        studentId,
        assignmentId,
      },
    },
  });

  if (!progress) {
    throw new Error('Assignment progress not found');
  }

  await prisma.assignmentProgress.update({
    where: {
      studentId_assignmentId: {
        studentId,
        assignmentId,
      },
    },
    data: {
      timeSpent: progress.timeSpent + additionalMinutes,
    },
  });

  // Recalculate overall student progress
  await calculateStudentProgress(studentId, progress.classId, progress.schoolId);
}

// ============================================================================
// UPDATE CONCEPT MASTERY
// Called when student answers questions tagged with concepts
// ============================================================================

export async function updateConceptMastery(
  studentId: string,
  classId: string,
  schoolId: string,
  concept: string,
  isCorrect: boolean,
  questionDifficulty?: number
): Promise<void> {
  // Get or create concept mastery record
  const existing = await prisma.conceptMastery.findUnique({
    where: {
      studentId_classId_concept: {
        studentId,
        classId,
        concept,
      },
    },
  });

  const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
  const correctAttempts =
    (existing?.correctAttempts ?? 0) + (isCorrect ? 1 : 0);
  const incorrectAttempts =
    (existing?.incorrectAttempts ?? 0) + (isCorrect ? 0 : 1);

  // Calculate mastery percentage (0-100)
  const masteryPercent = (correctAttempts / totalAttempts) * 100;

  // Apply difficulty weighting if provided
  const difficultyWeight = questionDifficulty ?? 1;
  const weightedScore = existing?.weightedScore ?? 50;
  const newWeightedScore =
    weightedScore * 0.8 +
    (isCorrect ? 100 * difficultyWeight : 0) * 0.2;

  // Determine mastery level
  let masteryLevel: any;
  if (masteryPercent === 0) masteryLevel = 'NOT_STARTED';
  else if (masteryPercent < 40) masteryLevel = 'BEGINNING';
  else if (masteryPercent < 70) masteryLevel = 'DEVELOPING';
  else if (masteryPercent < 90) masteryLevel = 'PROFICIENT';
  else masteryLevel = 'MASTERED';

  // Calculate trend
  const previousPercent = existing?.masteryPercent ?? 0;
  let trend: TrendDirection = TrendDirection.STABLE;
  if (masteryPercent > previousPercent + TREND_THRESHOLD) {
    trend = TrendDirection.IMPROVING as TrendDirection;
  } else if (masteryPercent < previousPercent - TREND_THRESHOLD) {
    trend = TrendDirection.DECLINING as TrendDirection;
  }

  // Calculate improvement rate
  const improvementRate =
    previousPercent > 0
      ? ((masteryPercent - previousPercent) / previousPercent) * 100
      : null;

  // Check if remediation needed
  const remediationNeeded = masteryPercent < STRUGGLING_THRESHOLD;

  // Get suggested next concepts based on learning path
  const suggestedNextConcepts = await getSuggestedNextConcepts(
    classId,
    concept,
    masteryPercent
  );

  // Upsert concept mastery
  await prisma.conceptMastery.upsert({
    where: {
      studentId_classId_concept: {
        studentId,
        classId,
        concept,
      },
    },
    update: {
      masteryLevel,
      masteryPercent,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      trend,
      previousPercent: existing?.masteryPercent ?? 0,
      weightedScore: newWeightedScore,
      lastAssessed: new Date(),
      lastPracticed: new Date(),
      practiceCount: (existing?.practiceCount ?? 0) + 1,
      improvementRate,
      suggestedNextConcepts,
      remediationNeeded,
    },
    create: {
      studentId,
      classId,
      schoolId,
      concept,
      masteryLevel,
      masteryPercent,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      trend,
      previousPercent: 0,
      weightedScore: newWeightedScore,
      firstAssessed: new Date(),
      lastAssessed: new Date(),
      lastPracticed: new Date(),
      practiceCount: 1,
      improvementRate,
      suggestedNextConcepts,
      remediationNeeded,
    },
  });

  // Emit WebSocket event if mastery changed significantly
  if (
    Math.abs(masteryPercent - previousPercent) >= 10 ||
    remediationNeeded
  ) {
    await sendConceptMasteryEvent(
      studentId,
      classId,
      concept,
      masteryPercent,
      remediationNeeded
    );
  }
}

// ============================================================================
// GET SUGGESTED NEXT CONCEPTS
// Based on learning path and current mastery
// ============================================================================

async function getSuggestedNextConcepts(
  classId: string,
  currentConcept: string,
  currentMastery: number
): Promise<string[]> {
  // Only suggest next concepts if current concept is mastered (>70%)
  if (currentMastery < 70) {
    return [];
  }

  // Find concept paths where current concept is a prerequisite
  const nextPaths = await prisma.conceptMasteryPath.findMany({
    where: {
      classId,
      prerequisite: {
        conceptName: currentConcept,
      },
    },
    orderBy: {
      orderIndex: 'asc',
    },
  });

  return nextPaths.map((path) => path.conceptName);
}

// ============================================================================
// CALCULATE WEEKLY LEARNING VELOCITY
// Called by cron job every Sunday at midnight
// ============================================================================

export async function calculateWeeklyVelocity(): Promise<void> {
  // Get all active student-class combinations
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      status: 'APPROVED',
    },
  });

  const now = new Date();
  const weekStartDate = new Date(now);
  weekStartDate.setDate(weekStartDate.getDate() - 7);

  for (const enrollment of enrollments) {
    const { studentId, classId } = enrollment;

    // Get class details for schoolId
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) continue;

    // Get assignments completed this week
    const completedAssignments = await prisma.assignmentProgress.findMany({
      where: {
        studentId,
        classId,
        status: { in: ['SUBMITTED', 'GRADED'] },
        completedAt: {
          gte: weekStartDate,
          lte: now,
        },
      },
      include: {
        assignment: {
          include: {
            submissions: {
              where: {
                studentId,
              },
            },
          },
        },
      },
    });

    const assignmentsCompleted = completedAssignments.length;
    const velocity = assignmentsCompleted; // per week

    // Calculate average score
    const scores = completedAssignments
      .map((p) => p.assignment.submissions[0]?.percentage)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null;

    // Calculate time spent
    const timeSpentMinutes = completedAssignments.reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );

    // Get previous week's velocity for comparison
    const previousWeekStart = new Date(weekStartDate);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousVelocity = await prisma.learningVelocityLog.findUnique({
      where: {
        studentId_classId_weekStartDate: {
          studentId,
          classId,
          weekStartDate: previousWeekStart,
        },
      },
    });

    const velocityChange = previousVelocity
      ? ((velocity - previousVelocity.velocity) / previousVelocity.velocity) * 100
      : null;

    // Create velocity log
    await prisma.learningVelocityLog.create({
      data: {
        studentId,
        classId,
        schoolId: classData.schoolId,
        weekStartDate,
        weekEndDate: now,
        assignmentsCompleted,
        velocity,
        averageScore,
        timeSpentMinutes,
        velocityChange,
      },
    });

    // Check if velocity dropped significantly (>25%)
    if (previousVelocity && velocityChange && velocityChange < -VELOCITY_ALERT_THRESHOLD * 100) {
      // Get teachers for this class
      const teachers = await prisma.classTeacher.findMany({
        where: { classId },
        include: { teacher: true },
      });

      // Send alerts to teachers
      for (const teacher of teachers) {
        await sendVelocityAlertEvent(
          teacher.teacherId,
          studentId,
          classId,
          velocity,
          previousVelocity.velocity
        );
      }
    }

    // Update StudentProgress with new velocity
    await prisma.studentProgress.update({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
      data: {
        learningVelocity: velocity,
      },
    });
  }
}

// ============================================================================
// GET STUDENT PROGRESS FOR MULTIPLE CLASSES
// Returns progress across all enrolled classes
// ============================================================================

export async function getStudentProgressAcrossClasses(
  studentId: string
): Promise<any[]> {
  const progressRecords = await prisma.studentProgress.findMany({
    where: { studentId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
          gradeLevel: true,
        },
      },
    },
    orderBy: {
      lastCalculated: 'desc',
    },
  });

  return progressRecords;
}

// ============================================================================
// GET CLASS PROGRESS OVERVIEW
// Returns progress for all students in a class
// ============================================================================

export async function getClassProgressOverview(
  classId: string,
  schoolId: string
): Promise<any[]> {
  const progressRecords = await prisma.studentProgress.findMany({
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
          email: true,
        },
      },
    },
    orderBy: {
      completionRate: 'desc',
    },
  });

  return progressRecords;
}

export default {
  calculateStudentProgress,
  updateAssignmentProgress,
  updateAssignmentTimeSpent,
  updateConceptMastery,
  calculateWeeklyVelocity,
  getStudentProgressAcrossClasses,
  getClassProgressOverview,
};
