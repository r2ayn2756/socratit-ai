// ============================================================================
// CURRICULUM UNIT SERVICE
// Business logic for curriculum unit management
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateUnitRequest,
  UpdateUnitRequest,
  ReorderUnitsRequest,
  UnitResponse,
  UnitProgressResponse,
  SuggestedAssignmentsResponse,
  UnitNotFoundError,
  UnauthorizedScheduleAccessError,
} from '../types/curriculum-scheduling.types';

const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify user has access to unit (via schedule/class)
 */
async function verifyUnitAccess(unitId: string, userId: string): Promise<boolean> {
  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    include: {
      schedule: {
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
      },
    },
  });

  if (!unit) {
    return false;
  }

  // Teacher created the schedule
  if (unit.schedule.teacherId === userId) {
    return true;
  }

  // Teacher teaches the class
  const isClassTeacher = unit.schedule.class.teachers.some(ct => ct.teacherId === userId);
  if (isClassTeacher) {
    return true;
  }

  // Student is enrolled
  const isEnrolled = unit.schedule.class.enrollments.length > 0;
  if (isEnrolled) {
    return true;
  }

  return false;
}

/**
 * Calculate weeks between dates
 */
function calculateWeeks(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

// ============================================================================
// UNIT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new curriculum unit
 */
export async function createUnit(
  data: CreateUnitRequest,
  teacherId: string,
  schoolId: string
): Promise<UnitResponse> {
  const { scheduleId, title, description, startDate, endDate, topics, difficultyLevel, unitType, isOptional } = data;

  // Verify teacher has access to schedule
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: {
        include: {
          teachers: {
            where: { teacherId },
          },
        },
      },
      units: {
        orderBy: { orderIndex: 'desc' },
        take: 1,
      },
    },
  });

  if (!schedule || schedule.class.teachers.length === 0) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Calculate unit number and order index
  const nextUnitNumber = schedule.units.length > 0 ? schedule.units[0].unitNumber + 1 : 1;
  const nextOrderIndex = schedule.units.length > 0 ? schedule.units[0].orderIndex + 1 : 1;

  // Calculate estimated weeks
  const start = new Date(startDate);
  const end = new Date(endDate);
  const estimatedWeeks = calculateWeeks(start, end);

  // Extract learning objectives and concepts from topics
  const learningObjectives = topics.flatMap(t => t.learningObjectives);
  const concepts = topics.flatMap(t => t.concepts);

  // Create unit
  const unit = await prisma.curriculumUnit.create({
    data: {
      scheduleId,
      schoolId,
      title,
      description,
      unitNumber: nextUnitNumber,
      orderIndex: nextOrderIndex,
      startDate: start,
      endDate: end,
      estimatedWeeks,
      difficultyLevel,
      unitType: unitType || 'CORE',
      isOptional: isOptional || false,
      topics: topics as any,
      learningObjectives,
      concepts,
      status: 'SCHEDULED',
      teacherModified: true, // Manually created = teacher modified
    },
  });

  // Update schedule total units
  await prisma.curriculumSchedule.update({
    where: { id: scheduleId },
    data: {
      totalUnits: {
        increment: 1,
      },
    },
  });

  return formatUnitResponse(unit);
}

/**
 * Get unit by ID with optional progress data
 */
export async function getUnitById(
  unitId: string,
  userId: string,
  options: {
    includeProgress?: boolean;
    includeAssignments?: boolean;
  } = {}
): Promise<UnitResponse> {
  // Verify access
  const hasAccess = await verifyUnitAccess(unitId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    include: {
      assignments: options.includeAssignments,
      studentProgress: options.includeProgress,
    },
  });

  if (!unit) {
    throw new UnitNotFoundError(unitId);
  }

  return formatUnitResponse(unit);
}

/**
 * Get all units for a schedule
 */
export async function getUnitsBySchedule(
  scheduleId: string,
  userId: string
): Promise<UnitResponse[]> {
  const units = await prisma.curriculumUnit.findMany({
    where: {
      scheduleId,
      deletedAt: null,
    },
    orderBy: { orderIndex: 'asc' },
    include: {
      assignments: true,
    },
  });

  return units.map(formatUnitResponse);
}

/**
 * Update unit details
 */
export async function updateUnit(
  unitId: string,
  data: UpdateUnitRequest,
  userId: string
): Promise<UnitResponse> {
  // Verify access
  const hasAccess = await verifyUnitAccess(unitId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Build update data
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.difficultyLevel !== undefined) updateData.difficultyLevel = data.difficultyLevel;
  if (data.unitType !== undefined) updateData.unitType = data.unitType;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.teacherModified !== undefined) updateData.teacherModified = data.teacherModified;

  // Handle date updates
  if (data.startDate || data.endDate) {
    const unit = await prisma.curriculumUnit.findUnique({ where: { id: unitId } });
    if (!unit) throw new UnitNotFoundError(unitId);

    const start = data.startDate ? new Date(data.startDate) : unit.startDate;
    const end = data.endDate ? new Date(data.endDate) : unit.endDate;

    updateData.startDate = start;
    updateData.endDate = end;
    updateData.estimatedWeeks = calculateWeeks(start, end);
  }

  // Handle topics update
  if (data.topics) {
    updateData.topics = data.topics as any;
    updateData.learningObjectives = data.topics.flatMap(t => t.learningObjectives);
    updateData.concepts = data.topics.flatMap(t => t.concepts);
  }

  // Mark as teacher modified
  updateData.teacherModified = true;

  const updated = await prisma.curriculumUnit.update({
    where: { id: unitId },
    data: updateData,
    include: {
      assignments: true,
    },
  });

  return formatUnitResponse(updated);
}

/**
 * Delete unit (soft delete)
 */
export async function deleteUnit(unitId: string, userId: string): Promise<void> {
  // Verify access
  const hasAccess = await verifyUnitAccess(unitId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    throw new UnitNotFoundError(unitId);
  }

  await prisma.curriculumUnit.update({
    where: { id: unitId },
    data: {
      deletedAt: new Date(),
    },
  });

  // Update schedule total units
  await prisma.curriculumSchedule.update({
    where: { id: unit.scheduleId },
    data: {
      totalUnits: {
        decrement: 1,
      },
    },
  });
}

/**
 * Reorder units (for drag-and-drop)
 */
export async function reorderUnits(
  data: ReorderUnitsRequest,
  userId: string
): Promise<void> {
  const { scheduleId, unitOrders } = data;

  // Verify access to schedule
  const schedule = await prisma.curriculumSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: {
        include: {
          teachers: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  const isTeacher = schedule.teacherId === userId || schedule.class.teachers.some(t => t.teacherId === userId);
  if (!isTeacher) {
    throw new UnauthorizedScheduleAccessError();
  }

  // Update each unit's order index and optionally dates
  for (const order of unitOrders) {
    const updateData: any = {
      orderIndex: order.orderIndex,
      teacherModified: true,
    };

    if (order.startDate && order.endDate) {
      const start = new Date(order.startDate);
      const end = new Date(order.endDate);
      updateData.startDate = start;
      updateData.endDate = end;
      updateData.estimatedWeeks = calculateWeeks(start, end);
    }

    await prisma.curriculumUnit.update({
      where: { id: order.unitId },
      data: updateData,
    });
  }
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Get unit progress for all students (teacher view)
 */
export async function getUnitProgress(
  unitId: string,
  userId: string
): Promise<UnitProgressResponse> {
  // Verify access
  const hasAccess = await verifyUnitAccess(unitId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    include: {
      studentProgress: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      schedule: {
        include: {
          class: {
            include: {
              enrollments: {
                where: { status: 'APPROVED' },
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

  const totalStudents = unit.schedule.class.enrollments.length;
  const studentsStarted = unit.studentProgress.filter(p => p.status !== 'NOT_STARTED').length;
  const studentsCompleted = unit.studentProgress.filter(
    p => p.status === 'COMPLETED' || p.status === 'MASTERED'
  ).length;

  const averageProgress =
    unit.studentProgress.length > 0
      ? unit.studentProgress.reduce((sum, p) => sum + p.percentComplete, 0) / unit.studentProgress.length
      : 0;

  const averageScore =
    unit.studentProgress.filter(p => p.assignmentsScore).length > 0
      ? unit.studentProgress
          .filter(p => p.assignmentsScore)
          .reduce((sum, p) => sum + (p.assignmentsScore || 0), 0) /
        unit.studentProgress.filter(p => p.assignmentsScore).length
      : 0;

  return {
    unit: {
      id: unit.id,
      title: unit.title,
      unitNumber: unit.unitNumber,
    },
    statistics: {
      totalStudents,
      studentsStarted,
      studentsCompleted,
      averageProgress,
      averageScore,
    },
    studentProgress: unit.studentProgress.map(p => ({
      studentId: p.student.id,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      status: p.status,
      percentComplete: p.percentComplete,
      assignmentsCompleted: p.assignmentsCompleted,
      assignmentsTotal: p.assignmentsTotal,
      assignmentsScore: p.assignmentsScore || 0,
      timeSpentMinutes: p.timeSpentMinutes,
      strengths: p.strengths,
      struggles: p.struggles,
    })),
  };
}

/**
 * Get AI-suggested assignments for a unit
 */
export async function getSuggestedAssignments(
  unitId: string,
  userId: string
): Promise<SuggestedAssignmentsResponse> {
  // Verify access
  const hasAccess = await verifyUnitAccess(unitId, userId);
  if (!hasAccess) {
    throw new UnauthorizedScheduleAccessError();
  }

  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    throw new UnitNotFoundError(unitId);
  }

  // Parse suggested assessments from AI generation
  const suggestedAssessments = (unit.suggestedAssessments as any) || [];

  return {
    suggestions: suggestedAssessments.map((assessment: any) => {
      const daysIntoUnit = assessment.timing === 'beginning' ? 2 : assessment.timing === 'middle' ? Math.floor((unit.estimatedWeeks * 7) / 2) : unit.estimatedWeeks * 7 - 2;

      const suggestedDate = new Date(unit.startDate);
      suggestedDate.setDate(suggestedDate.getDate() + daysIntoUnit);

      return {
        type: assessment.type.toUpperCase(),
        title: `${unit.title} - ${assessment.type}`,
        description: `Assessment for ${unit.title}`,
        suggestedTiming: assessment.timing,
        suggestedDate: suggestedDate.toISOString(),
        topicsCovered: unit.concepts,
        estimatedQuestions: assessment.estimatedQuestions || 10,
      };
    }),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format unit for API response
 */
function formatUnitResponse(unit: any): UnitResponse {
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
    learningObjectives: unit.learningObjectives,
    concepts: unit.concepts,
    percentComplete: unit.percentComplete,
    assignments: unit.assignments,
  };
}
