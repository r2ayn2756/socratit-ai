// ============================================================================
// CURRICULUM UNIT CONTROLLER
// HTTP request handlers for curriculum unit endpoints
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import {
  createUnit,
  getUnitById,
  getUnitsBySchedule,
  updateUnit,
  deleteUnit,
  reorderUnits,
  getUnitProgress,
  getSuggestedAssignments,
} from '../services/curriculumUnit.service';
import {
  getStudentProgress,
  getUnitProgressForStudent,
  calculateUnitProgress,
  recordTimeSpent,
  recordParticipation,
  identifyStrengths,
  identifyStruggles,
  recommendReview,
} from '../services/unitProgress.service';
import {
  createUnitSchema,
  updateUnitSchema,
  reorderUnitsSchema,
  unitQuerySchema,
} from '../validators/curriculumSchedule.validator';
import { AuthRequest } from '../types';

// ============================================================================
// UNIT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new curriculum unit
 * POST /api/v1/curriculum/units
 */
export async function createUnitHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const { error, value } = createUnitSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    const unit = await createUnit(value, req.user!.id, req.user!.schoolId);

    res.status(201).json({
      success: true,
      message: 'Curriculum unit created successfully',
      data: unit,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get unit by ID
 * GET /api/v1/curriculum/units/:unitId
 */
export async function getUnitHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    // Validate query parameters
    const { error: queryError, value: queryValue } = unitQuerySchema.validate(req.query);
    if (queryError) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryError.details.map(d => d.message),
      });
      return;
    }

    const unit = await getUnitById(unitId, req.user!.id, {
      includeProgress: queryValue.includeProgress,
      includeAssignments: queryValue.includeAssignments,
    });

    res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get all units for a schedule
 * GET /api/v1/curriculum/schedules/:scheduleId/units
 */
export async function getScheduleUnitsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const units = await getUnitsBySchedule(scheduleId, req.user!.id);

    res.status(200).json({
      success: true,
      data: units,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Update unit
 * PATCH /api/v1/curriculum/units/:unitId
 */
export async function updateUnitHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    // Validate request body
    const { error, value } = updateUnitSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    const unit = await updateUnit(unitId, value, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      data: unit,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Delete unit (soft delete)
 * DELETE /api/v1/curriculum/units/:unitId
 */
export async function deleteUnitHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    await deleteUnit(unitId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Reorder units (drag-and-drop)
 * POST /api/v1/curriculum/schedules/:scheduleId/units/reorder
 */
export async function reorderUnitsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const { error, value } = reorderUnitsSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
      return;
    }

    await reorderUnits(value, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Units reordered successfully',
    });
  } catch (error: any) {
    next(error);
  }
}

// ============================================================================
// PROGRESS TRACKING (TEACHER VIEW)
// ============================================================================

/**
 * Get unit progress for all students (teacher view)
 * GET /api/v1/curriculum/units/:unitId/progress
 */
export async function getUnitProgressHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    const progress = await getUnitProgress(unitId, req.user!.id);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get AI-suggested assignments for a unit
 * GET /api/v1/curriculum/units/:unitId/suggested-assignments
 */
export async function getSuggestedAssignmentsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    const suggestions = await getSuggestedAssignments(unitId, req.user!.id);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    next(error);
  }
}

// ============================================================================
// STUDENT PROGRESS TRACKING
// ============================================================================

/**
 * Get student's progress across all units in a schedule
 * GET /api/v1/curriculum/schedules/:scheduleId/my-progress
 */
export async function getMyProgressHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const progress = await getStudentProgress(scheduleId, req.user!.id);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get student's progress for a specific unit
 * GET /api/v1/curriculum/units/:unitId/my-progress
 */
export async function getMyUnitProgressHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    const progress = await getUnitProgressForStudent(unitId, req.user!.id);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Calculate/update progress for a unit (triggered by assignment submission)
 * POST /api/v1/curriculum/units/:unitId/calculate-progress
 */
export async function calculateUnitProgressHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;
    const { studentId } = req.body;

    // If studentId not provided, use current user (for students)
    const targetStudentId = studentId || req.user!.id;

    const result = await calculateUnitProgress(unitId, targetStudentId);

    res.status(200).json({
      success: true,
      message: 'Unit progress calculated successfully',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Record time spent in a unit (for engagement tracking)
 * POST /api/v1/curriculum/units/:unitId/record-time
 */
export async function recordTimeSpentHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0 || minutes > 600) {
      res.status(400).json({
        success: false,
        message: 'Invalid time value (must be 1-600 minutes)',
      });
      return;
    }

    await recordTimeSpent(unitId, req.user!.id, minutes);

    res.status(200).json({
      success: true,
      message: 'Time recorded successfully',
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Record student participation in a unit
 * POST /api/v1/curriculum/units/:unitId/record-participation
 */
export async function recordParticipationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { unitId } = req.params;

    await recordParticipation(unitId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Participation recorded successfully',
    });
  } catch (error: any) {
    next(error);
  }
}

// ============================================================================
// INSIGHTS & ANALYTICS
// ============================================================================

/**
 * Get student's strengths across a schedule
 * GET /api/v1/curriculum/schedules/:scheduleId/my-strengths
 */
export async function getMyStrengthsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const strengths = await identifyStrengths(req.user!.id, scheduleId);

    res.status(200).json({
      success: true,
      data: { strengths },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get student's struggles across a schedule
 * GET /api/v1/curriculum/schedules/:scheduleId/my-struggles
 */
export async function getMyStrugglesHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const struggles = await identifyStruggles(req.user!.id, scheduleId);

    res.status(200).json({
      success: true,
      data: { struggles },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Get recommended review topics for student
 * GET /api/v1/curriculum/schedules/:scheduleId/my-review
 */
export async function getMyReviewRecommendationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scheduleId } = req.params;

    const reviewTopics = await recommendReview(req.user!.id, scheduleId);

    res.status(200).json({
      success: true,
      data: { reviewTopics },
    });
  } catch (error: any) {
    next(error);
  }
}
