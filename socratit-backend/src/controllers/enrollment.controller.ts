// ============================================================================
// ENROLLMENT CONTROLLER
// Handles student enrollment and roster management endpoints
// ============================================================================

import { Response } from 'express';
import { prisma } from '../config/database';
import {
  AuthenticatedRequest,
  ApiResponse,
  EnrollWithCodeRequestBody,
  AddStudentsRequestBody,
  ProcessEnrollmentRequestBody,
} from '../types';
import { AppError } from '../middleware/errorHandler';
import { validateClassCode } from '../utils/validation';
import { logAudit } from '../services/audit.service';
import {
  notifyTeachersOfEnrollmentRequest,
  notifyStudentEnrollmentApproved,
  notifyStudentEnrollmentRejected,
  notifyStudentAddedToClass,
  notifyStudentRemovedFromClass,
} from '../services/notification.service';

/**
 * @route   POST /api/v1/enrollments
 * @desc    Enroll in a class with class code (student self-enrollment)
 * @access  Student only
 */
export const enrollWithCode = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const body = req.body as EnrollWithCodeRequestBody;

    // Validate class code
    const validation = await validateClassCode(body.classCode);

    if (!validation.isValid) {
      throw new AppError(validation.reason!, 400);
    }

    const classData = validation.class!;

    // Verify student and class are in the same school
    if (classData.schoolId !== schoolId) {
      throw new AppError('Class not found', 404);
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classData.id,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'PENDING') {
        throw new AppError('You have already requested to join this class', 409);
      } else if (existingEnrollment.status === 'APPROVED') {
        throw new AppError('You are already enrolled in this class', 409);
      } else if (existingEnrollment.status === 'REJECTED') {
        throw new AppError('Your previous enrollment request was rejected', 403);
      } else if (existingEnrollment.status === 'REMOVED') {
        throw new AppError('You were previously removed from this class', 403);
      }
    }

    // Create pending enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: classData.id,
        studentId,
        status: 'PENDING',
      },
      include: {
        class: {
          include: {
            teachers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gradeLevel: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      userId: studentId,
      schoolId,
      action: 'ENROLL_STUDENT',
      resourceType: 'enrollment',
      resourceId: enrollment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        classId: classData.id,
        className: classData.name,
        status: 'PENDING',
      },
    });

    // Notify teachers
    await notifyTeachersOfEnrollmentRequest(
      classData.id,
      `${req.user!.firstName} ${req.user!.lastName}`,
      classData.name,
      schoolId
    );

    const response: ApiResponse = {
      success: true,
      data: enrollment,
      message: 'Enrollment request submitted. Awaiting teacher approval.',
    };

    res.status(201).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   GET /api/v1/enrollments
 * @desc    Get all enrollments for the current student
 * @access  Student only
 */
export const getStudentEnrollments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { status, academicYear } = req.query;

    // Build filter
    const filter: any = {
      studentId,
    };

    if (status) {
      filter.status = status;
    }

    // Fetch enrollments
    let enrollments = await prisma.classEnrollment.findMany({
      where: filter,
      include: {
        class: {
          include: {
            teachers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        processor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by academic year if provided
    if (academicYear) {
      enrollments = enrollments.filter(
        (e) => e.class.academicYear === academicYear
      );
    }

    const response: ApiResponse = {
      success: true,
      data: enrollments,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   GET /api/v1/enrollments/:enrollmentId
 * @desc    Get enrollment details
 * @access  Student (must be own enrollment) or Teacher (must teach class)
 */
export const getEnrollmentById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Enrollment is attached by middleware
    const enrollment = req.enrollment;

    // Fetch complete enrollment data
    const fullEnrollment = await prisma.classEnrollment.findUnique({
      where: { id: enrollment.id },
      include: {
        class: {
          include: {
            teachers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gradeLevel: true,
          },
        },
        processor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: fullEnrollment,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   GET /api/v1/classes/:classId/enrollments
 * @desc    Get all enrollments for a class (roster)
 * @access  Teacher (must teach class)
 */
export const getClassEnrollments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const classData = req.class;
    const { status } = req.query;

    // Build filter
    const filter: any = {
      classId: classData.id,
    };

    if (status) {
      filter.status = status;
    }

    // Fetch enrollments
    const enrollments = await prisma.classEnrollment.findMany({
      where: filter,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gradeLevel: true,
            profilePhotoUrl: true,
          },
        },
        processor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then APPROVED, etc.
        { createdAt: 'desc' },
      ],
    });

    const response: ApiResponse = {
      success: true,
      data: enrollments,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   POST /api/v1/classes/:classId/enrollments
 * @desc    Manually add students to class (auto-approved)
 * @access  Teacher (must teach class)
 */
export const addStudentsToClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const classData = req.class;
    const body = req.body as AddStudentsRequestBody;

    // Find all students by email
    const students = await prisma.user.findMany({
      where: {
        email: { in: body.studentEmails },
        role: 'STUDENT',
        schoolId,
        deletedAt: null,
      },
    });

    // Check if all emails were found
    if (students.length !== body.studentEmails.length) {
      const foundEmails = students.map((s) => s.email);
      const notFound = body.studentEmails.filter((e) => !foundEmails.includes(e));
      throw new AppError(
        `The following student emails were not found: ${notFound.join(', ')}`,
        404
      );
    }

    const createdEnrollments = [];
    const existingEnrollments = [];

    // Create or update enrollments
    for (const student of students) {
      // Check if already enrolled
      const existing = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: classData.id,
            studentId: student.id,
          },
        },
      });

      if (existing) {
        if (existing.status === 'APPROVED') {
          existingEnrollments.push(student.email);
          continue;
        } else {
          // Update existing enrollment to APPROVED
          const updated = await prisma.classEnrollment.update({
            where: { id: existing.id },
            data: {
              status: 'APPROVED',
              processedAt: new Date(),
              processedBy: teacherId,
            },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  gradeLevel: true,
                },
              },
            },
          });
          createdEnrollments.push(updated);
        }
      } else {
        // Create new enrollment with APPROVED status
        const enrollment = await prisma.classEnrollment.create({
          data: {
            classId: classData.id,
            studentId: student.id,
            status: 'APPROVED',
            processedAt: new Date(),
            processedBy: teacherId,
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                gradeLevel: true,
              },
            },
          },
        });
        createdEnrollments.push(enrollment);
      }

      // Log audit event
      await logAudit({
        userId: teacherId,
        schoolId,
        action: 'ENROLL_STUDENT',
        resourceType: 'enrollment',
        resourceId: student.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent'),
        metadata: {
          classId: classData.id,
          className: classData.name,
          studentId: student.id,
          studentEmail: student.email,
          status: 'APPROVED',
          method: 'manual_add',
        },
      });

      // Notify student
      await notifyStudentAddedToClass(
        student.id,
        classData.name,
        classData.id,
        `${req.user!.firstName} ${req.user!.lastName}`,
        schoolId
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        created: createdEnrollments,
        alreadyEnrolled: existingEnrollments,
      },
      message: `Successfully added ${createdEnrollments.length} student(s) to ${classData.name}`,
    };

    res.status(201).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   PATCH /api/v1/classes/:classId/enrollments/:enrollmentId
 * @desc    Approve, reject, or remove a student enrollment
 * @access  Teacher (must teach class)
 */
export const processEnrollment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const classData = req.class;
    const body = req.body as ProcessEnrollmentRequestBody;
    const enrollmentId = req.params.enrollmentId;

    // Find enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
        classId: classData.id,
      },
      include: {
        student: true,
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Update enrollment
    const updatedEnrollment = await prisma.classEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: body.status,
        processedAt: new Date(),
        processedBy: teacherId,
        rejectionReason: body.rejectionReason,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gradeLevel: true,
          },
        },
        processor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log audit event
    const auditAction =
      body.status === 'APPROVED'
        ? 'APPROVE_ENROLLMENT'
        : body.status === 'REJECTED'
        ? 'REJECT_ENROLLMENT'
        : 'REMOVE_STUDENT';

    await logAudit({
      userId: teacherId,
      schoolId,
      action: auditAction,
      resourceType: 'enrollment',
      resourceId: enrollmentId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        classId: classData.id,
        className: classData.name,
        studentId: enrollment.studentId,
        studentEmail: enrollment.student.email,
        status: body.status,
        rejectionReason: body.rejectionReason,
      },
    });

    // Send appropriate notification
    if (body.status === 'APPROVED') {
      await notifyStudentEnrollmentApproved(
        enrollment.studentId,
        classData.name,
        classData.id,
        schoolId
      );
    } else if (body.status === 'REJECTED') {
      await notifyStudentEnrollmentRejected(
        enrollment.studentId,
        classData.name,
        schoolId,
        body.rejectionReason
      );
    } else if (body.status === 'REMOVED') {
      await notifyStudentRemovedFromClass(enrollment.studentId, classData.name, schoolId);
    }

    const message =
      body.status === 'APPROVED'
        ? 'Student enrollment approved'
        : body.status === 'REJECTED'
        ? 'Student enrollment rejected'
        : 'Student removed from class';

    const response: ApiResponse = {
      success: true,
      data: updatedEnrollment,
      message,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * @route   DELETE /api/v1/classes/:classId/enrollments/:enrollmentId
 * @desc    Remove a student from class (soft delete)
 * @access  Teacher (must teach class)
 */
export const removeStudentFromClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const classData = req.class;
    const enrollmentId = req.params.enrollmentId;

    // Find enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
        classId: classData.id,
      },
      include: {
        student: true,
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Update status to REMOVED
    await prisma.classEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'REMOVED',
        processedAt: new Date(),
        processedBy: teacherId,
      },
    });

    // Log audit event
    await logAudit({
      userId: teacherId,
      schoolId,
      action: 'REMOVE_STUDENT',
      resourceType: 'enrollment',
      resourceId: enrollmentId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        classId: classData.id,
        className: classData.name,
        studentId: enrollment.studentId,
        studentEmail: enrollment.student.email,
      },
    });

    // Notify student
    await notifyStudentRemovedFromClass(enrollment.studentId, classData.name, schoolId);

    const response: ApiResponse = {
      success: true,
      message: 'Student removed from class',
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};
