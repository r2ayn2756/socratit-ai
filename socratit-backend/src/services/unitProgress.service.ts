// ============================================================================
// UNIT PROGRESS SERVICE
// Business logic for student progress tracking through curriculum units
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  StudentUnitProgressResponse,
  UnitProgressCalculation,
  UnitNotFoundError,
  UnauthorizedScheduleAccessError,
} from '../types/curriculum-scheduling.types';

const prisma = new PrismaClient();

// ============================================================================
// PROGRESS RETRIEVAL
// ============================================================================

/**
 * Get student's progress across all units in a schedule
 */
export async function getStudentProgress(
  scheduleId: string,
  studentId: string
): Promise<StudentUnitProgressResponse> {
  // Verify student has access to schedule
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: {
        include: {
          enrollments: {
            where: {
              studentId,
              status: 'APPROVED',
            },
          },
        },
      },
      units: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          studentProgress: {
            where: { studentId },
          },
          assignments: {
            where: { deletedAt: null },
            include: {
              submissions: {
                where: { studentId },
              },
            },
          },
        },
      },
    },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  // Verify student is enrolled
  if (schedule.class.enrollments.length === 0) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Calculate overall statistics
  const totalUnits = schedule.units.length;
  const unitsStarted = schedule.units.filter(
    u => u.studentProgress[0]?.status !== 'NOT_STARTED'
  ).length;
  const unitsCompleted = schedule.units.filter(
    u => u.studentProgress[0]?.status === 'COMPLETED' || u.studentProgress[0]?.status === 'MASTERED'
  ).length;
  const unitsMastered = schedule.units.filter(
    u => u.studentProgress[0]?.status === 'MASTERED'
  ).length;

  // Calculate average score across all units with assignments
  const unitsWithScores = schedule.units.filter(u => u.studentProgress[0]?.assignmentsScore);
  const averageScore = unitsWithScores.length > 0
    ? unitsWithScores.reduce((sum, u) => sum + (u.studentProgress[0]?.assignmentsScore || 0), 0) / unitsWithScores.length
    : 0;

  // Calculate overall progress percentage
  const overallProgress = totalUnits > 0
    ? schedule.units.reduce((sum, u) => sum + (u.studentProgress[0]?.percentComplete || 0), 0) / totalUnits
    : 0;

  // Identify current unit (first in-progress or next scheduled)
  const currentUnit = schedule.units.find(u => u.studentProgress[0]?.status === 'IN_PROGRESS') ||
    schedule.units.find(u => u.studentProgress[0]?.status === 'NOT_STARTED' || !u.studentProgress[0]);

  // Aggregate strengths and struggles across all units
  const allStrengths: string[] = [];
  const allStruggles: string[] = [];
  const allRecommendedReview: string[] = [];

  schedule.units.forEach(unit => {
    if (unit.studentProgress[0]) {
      allStrengths.push(...(unit.studentProgress[0].strengths || []));
      allStruggles.push(...(unit.studentProgress[0].struggles || []));
      allRecommendedReview.push(...(unit.studentProgress[0].recommendedReview || []));
    }
  });

  // Deduplicate arrays
  const uniqueStrengths = Array.from(new Set(allStrengths));
  const uniqueStruggles = Array.from(new Set(allStruggles));
  const uniqueRecommendedReview = Array.from(new Set(allRecommendedReview));

  return {
    scheduleId: schedule.id,
    scheduleTitle: schedule.title,
    studentId,
    overallProgress: {
      totalUnits,
      unitsStarted,
      unitsCompleted,
      unitsMastered,
      percentComplete: overallProgress,
      averageScore,
      currentUnitId: currentUnit?.id,
      currentUnitTitle: currentUnit?.title,
    },
    unitProgress: schedule.units.map(unit => {
      const progress = unit.studentProgress[0];
      return {
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        title: unit.title,
        startDate: unit.startDate.toISOString(),
        endDate: unit.endDate.toISOString(),
        status: progress?.status || 'NOT_STARTED',
        percentComplete: progress?.percentComplete || 0,
        assignmentsCompleted: progress?.assignmentsCompleted || 0,
        assignmentsTotal: unit.assignments.length,
        assignmentsScore: progress?.assignmentsScore || 0,
        conceptsMastered: progress?.conceptsMastered || 0,
        conceptsTotal: unit.concepts.length,
        masteryPercentage: progress?.masteryPercentage || 0,
        timeSpentMinutes: progress?.timeSpentMinutes || 0,
        lastAccessedAt: progress?.lastAccessedAt?.toISOString(),
      };
    }),
    insights: {
      strengths: uniqueStrengths,
      struggles: uniqueStruggles,
      recommendedReview: uniqueRecommendedReview,
    },
  };
}

/**
 * Get progress for a specific unit (student or teacher view)
 */
export async function getUnitProgressForStudent(
  unitId: string,
  studentId: string
): Promise<any> {
  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    include: {
      studentProgress: {
        where: { studentId },
      },
      assignments: {
        where: { deletedAt: null },
        include: {
          submissions: {
            where: { studentId },
          },
        },
      },
      schedule: {
        include: {
          class: {
            include: {
              enrollments: {
                where: {
                  studentId,
                  status: 'APPROVED',
                },
              },
            },
          },
        },
      },
    },
  });

  if (!unit) {
    throw new UnitNotFoundError(unitId);
  }

  // Verify student is enrolled
  if (unit.schedule.class.enrollments.length === 0) {
    throw new UnauthorizedScheduleAccessError();
  }

  const progress = unit.studentProgress[0];

  return {
    unitId: unit.id,
    unitNumber: unit.unitNumber,
    title: unit.title,
    description: unit.description,
    startDate: unit.startDate.toISOString(),
    endDate: unit.endDate.toISOString(),
    topics: unit.topics,
    learningObjectives: unit.learningObjectives,
    concepts: unit.concepts,
    difficultyLevel: unit.difficultyLevel,
    progress: {
      status: progress?.status || 'NOT_STARTED',
      percentComplete: progress?.percentComplete || 0,
      assignmentsCompleted: progress?.assignmentsCompleted || 0,
      assignmentsTotal: unit.assignments.length,
      assignmentsScore: progress?.assignmentsScore || 0,
      conceptsMastered: progress?.conceptsMastered || 0,
      conceptsTotal: unit.concepts.length,
      masteryPercentage: progress?.masteryPercentage || 0,
      timeSpentMinutes: progress?.timeSpentMinutes || 0,
      firstAccessedAt: progress?.firstAccessedAt?.toISOString(),
      lastAccessedAt: progress?.lastAccessedAt?.toISOString(),
      completedAt: progress?.completedAt?.toISOString(),
      strengths: progress?.strengths || [],
      struggles: progress?.struggles || [],
      recommendedReview: progress?.recommendedReview || [],
      engagementScore: progress?.engagementScore,
      participationCount: progress?.participationCount || 0,
    },
    assignments: unit.assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      type: assignment.type,
      dueDate: assignment.dueDate?.toISOString(),
      completed: assignment.submissions.length > 0,
      score: assignment.submissions[0]?.percentage,
      submittedAt: assignment.submissions[0]?.submittedAt?.toISOString(),
    })),
  };
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculate and update progress for a student's unit
 * Called when: assignment submitted, unit accessed, manual teacher update
 */
export async function calculateUnitProgress(
  unitId: string,
  studentId: string
): Promise<UnitProgressCalculation> {
  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    include: {
      assignments: {
        where: { deletedAt: null },
        include: {
          submissions: {
            where: { studentId },
          },
        },
      },
      schedule: {
        include: {
          class: true,
        },
      },
    },
  });

  if (!unit) {
    throw new UnitNotFoundError(unitId);
  }

  // Calculate assignment progress
  const totalAssignments = unit.assignments.length;
  const completedAssignments = unit.assignments.filter(a => a.submissions.length > 0).length;
  const assignmentPercentage = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  // Calculate average score from completed assignments
  const scoredAssignments = unit.assignments.filter(a => a.submissions[0]?.percentage !== null && a.submissions[0]?.percentage !== undefined);
  const averageScore = scoredAssignments.length > 0
    ? scoredAssignments.reduce((sum, a) => sum + (a.submissions[0]?.percentage || 0), 0) / scoredAssignments.length
    : 0;

  // Determine status based on progress
  let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED' | 'MASTERED' = 'NOT_STARTED';

  if (completedAssignments === 0) {
    status = 'NOT_STARTED';
  } else if (assignmentPercentage >= 100 && averageScore >= 90) {
    status = 'MASTERED';
  } else if (assignmentPercentage >= 100) {
    status = 'COMPLETED';
  } else if (averageScore < 70 && completedAssignments > 0) {
    status = 'REVIEW_NEEDED';
  } else {
    status = 'IN_PROGRESS';
  }

  // Analyze concept mastery (based on assignment performance)
  const { strengths, struggles, recommendedReview } = await analyzeConceptMastery(
    unit,
    studentId,
    averageScore
  );

  // Calculate engagement score (based on participation and completion rate)
  const engagementScore = calculateEngagementScore(completedAssignments, totalAssignments, averageScore);

  // Get or create progress record
  let progress = await prisma.unitProgress.findUnique({
    where: {
      unitId_studentId: {
        unitId,
        studentId,
      },
    },
  });

  const now = new Date();

  if (!progress) {
    progress = await prisma.unitProgress.create({
      data: {
        unitId,
        studentId,
        classId: unit.schedule.classId,
        schoolId: unit.schoolId,
        status,
        percentComplete: assignmentPercentage,
        assignmentsTotal: totalAssignments,
        assignmentsCompleted: completedAssignments,
        assignmentsScore: averageScore,
        conceptsTotal: unit.concepts.length,
        conceptsMastered: strengths.length,
        masteryPercentage: unit.concepts.length > 0 ? (strengths.length / unit.concepts.length) * 100 : 0,
        timeSpentMinutes: 0, // Will be tracked separately
        firstAccessedAt: now,
        lastAccessedAt: now,
        completedAt: status === 'COMPLETED' || status === 'MASTERED' ? now : null,
        strengths,
        struggles,
        recommendedReview,
        engagementScore,
        participationCount: 0,
      },
    });
  } else {
    progress = await prisma.unitProgress.update({
      where: { id: progress.id },
      data: {
        status,
        percentComplete: assignmentPercentage,
        assignmentsTotal: totalAssignments,
        assignmentsCompleted: completedAssignments,
        assignmentsScore: averageScore,
        conceptsMastered: strengths.length,
        masteryPercentage: unit.concepts.length > 0 ? (strengths.length / unit.concepts.length) * 100 : 0,
        lastAccessedAt: now,
        completedAt: status === 'COMPLETED' || status === 'MASTERED' ? (progress.completedAt || now) : null,
        strengths,
        struggles,
        recommendedReview,
        engagementScore,
      },
    });
  }

  // Update unit's percent complete (aggregate all students)
  await updateUnitOverallProgress(unitId);

  return {
    unitId,
    studentId,
    status: progress.status,
    percentComplete: progress.percentComplete,
    assignmentsCompleted: progress.assignmentsCompleted,
    assignmentsTotal: progress.assignmentsTotal,
    assignmentsScore: progress.assignmentsScore,
    conceptsMastered: progress.conceptsMastered,
    conceptsTotal: progress.conceptsTotal,
    masteryPercentage: progress.masteryPercentage,
    strengths: progress.strengths,
    struggles: progress.struggles,
    recommendedReview: progress.recommendedReview,
  };
}

/**
 * Update progress when an assignment is submitted
 */
export async function updateProgressOnSubmission(
  assignmentId: string,
  studentId: string
): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      curriculumUnitId: true,
    },
  });

  if (!assignment || !assignment.curriculumUnitId) {
    return; // Not linked to a curriculum unit
  }

  // Recalculate progress for this unit
  await calculateUnitProgress(assignment.curriculumUnitId, studentId);
}

/**
 * Record time spent in a unit
 */
export async function recordTimeSpent(
  unitId: string,
  studentId: string,
  minutes: number
): Promise<void> {
  const progress = await prisma.unitProgress.findUnique({
    where: {
      unitId_studentId: {
        unitId,
        studentId,
      },
    },
  });

  if (progress) {
    await prisma.unitProgress.update({
      where: { id: progress.id },
      data: {
        timeSpentMinutes: {
          increment: minutes,
        },
        lastAccessedAt: new Date(),
      },
    });
  } else {
    // Create progress record if first time accessing
    const unit = await prisma.curriculumUnit.findUnique({
      where: { id: unitId },
      include: { schedule: true },
    });

    if (unit) {
      await prisma.unitProgress.create({
        data: {
          unitId,
          studentId,
          classId: unit.schedule.classId,
          schoolId: unit.schoolId,
          timeSpentMinutes: minutes,
          firstAccessedAt: new Date(),
          lastAccessedAt: new Date(),
          conceptsTotal: unit.concepts.length,
        },
      });
    }
  }
}

/**
 * Record student participation in a unit (e.g., discussion, activity)
 */
export async function recordParticipation(
  unitId: string,
  studentId: string
): Promise<void> {
  const progress = await prisma.unitProgress.findUnique({
    where: {
      unitId_studentId: {
        unitId,
        studentId,
      },
    },
  });

  if (progress) {
    await prisma.unitProgress.update({
      where: { id: progress.id },
      data: {
        participationCount: {
          increment: 1,
        },
        lastAccessedAt: new Date(),
      },
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Analyze concept mastery based on assignment performance
 */
async function analyzeConceptMastery(
  unit: any,
  studentId: string,
  averageScore: number
): Promise<{
  strengths: string[];
  struggles: string[];
  recommendedReview: string[];
}> {
  // Simple heuristic: if average score is high, concepts are strengths
  // if low, concepts are struggles
  // In future, this could analyze per-assignment topics for granular insights

  const strengths: string[] = [];
  const struggles: string[] = [];
  const recommendedReview: string[] = [];

  if (averageScore >= 85) {
    // High performance - all concepts are strengths
    strengths.push(...unit.concepts);
  } else if (averageScore >= 70) {
    // Medium performance - some concepts solid, some need review
    const conceptCount = unit.concepts.length;
    const strongCount = Math.floor(conceptCount * 0.6);
    strengths.push(...unit.concepts.slice(0, strongCount));
    recommendedReview.push(...unit.concepts.slice(strongCount));
  } else {
    // Low performance - most concepts are struggles
    const conceptCount = unit.concepts.length;
    const struggleCount = Math.floor(conceptCount * 0.7);
    struggles.push(...unit.concepts.slice(0, struggleCount));
    recommendedReview.push(...unit.concepts);
  }

  return { strengths, struggles, recommendedReview };
}

/**
 * Calculate engagement score based on completion rate and performance
 */
function calculateEngagementScore(
  completedAssignments: number,
  totalAssignments: number,
  averageScore: number
): number {
  if (totalAssignments === 0) return 0;

  const completionRate = completedAssignments / totalAssignments;
  const scoreRate = averageScore / 100;

  // Weighted average: 60% completion, 40% performance
  return (completionRate * 0.6 + scoreRate * 0.4) * 100;
}

/**
 * Update unit's overall progress (aggregate all students)
 */
async function updateUnitOverallProgress(unitId: string): Promise<void> {
  const progressRecords = await prisma.unitProgress.findMany({
    where: { unitId },
  });

  if (progressRecords.length === 0) {
    return;
  }

  const averageProgress = progressRecords.reduce((sum, p) => sum + p.percentComplete, 0) / progressRecords.length;

  await prisma.curriculumUnit.update({
    where: { id: unitId },
    data: {
      percentComplete: averageProgress,
    },
  });
}

/**
 * Identify concepts student excels at across multiple units
 */
export async function identifyStrengths(
  studentId: string,
  scheduleId: string
): Promise<string[]> {
  const progressRecords = await prisma.unitProgress.findMany({
    where: {
      studentId,
      unit: {
        scheduleId,
      },
    },
  });

  const allStrengths = progressRecords.flatMap(p => p.strengths);

  // Count frequency of each concept
  const conceptFrequency = new Map<string, number>();
  allStrengths.forEach(concept => {
    conceptFrequency.set(concept, (conceptFrequency.get(concept) || 0) + 1);
  });

  // Return concepts that appear in multiple units (true strengths)
  return Array.from(conceptFrequency.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([concept]) => concept);
}

/**
 * Identify concepts student struggles with across multiple units
 */
export async function identifyStruggles(
  studentId: string,
  scheduleId: string
): Promise<string[]> {
  const progressRecords = await prisma.unitProgress.findMany({
    where: {
      studentId,
      unit: {
        scheduleId,
      },
    },
  });

  const allStruggles = progressRecords.flatMap(p => p.struggles);

  // Count frequency of each concept
  const conceptFrequency = new Map<string, number>();
  allStruggles.forEach(concept => {
    conceptFrequency.set(concept, (conceptFrequency.get(concept) || 0) + 1);
  });

  // Return concepts that appear in multiple units (persistent struggles)
  return Array.from(conceptFrequency.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([concept]) => concept);
}

/**
 * Recommend topics for additional review
 */
export async function recommendReview(
  studentId: string,
  scheduleId: string
): Promise<string[]> {
  const progressRecords = await prisma.unitProgress.findMany({
    where: {
      studentId,
      unit: {
        scheduleId,
      },
      status: {
        in: ['REVIEW_NEEDED', 'IN_PROGRESS'],
      },
    },
    include: {
      unit: true,
    },
  });

  // Prioritize concepts from units needing review with low mastery
  const reviewConcepts = progressRecords
    .filter(p => p.masteryPercentage < 70)
    .flatMap(p => p.recommendedReview);

  // Deduplicate and return
  return Array.from(new Set(reviewConcepts));
}
