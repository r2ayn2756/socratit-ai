// ============================================================================
import { AuthenticatedRequest } from '../types';
// SUBMISSION CONTROLLER
// Handles student submissions, answers, and auto-grading
// ============================================================================

import { Response } from 'express';
import { PrismaClient, SubmissionStatus, QuestionType } from '@prisma/client';
import { UserPayload } from '../types';
import { gradeFreeResponse } from '../services/ai.service';
import { createAuditLog } from '../utils/audit';
import { saveAssignmentGrade } from '../services/grade.service';

const prisma = new PrismaClient();

// ============================================================================
// START ASSIGNMENT
// POST /api/v1/submissions/start
// Creates a new submission when student opens an assignment
// ============================================================================

export async function startAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId } = req.body;

    // Verify assignment exists and is active
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        questions: true,
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found or not available',
      });
      return;
    }

    // Verify student is enrolled in the class
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

    // Check if student has existing submission
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: user.id,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    // Check if they've exceeded max attempts
    if (existingSubmission && existingSubmission.attemptNumber >= assignment.maxAttempts) {
      res.status(400).json({
        success: false,
        message: `Maximum attempts (${assignment.maxAttempts}) reached for this assignment`,
      });
      return;
    }

    // Calculate next attempt number
    const attemptNumber = existingSubmission ? existingSubmission.attemptNumber + 1 : 1;

    // Create new submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: user.id,
        status: SubmissionStatus.IN_PROGRESS,
        attemptNumber,
        startedAt: new Date(),
        possiblePoints: assignment.totalPoints,
        ipAddress: req.ip || 'unknown',
      },
      include: {
        assignment: {
          include: {
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
                explanation: true,
                concept: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        studentId: user.id,
        assignmentId,
        submissionId: submission.id,
        schoolId: user.schoolId,
        eventType: 'assignment_started',
        eventData: {
          attemptNumber,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Assignment started successfully',
    });
  } catch (error: any) {
    console.error('Error starting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start assignment',
      errors: [error.message],
    });
  }
}

// ============================================================================
// SUBMIT ANSWER
// POST /api/v1/submissions/:submissionId/answers
// Submits answer to a single question with instant grading
// ============================================================================

export async function submitAnswer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { submissionId } = req.params;
    const { questionId, answerText, selectedOption } = req.body;

    // Verify submission exists and belongs to student
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        studentId: user.id,
      },
      include: {
        assignment: {
          include: {
            questions: true,
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

    // Check if submission is still in progress
    if (submission.status !== SubmissionStatus.IN_PROGRESS) {
      res.status(400).json({
        success: false,
        message: 'This submission has already been submitted',
      });
      return;
    }

    // For essay assignments, handle differently since they don't have questions
    const isEssay = submission.assignment.type === 'ESSAY';

    // Find the question (or handle essay case)
    const question = submission.assignment.questions.find((q) => q.id === questionId);
    if (!question && !isEssay) {
      res.status(404).json({
        success: false,
        message: 'Question not found in this assignment',
      });
      return;
    }

    // For essays, validate that questionId follows the expected pattern
    if (isEssay && !questionId.startsWith('essay-')) {
      res.status(400).json({
        success: false,
        message: 'Invalid essay submission format',
      });
      return;
    }

    // Check if answer already exists
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        submissionId,
        questionId,
      },
    });

    // Grade the answer based on question type
    let isCorrect: boolean | null = null;
    let pointsEarned: number | null = null;
    let aiFeedback: string | null = null;
    let aiScore: number | null = null;
    let aiConfidence: number | null = null;
    let aiGraded = false;

    // For essays, store content but leave ungraded for teacher manual grading
    if (isEssay) {
      // Essays are not auto-graded - teacher will grade manually
      isCorrect = null;
      pointsEarned = null;
      aiGraded = false;
    } else if (question && question.type === QuestionType.MULTIPLE_CHOICE && selectedOption) {
      // Instant grading for multiple choice
      isCorrect = selectedOption === question.correctOption;
      pointsEarned = isCorrect ? question.points : 0;
    } else if (question && question.type === QuestionType.FREE_RESPONSE && answerText) {
      // AI grading for free response
      try {
        const gradingResult = await gradeFreeResponse(
          answerText,
          question.correctAnswer || '',
          question.rubric,
          question.questionText,
          question.points
        );

        isCorrect = gradingResult.isCorrect;
        pointsEarned = Math.round(gradingResult.score * question.points * 100) / 100;
        aiFeedback = gradingResult.feedback;
        aiScore = gradingResult.score;
        aiConfidence = gradingResult.confidence;
        aiGraded = true;
      } catch (error) {
        console.error('Error grading free response:', error);
        // If AI grading fails, leave it ungraded for manual grading
        isCorrect = null;
        pointsEarned = null;
      }
    }

    // For essays, points possible comes from assignment total points, not question
    const pointsPossible = isEssay ? submission.assignment.totalPoints : (question?.points || 0);

    // Create or update answer
    const answer = existingAnswer
      ? await prisma.answer.update({
          where: {
            id: existingAnswer.id,
          },
          data: {
            answerText,
            selectedOption,
            isCorrect,
            pointsEarned,
            pointsPossible,
            aiGraded,
            aiFeedback,
            aiScore,
            aiConfidence,
            answeredAt: new Date(),
            gradedAt: isCorrect !== null ? new Date() : null,
          },
          include: isEssay ? undefined : {
            question: {
              select: {
                id: true,
                questionText: true,
                type: true,
                points: true,
                explanation: true,
                correctOption: submission.assignment.showCorrectAnswers,
                correctAnswer: submission.assignment.showCorrectAnswers,
              },
            },
          },
        })
      : await prisma.answer.create({
          data: {
            submissionId,
            questionId,
            answerText,
            selectedOption,
            isCorrect,
            pointsEarned,
            pointsPossible,
            aiGraded,
            aiFeedback,
            aiScore,
            aiConfidence,
            answeredAt: new Date(),
            gradedAt: isCorrect !== null ? new Date() : null,
          },
          include: isEssay ? undefined : {
            question: {
              select: {
                id: true,
                questionText: true,
                type: true,
                points: true,
                explanation: true,
                correctOption: submission.assignment.showCorrectAnswers,
                correctAnswer: submission.assignment.showCorrectAnswers,
              },
            },
          },
        });

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        studentId: user.id,
        assignmentId: submission.assignmentId,
        submissionId: submission.id,
        questionId: isEssay ? null : questionId,
        schoolId: user.schoolId,
        eventType: isEssay ? 'essay_submitted' : 'answer_submitted',
        eventData: {
          questionType: isEssay ? 'ESSAY' : question?.type,
          isCorrect,
          pointsEarned,
          aiGraded,
          wordCount: isEssay && answerText ? answerText.split(/\s+/).filter(Boolean).length : undefined,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent'),
      },
    });

    res.status(200).json({
      success: true,
      data: answer,
      message: 'Answer submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      errors: [error.message],
    });
  }
}

// ============================================================================
// SUBMIT ASSIGNMENT
// POST /api/v1/submissions/:submissionId/submit
// Finalizes submission and calculates total grade
// ============================================================================

export async function submitAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { submissionId } = req.params;

    // Verify submission exists and belongs to student
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        studentId: user.id,
      },
      include: {
        assignment: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!submission) {
      res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
      return;
    }

    // Check if submission is still in progress
    if (submission.status !== SubmissionStatus.IN_PROGRESS) {
      res.status(400).json({
        success: false,
        message: 'This submission has already been submitted',
      });
      return;
    }

    // Calculate total score
    const totalScore = submission.answers.reduce(
      (sum, answer) => sum + (answer.pointsEarned || 0),
      0
    );
    const possiblePoints = submission.assignment.totalPoints;
    const percentage = possiblePoints > 0 ? (totalScore / possiblePoints) * 100 : 0;

    // Calculate time spent
    const timeSpent = submission.startedAt
      ? Math.floor((new Date().getTime() - submission.startedAt.getTime()) / 1000)
      : null;

    // Check if late
    const isLate = submission.assignment.dueDate
      ? new Date() > submission.assignment.dueDate
      : false;

    // Determine grading status
    const hasUngradedFreeResponse = submission.answers.some(
      (answer) => answer.isCorrect === null
    );
    const status = hasUngradedFreeResponse
      ? SubmissionStatus.SUBMITTED
      : SubmissionStatus.GRADED;

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        status,
        submittedAt: new Date(),
        gradedAt: !hasUngradedFreeResponse ? new Date() : null,
        totalScore,
        earnedPoints: totalScore,
        possiblePoints,
        percentage: Math.round(percentage * 100) / 100,
        timeSpent,
        isLate,
      },
      include: {
        assignment: {
          include: {
            questions: {
              orderBy: {
                questionOrder: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'SUBMIT_ASSIGNMENT',
      resourceType: 'submission',
      resourceId: submission.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        assignmentId: submission.assignmentId,
        totalScore,
        percentage,
        isLate,
      },
    });

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        studentId: user.id,
        assignmentId: submission.assignmentId,
        submissionId: submission.id,
        schoolId: user.schoolId,
        eventType: 'assignment_submitted',
        eventData: {
          totalScore,
          percentage,
          timeSpent,
          isLate,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent'),
      },
    });

    // Save grade to Grade table (Batch 4)
    await saveAssignmentGrade(submissionId);

    // TODO: Send notification to teacher (Batch 6)

    res.status(200).json({
      success: true,
      data: updatedSubmission,
      message: 'Assignment submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET SUBMISSIONS (Teacher)
// GET /api/v1/submissions
// Teachers can view all submissions for their assignments
// ============================================================================

export async function getSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { assignmentId, studentId, status, includeAnswers, limit, offset } = req.query;

    // Build where clause
    let whereClause: any = {};

    if (user.role === 'TEACHER') {
      // Teachers see submissions for their assignments
      if (assignmentId) {
        // Verify teacher owns this assignment
        const assignment = await prisma.assignment.findFirst({
          where: {
            id: assignmentId as string,
            createdBy: user.id,
            schoolId: user.schoolId,
          },
        });

        if (!assignment) {
          res.status(403).json({
            success: false,
            message: 'You do not have permission to view these submissions',
          });
          return;
        }

        whereClause.assignmentId = assignmentId as string;
      } else {
        // Get all assignments created by this teacher
        const teacherAssignments = await prisma.assignment.findMany({
          where: {
            createdBy: user.id,
            schoolId: user.schoolId,
          },
          select: {
            id: true,
          },
        });

        whereClause.assignmentId = {
          in: teacherAssignments.map((a) => a.id),
        };
      }

      if (studentId) {
        whereClause.studentId = studentId as string;
      }
    } else if (user.role === 'STUDENT') {
      // Students only see their own submissions
      whereClause.studentId = user.id;
      if (assignmentId) {
        whereClause.assignmentId = assignmentId as string;
      }
    }

    if (status) {
      whereClause.status = status as SubmissionStatus;
    }

    // Get submissions
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            dueDate: true,
            class: {
              select: {
                id: true,
                name: true,
                color: true,
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
          },
        },
        answers: includeAnswers === 'true' ? {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                questionText: true,
                questionOrder: true,
                points: true,
                correctOption: user.role === 'TEACHER',
                correctAnswer: user.role === 'TEACHER',
              },
            },
          },
        } : false,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
    });

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        limit: Number(limit) || 20,
        offset: Number(offset) || 0,
        total: await prisma.submission.count({ where: whereClause }),
      },
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET SINGLE SUBMISSION
// GET /api/v1/submissions/:submissionId
// ============================================================================

export async function getSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        assignment: {
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
                color: true,
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
          },
        },
        answers: {
          include: {
            question: {
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
                correctOption: true,
                correctAnswer: true,
                explanation: true,
                rubric: true,
              },
            },
          },
          orderBy: {
            question: {
              questionOrder: 'asc',
            },
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

    // Check permissions
    if (
      user.role === 'STUDENT' &&
      submission.studentId !== user.id
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this submission',
      });
      return;
    }

    if (
      user.role === 'TEACHER' &&
      submission.assignment.createdBy !== user.id
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this submission',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission',
      errors: [error.message],
    });
  }
}

// ============================================================================
// OVERRIDE GRADE (Teacher)
// PATCH /api/v1/submissions/:submissionId/answers/:answerId/grade
// Allows teachers to manually override AI grading
// ============================================================================

export async function overrideGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user as UserPayload;
    const { submissionId, answerId } = req.params;
    const { pointsEarned, teacherFeedback } = req.body;

    // Verify submission and answer exist
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        submissionId,
      },
      include: {
        submission: {
          include: {
            assignment: true,
          },
        },
        question: true,
      },
    });

    if (!answer) {
      res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
      return;
    }

    // Verify teacher owns the assignment
    if (answer.submission.assignment.createdBy !== user.id) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to grade this submission',
      });
      return;
    }

    // Validate points earned
    if (pointsEarned < 0 || pointsEarned > answer.question.points) {
      res.status(400).json({
        success: false,
        message: `Points earned must be between 0 and ${answer.question.points}`,
      });
      return;
    }

    // Update answer
    const updatedAnswer = await prisma.answer.update({
      where: {
        id: answerId,
      },
      data: {
        pointsEarned,
        isCorrect: pointsEarned >= answer.question.points * 0.7, // 70% threshold
        teacherFeedback,
        manuallyGraded: true,
        teacherOverride: true,
        gradedAt: new Date(),
      },
    });

    // Recalculate submission total score
    const allAnswers = await prisma.answer.findMany({
      where: {
        submissionId,
      },
    });

    const newTotalScore = allAnswers.reduce(
      (sum, a) => sum + (a.pointsEarned || 0),
      0
    );
    const percentage =
      answer.submission.assignment.totalPoints > 0
        ? (newTotalScore / answer.submission.assignment.totalPoints) * 100
        : 0;

    // Update submission with new score and mark as graded
    await prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        totalScore: newTotalScore,
        earnedPoints: newTotalScore,
        percentage: Math.round(percentage * 100) / 100,
        status: SubmissionStatus.GRADED,
        gradedAt: new Date(),
        gradedBy: user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'GRADE_ASSIGNMENT',
      resourceType: 'answer',
      resourceId: answerId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
      metadata: {
        submissionId,
        pointsEarned,
        teacherOverride: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedAnswer,
      message: 'Grade updated successfully',
    });
  } catch (error: any) {
    console.error('Error overriding grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override grade',
      errors: [error.message],
    });
  }
}
