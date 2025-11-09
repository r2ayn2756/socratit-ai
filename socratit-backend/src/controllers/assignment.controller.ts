// ============================================================================
import { AuthenticatedRequest } from '../types';
// ASSIGNMENT CONTROLLER
// Handles CRUD operations for assignments and AI quiz generation
// ============================================================================

import { Response } from 'express';
import { PrismaClient, AssignmentStatus, AssignmentType } from '@prisma/client';
import { UserPayload } from '../types';
import { generateQuizFromCurriculum, isOpenAIConfigured } from '../services/ai.service';
import { createAuditLog } from '../utils/audit';

const prisma = new PrismaClient();

// ============================================================================
// CREATE ASSIGNMENT
// POST /api/v1/assignments
// ============================================================================

export async function createAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const {
      classId,
      title,
      description,
      instructions,
      type,
      totalPoints,
      passingScore,
      dueDate,
      closeDate,
      allowLateSubmission,
      showCorrectAnswers,
      shuffleQuestions,
      shuffleOptions,
      timeLimit,
      maxAttempts,
      questions,
    } = req.body;

    // Verify teacher has access to this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
      include: {
        class: true,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to create assignments for this class',
      });
      return;
    }

    // Create assignment with questions (if provided)
    const assignment = await prisma.assignment.create({
      data: {
        classId,
        schoolId: user.schoolId,
        createdBy: user.id,
        title,
        description,
        instructions,
        type: type as AssignmentType,
        totalPoints: totalPoints || 100,
        passingScore,
        dueDate: dueDate ? new Date(dueDate) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        allowLateSubmission: allowLateSubmission || false,
        showCorrectAnswers: showCorrectAnswers ?? true,
        shuffleQuestions: shuffleQuestions || false,
        shuffleOptions: shuffleOptions || false,
        timeLimit,
        maxAttempts: maxAttempts || 1,
        questions: questions
          ? {
              create: questions.map((q: any, index: number) => ({
                type: q.type,
                questionText: q.questionText,
                questionOrder: q.questionOrder || index + 1,
                points: q.points || 10,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctOption: q.correctOption,
                correctAnswer: q.correctAnswer,
                rubric: q.rubric,
                explanation: q.explanation,
                concept: q.concept,
                difficulty: q.difficulty,
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          orderBy: {
            questionOrder: 'asc',
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'CREATE_ASSIGNMENT',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        classId,
        title,
        type,
      },
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GENERATE QUIZ WITH AI
// POST /api/v1/assignments/generate
// ============================================================================

export async function generateQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const {
      classId,
      curriculumText,
      assignmentType,
      numQuestions,
      questionTypes,
      difficulty,
      subject,
      gradeLevel,
    } = req.body;

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      res.status(503).json({
        success: false,
        message: 'AI quiz generation is not available. OpenAI API key is not configured.',
      });
      return;
    }

    // Verify teacher has access to this class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: user.id,
      },
      include: {
        class: true,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to create assignments for this class',
      });
      return;
    }

    // Generate quiz using AI
    const quizResult = await generateQuizFromCurriculum(curriculumText, {
      assignmentType,
      numQuestions,
      questionTypes,
      difficulty,
      subject: subject || classTeacher.class.subject || undefined,
      gradeLevel: gradeLevel || classTeacher.class.gradeLevel || undefined,
    });

    // Create assignment as draft with AI-generated questions
    const assignment = await prisma.assignment.create({
      data: {
        classId,
        schoolId: user.schoolId,
        createdBy: user.id,
        title: quizResult.title,
        description: quizResult.description,
        type: assignmentType as AssignmentType,
        totalPoints: quizResult.totalPoints,
        timeLimit: quizResult.estimatedTimeMinutes,
        aiGenerated: true,
        aiPrompt: curriculumText,
        curriculumSource: curriculumText, // Store full curriculum text for reference
        status: AssignmentStatus.DRAFT,
        questions: {
          create: quizResult.questions.map((q, index) => ({
            type: q.type,
            questionText: q.questionText,
            questionOrder: index + 1,
            points: q.points,
            optionA: q.options?.[0]?.text,
            optionB: q.options?.[1]?.text,
            optionC: q.options?.[2]?.text,
            optionD: q.options?.[3]?.text,
            correctOption: q.correctOption,
            correctAnswer: q.correctAnswer,
            rubric: q.rubric,
            explanation: q.explanation,
            concept: q.concept,
            difficulty: q.difficulty,
            aiGenerated: true,
          })),
        },
      },
      include: {
        questions: {
          orderBy: {
            questionOrder: 'asc',
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'AI_GENERATE_QUIZ',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        classId,
        numQuestions,
        assignmentType,
      },
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Quiz generated successfully with AI',
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GENERATE ASSIGNMENT FROM LESSON
// POST /api/v1/assignments/generate-from-lesson
// ============================================================================

export async function generateAssignmentFromLesson(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const {
      lessonId,
      numQuestions,
      difficulty,
      assignmentType,
    } = req.body;

    // Check if AI is configured
    if (!isOpenAIConfigured()) {
      res.status(503).json({
        success: false,
        message: 'AI quiz generation is not available. AI API key is not configured.',
      });
      return;
    }

    // Fetch the lesson with transcript
    const lesson = await prisma.classLesson.findUnique({
      where: { id: lessonId },
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
    });

    if (!lesson) {
      res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
      return;
    }

    // Verify teacher has access to this lesson/class
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId: lesson.classId,
        teacherId: user.id,
      },
    });

    if (!classTeacher) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to create assignments for this class',
      });
      return;
    }

    // Check if lesson has a transcript
    if (!lesson.fullTranscript) {
      res.status(400).json({
        success: false,
        message: 'This lesson does not have a transcript to generate an assignment from',
      });
      return;
    }

    // Generate quiz using AI from the lesson transcript
    const quizResult = await generateQuizFromCurriculum(lesson.fullTranscript, {
      assignmentType: assignmentType || 'QUIZ',
      numQuestions: numQuestions || 10,
      questionTypes: ['MULTIPLE_CHOICE'],
      difficulty: difficulty || 'mixed',
      subject: lesson.class.subject || undefined,
      gradeLevel: lesson.class.gradeLevel || undefined,
    });

    // Create assignment as draft with AI-generated questions
    const assignment = await prisma.assignment.create({
      data: {
        classId: lesson.classId,
        schoolId: user.schoolId,
        createdBy: user.id,
        title: quizResult.title,
        description: quizResult.description || `Assignment based on lesson: ${lesson.title}`,
        type: (assignmentType || 'QUIZ') as AssignmentType,
        totalPoints: quizResult.totalPoints,
        timeLimit: quizResult.estimatedTimeMinutes,
        aiGenerated: true,
        aiPrompt: `Lesson: ${lesson.title}`,
        curriculumSource: lesson.summary, // Store full summary as source
        status: AssignmentStatus.DRAFT,
        questions: {
          create: quizResult.questions.map((q, index) => ({
            type: q.type,
            questionText: q.questionText,
            questionOrder: index + 1,
            points: q.points,
            optionA: q.options?.[0]?.text,
            optionB: q.options?.[1]?.text,
            optionC: q.options?.[2]?.text,
            optionD: q.options?.[3]?.text,
            correctOption: q.correctOption,
            correctAnswer: q.correctAnswer,
            rubric: q.rubric,
            explanation: q.explanation,
            concept: q.concept,
            difficulty: q.difficulty,
            aiGenerated: true,
          })),
        },
      },
      include: {
        questions: {
          orderBy: {
            questionOrder: 'asc',
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'AI_GENERATE_ASSIGNMENT_FROM_LESSON',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        lessonId,
        classId: lesson.classId,
        numQuestions,
        assignmentType,
      },
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment generated successfully from lesson',
    });
  } catch (error: any) {
    console.error('Error generating assignment from lesson:', error);

    // Check for specific error types
    let statusCode = 500;
    let message = 'Failed to generate assignment from lesson';

    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      statusCode = 429;
      message = 'AI service rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message?.includes('API key')) {
      statusCode = 503;
      message = 'AI service is not properly configured. Please contact support.';
    } else if (error.message?.includes('transcript')) {
      statusCode = 400;
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message,
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET ASSIGNMENTS
// GET /api/v1/assignments
// ============================================================================

export async function getAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const {
      classId,
      status,
      type,
      includeQuestions,
      limit,
      offset,
      sortBy,
      sortOrder,
    } = req.query;

    // Build where clause based on user role
    let whereClause: any = {
      schoolId: user.schoolId,
      deletedAt: null,
    };

    if (user.role === 'TEACHER') {
      // Teachers see assignments they created
      whereClause.createdBy = user.id;
    } else if (user.role === 'STUDENT') {
      // Students see published assignments from their enrolled classes
      const enrolledClasses = await prisma.classEnrollment.findMany({
        where: {
          studentId: user.id,
          status: 'APPROVED',
        },
        select: {
          classId: true,
        },
      });

      whereClause.classId = {
        in: enrolledClasses.map((e) => e.classId),
      };
      whereClause.status = AssignmentStatus.ACTIVE; // Students only see active assignments
    }

    // Apply filters
    if (classId) {
      whereClause.classId = classId as string;
    }
    if (status) {
      whereClause.status = status as AssignmentStatus;
    }
    if (type) {
      whereClause.type = type as AssignmentType;
    }

    // Get assignments
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        questions: includeQuestions === 'true' ? {
          orderBy: {
            questionOrder: 'asc',
          },
        } : false,
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
      orderBy: {
        [sortBy as string || 'createdAt']: sortOrder as 'asc' | 'desc' || 'desc',
      },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
    });

    // If student, include their submission status for each assignment
    let assignmentsWithStatus = assignments;
    if (user.role === 'STUDENT') {
      const submissionsMap = await prisma.submission.findMany({
        where: {
          studentId: user.id,
          assignmentId: {
            in: assignments.map((a) => a.id),
          },
        },
        select: {
          assignmentId: true,
          status: true,
          percentage: true,
          submittedAt: true,
        },
        orderBy: {
          attemptNumber: 'desc',
        },
      });

      const submissionsByAssignment = submissionsMap.reduce((acc: any, sub) => {
        if (!acc[sub.assignmentId]) {
          acc[sub.assignmentId] = sub;
        }
        return acc;
      }, {});

      assignmentsWithStatus = assignments.map((a: any) => ({
        ...a,
        studentSubmission: submissionsByAssignment[a.id] || null,
      }));
    }

    res.status(200).json({
      success: true,
      data: assignmentsWithStatus,
      pagination: {
        limit: Number(limit) || 20,
        offset: Number(offset) || 0,
        total: await prisma.assignment.count({ where: whereClause }),
      },
    });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET SINGLE ASSIGNMENT
// GET /api/v1/assignments/:assignmentId
// ============================================================================

export async function getAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        questions: {
          orderBy: {
            questionOrder: 'asc',
          },
          select: {
            id: true,
            type: true,
            questionText: true,
            questionOrder: true,
            points: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            // Don't expose correct answers to students before submission
            correctOption: user.role === 'TEACHER',
            correctAnswer: user.role === 'TEACHER',
            rubric: user.role === 'TEACHER',
            explanation: true,
            concept: true,
            difficulty: true,
            aiGenerated: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    // Check permissions
    if (user.role === 'TEACHER' && assignment.createdBy !== user.id) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this assignment',
      });
      return;
    }

    if (user.role === 'STUDENT') {
      // Check if student is enrolled in the class
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
      if (assignment.status !== AssignmentStatus.ACTIVE) {
        res.status(403).json({
          success: false,
          message: 'This assignment is not yet available',
        });
        return;
      }

      // Get student's submission status
      const submission = await prisma.submission.findFirst({
        where: {
          assignmentId: assignment.id,
          studentId: user.id,
        },
        orderBy: {
          attemptNumber: 'desc',
        },
        select: {
          id: true,
          status: true,
          attemptNumber: true,
          percentage: true,
          totalScore: true,
          submittedAt: true,
          gradedAt: true,
          startedAt: true,
          timeSpent: true,
          isLate: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          ...assignment,
          studentSubmission: submission || null,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment',
      errors: [error.message],
    });
  }
}

// ============================================================================
// UPDATE ASSIGNMENT
// PATCH /api/v1/assignments/:assignmentId
// ============================================================================

export async function updateAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;
    const updateData = req.body;

    // Verify assignment exists and teacher owns it
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
        message: 'Assignment not found or you do not have permission to update it',
      });
      return;
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        closeDate: updateData.closeDate ? new Date(updateData.closeDate) : undefined,
      },
      include: {
        questions: {
          orderBy: {
            questionOrder: 'asc',
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'UPDATE_ASSIGNMENT',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: updateData,
    });

    res.status(200).json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      errors: [error.message],
    });
  }
}

// ============================================================================
// DELETE ASSIGNMENT (Soft Delete)
// DELETE /api/v1/assignments/:assignmentId
// ============================================================================

export async function deleteAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;

    // Verify assignment exists and teacher owns it
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
        message: 'Assignment not found or you do not have permission to delete it',
      });
      return;
    }

    // Soft delete
    await prisma.assignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'DELETE_ASSIGNMENT',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      errors: [error.message],
    });
  }
}

// ============================================================================
// PUBLISH ASSIGNMENT
// POST /api/v1/assignments/:assignmentId/publish
// ============================================================================

export async function publishAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.params;
    const { publishNow, publishAt } = req.body;

    // Verify assignment exists and teacher owns it
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        createdBy: user.id,
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: {
        questions: true,
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found or you do not have permission to publish it',
      });
      return;
    }

    // Validate assignment has questions
    if (assignment.questions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot publish assignment without questions',
      });
      return;
    }

    // Determine new status
    let newStatus: AssignmentStatus;
    let publishedAt: Date | null = null;

    if (publishNow) {
      newStatus = AssignmentStatus.ACTIVE;
      publishedAt = new Date();
    } else if (publishAt) {
      newStatus = AssignmentStatus.SCHEDULED;
      publishedAt = new Date(publishAt);
    } else {
      res.status(400).json({
        success: false,
        message: 'Must specify either publishNow or publishAt',
      });
      return;
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        status: newStatus,
        publishedAt,
      },
      include: {
        questions: {
          orderBy: {
            questionOrder: 'asc',
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            color: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'PUBLISH_ASSIGNMENT',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        status: newStatus,
        publishedAt,
      },
    });

    // TODO: Send notifications to students (Batch 6)

    res.status(200).json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment published successfully',
    });
  } catch (error: any) {
    console.error('Error publishing assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish assignment',
      errors: [error.message],
    });
  }
}
