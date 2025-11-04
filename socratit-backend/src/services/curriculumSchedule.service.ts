// ============================================================================
// CURRICULUM SCHEDULE SERVICE
// Business logic for curriculum scheduling system
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateScheduleRequest,
  GenerateScheduleFromAIRequest,
  UpdateScheduleRequest,
  ScheduleResponse,
  AIScheduleResponse,
  ScheduleNotFoundError,
  UnauthorizedScheduleAccessError,
  InvalidScheduleDatesError,
  ScheduleGenerationError,
} from '../types/curriculum-scheduling.types';
import * as aiService from './ai.service';

const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate weeks between two dates
 */
function calculateWeeks(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

/**
 * Calculate instructional days (excluding weekends)
 */
function calculateInstructionalDays(startDate: Date, endDate: Date): number {
  let days = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday or Saturday
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

/**
 * Verify user has access to schedule
 */
async function verifyScheduleAccess(scheduleId: string, userId: string): Promise<boolean> {
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: {
        include: {
          teachers: true,
          enrollments: {
            where: { studentId: userId, status: 'APPROVED' },
          },
        },
      },
    },
  });

  if (!schedule) {
    return false;
  }

  // Teacher created the schedule
  if (schedule.teacherId === userId) {
    return true;
  }

  // Teacher teaches the class
  const isClassTeacher = schedule.class.teachers.some(ct => ct.teacherId === userId);
  if (isClassTeacher) {
    return true;
  }

  // Student is enrolled in the class
  const isEnrolled = schedule.class.enrollments.length > 0;
  if (isEnrolled) {
    return true;
  }

  return false;
}

// ============================================================================
// SCHEDULE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new curriculum schedule
 */
export async function createSchedule(
  data: CreateScheduleRequest,
  teacherId: string,
  schoolId: string
): Promise<ScheduleResponse> {
  const { classId, schoolYearStart, schoolYearEnd, meetingPattern, title, description, curriculumMaterialId } = data;

  // Validate dates
  const start = new Date(schoolYearStart);
  const end = new Date(schoolYearEnd);

  if (start >= end) {
    throw new InvalidScheduleDatesError('School year start date must be before end date');
  }

  // Calculate weeks and days
  const totalWeeks = calculateWeeks(start, end);
  const totalDays = calculateInstructionalDays(start, end);

  // Verify teacher has access to class
  const classRecord = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teachers: {
        where: { teacherId },
      },
    },
  });

  if (!classRecord || classRecord.teachers.length === 0) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Create schedule
  const schedule = await prisma.curriculumSchedule.create({
    data: {
      classId,
      teacherId,
      schoolId,
      schoolYearStart: start,
      schoolYearEnd: end,
      totalWeeks,
      totalDays,
      meetingPattern,
      title,
      description,
      curriculumMaterialId,
      totalUnits: 0,
      status: 'DRAFT',
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      units: true,
    },
  });

  return formatScheduleResponse(schedule);
}

/**
 * Get schedule by ID with all units
 */
export async function getScheduleById(
  scheduleId: string,
  userId: string,
  options: {
    includeProgress?: boolean;
    includeAssignments?: boolean;
  } = {}
): Promise<ScheduleResponse> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      currentUnit: true,
      units: {
        orderBy: { orderIndex: 'asc' },
        include: {
          assignments: options.includeAssignments,
          subUnits: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  });

  if (!schedule) {
    throw new ScheduleNotFoundError(scheduleId);
  }

  return formatScheduleResponse(schedule);
}

/**
 * Update schedule metadata
 */
export async function updateSchedule(
  scheduleId: string,
  data: UpdateScheduleRequest,
  userId: string
): Promise<ScheduleResponse> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  // If dates are being updated, recalculate weeks/days
  let updateData: any = { ...data };

  if (data.schoolYearStart || data.schoolYearEnd) {
    const schedule = await prisma.curriculumSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new ScheduleNotFoundError(scheduleId);
    }

    const start = data.schoolYearStart ? new Date(data.schoolYearStart) : schedule.schoolYearStart;
    const end = data.schoolYearEnd ? new Date(data.schoolYearEnd) : schedule.schoolYearEnd;

    if (start >= end) {
      throw new InvalidScheduleDatesError('School year start date must be before end date');
    }

    updateData.schoolYearStart = start;
    updateData.schoolYearEnd = end;
    updateData.totalWeeks = calculateWeeks(start, end);
    updateData.totalDays = calculateInstructionalDays(start, end);
  }

  const updated = await prisma.curriculumSchedule.update({
    where: { id: scheduleId },
    data: updateData,
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      currentUnit: true,
      units: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  return formatScheduleResponse(updated);
}

/**
 * Publish schedule (make visible to students)
 */
export async function publishSchedule(scheduleId: string, userId: string): Promise<ScheduleResponse> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  const updated = await prisma.curriculumSchedule.update({
    where: { id: scheduleId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      currentUnit: true,
      units: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  return formatScheduleResponse(updated);
}

/**
 * Soft delete schedule
 */
export async function deleteSchedule(scheduleId: string, userId: string): Promise<void> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  await prisma.curriculumSchedule.update({
    where: { id: scheduleId },
    data: {
      deletedAt: new Date(),
    },
  });
}

// ============================================================================
// AI SCHEDULE GENERATION
// ============================================================================

/**
 * Generate curriculum schedule using AI from uploaded curriculum material
 */
export async function generateScheduleFromAI(
  scheduleId: string,
  request: GenerateScheduleFromAIRequest,
  userId: string
): Promise<AIScheduleResponse> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Get schedule
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: true,
      curriculumMaterial: true,
    },
  });

  if (!schedule) {
    throw new ScheduleNotFoundError(scheduleId);
  }

  // Get curriculum material
  const curriculumMaterial = request.curriculumMaterialId
    ? await prisma.curriculumMaterial.findUnique({ where: { id: request.curriculumMaterialId } })
    : schedule.curriculumMaterial;

  if (!curriculumMaterial || !curriculumMaterial.extractedText) {
    throw new ScheduleGenerationError('Curriculum material not found or not yet processed');
  }

  // Call AI to generate schedule
  const aiResult = await aiService.analyzeCurriculumForScheduling(curriculumMaterial.extractedText, {
    gradeLevel: schedule.class.gradeLevel || 'High School',
    subject: schedule.class.subject || 'General',
    schoolYearStart: schedule.schoolYearStart,
    schoolYearEnd: schedule.schoolYearEnd,
    totalWeeks: schedule.totalWeeks,
    targetUnits: request.preferences?.targetUnits,
    pacingPreference: request.preferences?.pacingPreference,
  });

  // Create units from AI result
  const units = [];
  let currentDate = new Date(schedule.schoolYearStart);

  for (let i = 0; i < aiResult.units.length; i++) {
    const aiUnit = aiResult.units[i];

    // Calculate dates for this unit
    const startDate = new Date(currentDate);
    const endDate = addWeeks(currentDate, aiUnit.estimatedWeeks);

    // Create unit in database
    const unit = await prisma.curriculumUnit.create({
      data: {
        scheduleId: schedule.id,
        schoolId: schedule.schoolId,
        title: aiUnit.title,
        description: aiUnit.description,
        unitNumber: i + 1,
        orderIndex: i + 1,
        startDate,
        endDate,
        estimatedWeeks: aiUnit.estimatedWeeks,
        estimatedHours: aiUnit.estimatedHours,
        difficultyLevel: aiUnit.difficultyLevel,
        difficultyReasoning: aiUnit.difficultyReasoning,
        unitType: 'CORE',
        topics: aiUnit.subUnits as any, // Store sub-units in topics field for now (backwards compat)
        learningObjectives: aiUnit.subUnits.flatMap((su: any) => su.learningObjectives),
        concepts: aiUnit.subUnits.flatMap((su: any) => su.concepts),
        prerequisiteUnits: [],
        buildUponTopics: aiUnit.buildUponTopics,
        suggestedAssessments: aiUnit.suggestedAssessments as any,
        aiGenerated: true,
        aiConfidence: aiUnit.confidenceScore,
        status: 'SCHEDULED',
      },
    });

    // Create sub-units for this unit
    for (const subUnit of aiUnit.subUnits) {
      await prisma.curriculumSubUnit.create({
        data: {
          unitId: unit.id,
          schoolId: schedule.schoolId,
          name: subUnit.name,
          description: subUnit.description,
          orderIndex: subUnit.orderIndex,
          concepts: subUnit.concepts,
          learningObjectives: subUnit.learningObjectives,
          estimatedHours: subUnit.estimatedHours,
          aiGenerated: true,
        },
      });
    }

    units.push(unit);

    // Move current date to start of next unit (add 1 day buffer)
    currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Update schedule with total units and AI metadata
  await prisma.curriculumSchedule.update({
    where: { id: schedule.id },
    data: {
      totalUnits: units.length,
      aiGenerated: true,
      aiPromptUsed: 'analyzeCurriculumForScheduling',
      aiConfidence: aiResult.units.reduce((sum, u) => sum + u.confidenceScore, 0) / aiResult.units.length,
      lastAiRefinement: new Date(),
      curriculumMaterialId: curriculumMaterial.id,
    },
  });

  return {
    scheduleId: schedule.id,
    units: units.map(u => ({
      title: u.title,
      description: u.description || '',
      startDate: u.startDate.toISOString(),
      endDate: u.endDate.toISOString(),
      estimatedWeeks: u.estimatedWeeks,
      difficultyLevel: u.difficultyLevel,
      topics: u.topics as any,
      aiConfidence: u.aiConfidence || 0,
    })),
    metadata: {
      totalUnits: aiResult.metadata.totalUnits,
      estimatedTotalWeeks: aiResult.metadata.estimatedTotalWeeks,
      difficultyProgression: aiResult.metadata.difficultyProgression,
    },
  };
}

/**
 * Refine schedule with AI based on teacher feedback
 */
export async function refineScheduleWithAI(
  scheduleId: string,
  teacherRequest: string,
  userId: string
): Promise<any> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Get schedule with units
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: true,
      units: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!schedule) {
    throw new ScheduleNotFoundError(scheduleId);
  }

  // Call AI to get refinement suggestions
  const result = await aiService.refineScheduleWithAI(
    {
      units: schedule.units.map(u => ({
        id: u.id,
        title: u.title,
        startDate: u.startDate,
        endDate: u.endDate,
        estimatedWeeks: u.estimatedWeeks,
        difficultyLevel: u.difficultyLevel,
        topics: u.topics,
      })),
      schoolYearStart: schedule.schoolYearStart,
      schoolYearEnd: schedule.schoolYearEnd,
      totalWeeks: schedule.totalWeeks,
    },
    teacherRequest,
    {
      gradeLevel: schedule.class.gradeLevel || 'High School',
      subject: schedule.class.subject || 'General',
    }
  );

  return result;
}

/**
 * Get AI suggestions for improving schedule
 */
export async function getScheduleImprovementSuggestions(scheduleId: string, userId: string): Promise<any> {
  // Verify access
  const hasAccess = await verifyScheduleAccess(scheduleId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Get schedule with units
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: true,
      units: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!schedule) {
    throw new ScheduleNotFoundError(scheduleId);
  }

  // Call AI to get suggestions
  const suggestions = await aiService.getScheduleImprovementSuggestions(
    {
      units: schedule.units.map(u => ({
        title: u.title,
        estimatedWeeks: u.estimatedWeeks,
        difficultyLevel: u.difficultyLevel,
        orderInSequence: u.orderIndex,
      })),
      totalWeeks: schedule.totalWeeks,
    },
    {
      gradeLevel: schedule.class.gradeLevel || 'High School',
      subject: schedule.class.subject || 'General',
    }
  );

  return { suggestions };
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Calculate overall schedule progress
 */
export async function calculateScheduleProgress(scheduleId: string): Promise<void> {
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      units: true,
    },
  });

  if (!schedule) {
    return;
  }

  const now = new Date();
  let completedUnits = 0;
  let currentUnitId: string | null = null;

  // Determine completed units and current unit
  for (const unit of schedule.units) {
    if (unit.status === 'COMPLETED') {
      completedUnits++;
    } else if (unit.startDate <= now && unit.endDate >= now && unit.status === 'IN_PROGRESS') {
      currentUnitId = unit.id;
    } else if (unit.startDate <= now && !currentUnitId) {
      // First unit that has started but not completed
      if (unit.status === 'SCHEDULED' || unit.status === 'IN_PROGRESS' || unit.status === 'POSTPONED') {
        currentUnitId = unit.id;
      }
    }
  }

  const percentComplete = schedule.units.length > 0 ? (completedUnits / schedule.units.length) * 100 : 0;

  await prisma.curriculumSchedule.update({
    where: { id: scheduleId },
    data: {
      completedUnits,
      currentUnitId,
      percentComplete,
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format schedule for API response
 */
function formatScheduleResponse(schedule: any): ScheduleResponse {
  return {
    id: schedule.id,
    class: schedule.class,
    schoolYearStart: schedule.schoolYearStart.toISOString(),
    schoolYearEnd: schedule.schoolYearEnd.toISOString(),
    totalWeeks: schedule.totalWeeks,
    totalDays: schedule.totalDays,
    status: schedule.status,
    currentUnit: schedule.currentUnit
      ? {
          id: schedule.currentUnit.id,
          title: schedule.currentUnit.title,
          unitNumber: schedule.currentUnit.unitNumber,
        }
      : undefined,
    completedUnits: schedule.completedUnits,
    totalUnits: schedule.totalUnits,
    percentComplete: schedule.percentComplete,
    units: schedule.units ? schedule.units.map((u: any) => formatUnitForResponse(u)) : [],
    createdAt: schedule.createdAt.toISOString(),
    publishedAt: schedule.publishedAt?.toISOString(),
  };
}

/**
 * Format unit for API response
 */
function formatUnitForResponse(unit: any): any {
  return {
    id: unit.id,
    title: unit.title,
    description: unit.description,
    unitNumber: unit.unitNumber,
    startDate: unit.startDate.toISOString(),
    endDate: unit.endDate.toISOString(),
    estimatedWeeks: unit.estimatedWeeks,
    status: unit.status,
    difficultyLevel: unit.difficultyLevel,
    unitType: unit.unitType,
    topics: unit.topics,
    subUnits: unit.subUnits || [], // Include sub-units in response
    learningObjectives: unit.learningObjectives,
    concepts: unit.concepts,
    percentComplete: unit.percentComplete,
    assignments: unit.assignments,
  };
}
