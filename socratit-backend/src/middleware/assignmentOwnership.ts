// ============================================================================
import { AuthenticatedRequest } from '../types';
// ASSIGNMENT OWNERSHIP MIDDLEWARE
// Verifies user has permission to access/modify assignments
// ============================================================================

import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserPayload } from '../types';

const prisma = new PrismaClient();

// ============================================================================
// REQUIRE ASSIGNMENT OWNER
// Verifies that the teacher created this assignment
// ============================================================================

export async function requireAssignmentOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;

    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can modify assignments',
      });
      return;
    }

    // Check if teacher created this assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        createdBy: user.id,
        schoolId: user.schoolId,
        deletedAt: null,
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found or you do not have permission to modify it',
      });
      return;
    }

    // Attach assignment to request for downstream use
    (req as any).assignment = assignment;
    next();
  } catch (error: any) {
    console.error('Error in requireAssignmentOwner middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify assignment ownership',
      errors: [error.message],
    });
  }
}

// ============================================================================
// REQUIRE ASSIGNMENT ACCESS
// Verifies user can view this assignment (teacher or enrolled student)
// ============================================================================

export async function requireAssignmentAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;

    // Find assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: {
        class: true,
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    // Teachers can view if they created it
    if (user.role === 'TEACHER') {
      if (assignment.createdBy !== user.id) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this assignment',
        });
        return;
      }
    }

    // Students can view if enrolled and assignment is active
    if (user.role === 'STUDENT') {
      // Check enrollment
      const enrollment = await prisma.classEnrollment.findFirst({
        where: {
          classId: assignment.classId,
          studentId: user.id,
          status: 'APPROVED',
        },
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class',
        });
        return;
      }

      // Check if assignment is published
      if (assignment.status !== 'ACTIVE') {
        res.status(403).json({
          success: false,
          message: 'This assignment is not yet available',
        });
        return;
      }
    }

    // Attach assignment to request
    (req as any).assignment = assignment;
    next();
  } catch (error: any) {
    console.error('Error in requireAssignmentAccess middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify assignment access',
      errors: [error.message],
    });
  }
}

// ============================================================================
// REQUIRE SUBMISSION OWNER
// Verifies student owns this submission OR teacher owns the assignment
// ============================================================================

export async function requireSubmissionAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { submissionId } = req.params;

    // Find submission
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        assignment: {
          include: {
            class: true,
          },
        },
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

    if (!submission) {
      res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
      return;
    }

    // Students can only access their own submissions
    if (user.role === 'STUDENT') {
      if (submission.studentId !== user.id) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to access this submission',
        });
        return;
      }
    }

    // Teachers can access if they created the assignment
    if (user.role === 'TEACHER') {
      if (submission.assignment.createdBy !== user.id) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to access this submission',
        });
        return;
      }
    }

    // Attach submission to request
    (req as any).submission = submission;
    next();
  } catch (error: any) {
    console.error('Error in requireSubmissionAccess middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify submission access',
      errors: [error.message],
    });
  }
}

// ============================================================================
// REQUIRE CLASS TEACHER FOR ASSIGNMENT CREATION
// Verifies teacher teaches the class they're creating assignment for
// ============================================================================

export async function requireClassTeacherForAssignment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { classId } = req.body;

    if (user.role !== 'TEACHER') {
      res.status(403).json({
        success: false,
        message: 'Only teachers can create assignments',
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

    // Check if teacher teaches this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            schoolId: true,
          },
        },
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to create assignments for this class',
      });
      return;
    }

    // Verify multi-tenancy
    if (classTeacher.class.schoolId !== user.schoolId) {
      res.status(403).json({
        success: false,
        message: 'School ID mismatch',
      });
      return;
    }

    // Attach class info to request
    (req as any).class = classTeacher.class;
    next();
  } catch (error: any) {
    console.error('Error in requireClassTeacherForAssignment middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify class teaching status',
      errors: [error.message],
    });
  }
}
