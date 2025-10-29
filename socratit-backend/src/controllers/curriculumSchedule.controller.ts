// ============================================================================
// CURRICULUM SCHEDULE CONTROLLER
// HTTP request handlers for curriculum scheduling endpoints
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import {
  createSchedule,
  getScheduleById,
  updateSchedule,
  publishSchedule,
  deleteSchedule,
  generateScheduleFromAI,
  refineScheduleWithAI,
  getScheduleImprovementSuggestions,
  calculateScheduleProgress,
} from '../services/curriculumSchedule.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import {
  createScheduleSchema,
  generateScheduleFromAISchema,
  updateScheduleSchema,
  refineScheduleWithAISchema,
  scheduleQuerySchema,
} from '../validators/curriculumSchedule.validator';
import { AuthRequest } from '../types';

// ============================================================================
// SCHEDULE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new curriculum schedule
 * POST /api/v1/curriculum/schedules
 */
export async function createScheduleHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const { error, value } = createScheduleSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    // Create schedule
    const schedule = await createSchedule(
      value,
      req.user!.id,
      req.user!.schoolId
    );

    res.status(201).json({
      success: true,
      message: 'Curriculum schedule created successfully',
      data: schedule,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get schedule by ID
 * GET /api/v1/curriculum/schedules/:scheduleId
 */
export async function getScheduleHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    // Validate query parameters
    const { error: queryError, value: queryValue } = scheduleQuerySchema.validate(req.query);
    if (queryError) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryError.details.map(d => d.message),
      });
      return;
    }

    const schedule = await getScheduleById(scheduleId, req.user!.id, {
      includeProgress: queryValue.includeProgress,
      includeAssignments: queryValue.includeAssignments,
    });

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get all schedules for a class
 * GET /api/v1/curriculum/classes/:classId/schedules
 */
export async function getClassSchedulesHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { classId } = req.params;

    // Fetch schedules for the class
    const schedules = await prisma.curriculumSchedule.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        units: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Update schedule
 * PATCH /api/v1/curriculum/schedules/:scheduleId
 */
export async function updateScheduleHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    // Validate request body
    const { error, value } = updateScheduleSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    const schedule = await updateSchedule(scheduleId, value, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Publish schedule (make visible to students)
 * POST /api/v1/curriculum/schedules/:scheduleId/publish
 */
export async function publishScheduleHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const schedule = await publishSchedule(scheduleId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Schedule published successfully',
      data: schedule,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Delete schedule (soft delete)
 * DELETE /api/v1/curriculum/schedules/:scheduleId
 */
export async function deleteScheduleHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    await deleteSchedule(scheduleId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
}

// ============================================================================
// AI INTEGRATION ENDPOINTS
// ============================================================================

/**
 * Generate schedule from AI
 * POST /api/v1/curriculum/schedules/:scheduleId/generate-ai
 */
export async function generateScheduleFromAIHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    // Validate request body
    const { error, value } = generateScheduleFromAISchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    const result = await generateScheduleFromAI(scheduleId, value, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Schedule generated successfully from AI',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Refine schedule with AI (chat-based)
 * POST /api/v1/curriculum/schedules/:scheduleId/refine-ai
 */
export async function refineScheduleWithAIHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    // Validate request body
    const { error, value } = refineScheduleWithAISchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    const result = await refineScheduleWithAI(scheduleId, value, req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get AI improvement suggestions
 * GET /api/v1/curriculum/schedules/:scheduleId/suggestions
 */
export async function getScheduleSuggestionsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const suggestions = await getScheduleImprovementSuggestions(scheduleId, req.user!.id);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    next(error);
  }
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Calculate and update schedule progress
 * POST /api/v1/curriculum/schedules/:scheduleId/calculate-progress
 */
export async function calculateProgressHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    await calculateScheduleProgress(scheduleId);

    res.status(200).json({
      success: true,
      message: 'Schedule progress calculated successfully',
    });
  } catch (error: any) {
    next(error);
  }
}
