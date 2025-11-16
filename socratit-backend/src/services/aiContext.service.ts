/**
 * AI CONTEXT SERVICE
 * Builds intelligent context for AI Teaching Assistant
 * Aggregates student data: grades, concept mastery, assignment progress
 * FERPA compliant: anonymizes PII before sending to OpenAI
 */

import { PrismaClient, User, Class, Assignment, ConceptMastery } from '@prisma/client';
import { prisma } from '../config/database';

export interface StudentContext {
  // Student info (anonymized)
  firstName: string; // Only first name, no last name
  gradeLevel: string;
  role: string;

  // Class context
  className?: string;
  subject?: string;
  classGradeLevel?: string;

  // Performance metrics
  recentGrades: number[]; // Last 5 assignment scores
  averageGrade?: number;
  completionRate?: number;

  // Concept mastery
  strugglingConcepts: Array<{
    concept: string;
    masteryPercent: number;
    masteryLevel: string;
  }>;
  masteredConcepts: string[];

  // Assignment context (if applicable)
  assignmentContext?: AssignmentContext;

  // Learning patterns
  totalAssignmentsCompleted: number;
  averageTimePerAssignment?: number; // minutes
  lastActivityDate?: Date;
}

export interface AssignmentContext {
  title: string;
  description?: string;
  instructions?: string;
  type: string;
  dueDate?: Date;
  totalQuestions: number;
  questionsCompleted: number;
  currentScore?: number;
  timeSpent: number; // minutes
  concepts: string[];
  currentQuestion?: {
    questionText: string;
    type: string;
    concept?: string;
    points: number;
  };
}

export interface ConceptContext {
  concept: string;
  masteryLevel: string;
  masteryPercent: number;
  totalAttempts: number;
  correctAttempts: number;
  lastAssessed?: Date;
  relatedQuestions: number;
}

export class AIContextService {
  /**
   * Build complete student context for AI
   */
  async buildStudentContext(
    studentId: string,
    classId?: string,
    assignmentId?: string,
    currentQuestionId?: string
  ): Promise<StudentContext> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        school: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const context: StudentContext = {
      firstName: student.firstName, // FERPA: Only first name
      gradeLevel: student.gradeLevel || 'Unknown',
      role: student.role,
      recentGrades: [],
      strugglingConcepts: [],
      masteredConcepts: [],
      totalAssignmentsCompleted: 0,
    };

    // Add class context if provided
    if (classId) {
      const classData = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (classData) {
        context.className = classData.name;
        context.subject = classData.subject || undefined;
        context.classGradeLevel = classData.gradeLevel || undefined;
      }
    }

    // Fetch recent grades (last 5 assignments)
    const recentGrades = await this.getRecentGrades(studentId, classId);
    context.recentGrades = recentGrades;
    context.averageGrade = recentGrades.length > 0
      ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length
      : undefined;

    // Fetch concept mastery
    const conceptMastery = await this.getConceptMastery(studentId, classId);
    context.strugglingConcepts = conceptMastery.struggling;
    context.masteredConcepts = conceptMastery.mastered;

    // Fetch student progress
    const progress = await this.getStudentProgress(studentId, classId);
    context.totalAssignmentsCompleted = progress.completed;
    context.completionRate = progress.completionRate;
    context.averageTimePerAssignment = progress.avgTime;

    // Add assignment context if helping with specific assignment
    if (assignmentId) {
      context.assignmentContext = await this.getAssignmentContext(
        assignmentId,
        studentId,
        currentQuestionId
      );
    }

    return context;
  }

  /**
   * Get recent assignment grades
   */
  private async getRecentGrades(
    studentId: string,
    classId?: string
  ): Promise<number[]> {
    const whereClause: any = {
      studentId,
      gradeType: 'assignment',
    };

    if (classId) {
      whereClause.classId = classId;
    }

    const grades = await prisma.grade.findMany({
      where: whereClause,
      orderBy: { gradeDate: 'desc' },
      take: 5,
      select: { percentage: true },
    });

    return grades.map((g) => Math.round(g.percentage));
  }

  /**
   * Get concept mastery data
   */
  private async getConceptMastery(studentId: string, classId?: string) {
    const whereClause: any = { studentId };
    if (classId) whereClause.classId = classId;

    const masteries = await prisma.conceptMastery.findMany({
      where: whereClause,
      orderBy: { masteryPercent: 'asc' },
    });

    const struggling = masteries
      .filter((m) => m.masteryPercent < 70)
      .slice(0, 5) // Top 5 struggling concepts
      .map((m) => ({
        concept: m.concept,
        masteryPercent: Math.round(m.masteryPercent),
        masteryLevel: m.masteryLevel,
      }));

    const mastered = masteries
      .filter((m) => m.masteryPercent >= 90)
      .map((m) => m.concept);

    return { struggling, mastered };
  }

  /**
   * Get student progress metrics
   */
  private async getStudentProgress(studentId: string, classId?: string) {
    const whereClause: any = { studentId };
    if (classId) whereClause.classId = classId;

    const progress = await prisma.studentProgress.findFirst({
      where: whereClause,
    });

    return {
      completed: progress?.completedAssignments || 0,
      completionRate: progress?.completionRate || 0,
      avgTime: progress?.averageTimePerAssignment || undefined,
    };
  }

  /**
   * Get assignment-specific context
   */
  async getAssignmentContext(
    assignmentId: string,
    studentId: string,
    currentQuestionId?: string
  ): Promise<AssignmentContext> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        questions: {
          select: {
            concept: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Get student's progress on this assignment
    const progress = await prisma.assignmentProgress.findUnique({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId,
        },
      },
    });

    // Get submission if exists
    const submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract unique concepts
    const concepts: string[] = [
      ...new Set(
        assignment.questions
          .map((q) => q.concept)
          .filter((c): c is string => c !== null)
      ),
    ];

    // Get current question details if provided
    let currentQuestion;
    if (currentQuestionId) {
      const question = await prisma.question.findUnique({
        where: { id: currentQuestionId },
        select: {
          questionText: true,
          type: true,
          concept: true,
          points: true,
        },
      });

      if (question) {
        currentQuestion = {
          questionText: question.questionText,
          type: question.type,
          concept: question.concept || undefined,
          points: question.points,
        };
      }
    }

    return {
      title: assignment.title,
      description: assignment.description || undefined,
      instructions: assignment.instructions || undefined,
      type: assignment.type,
      dueDate: assignment.dueDate || undefined,
      totalQuestions: assignment.questions.length,
      questionsCompleted: progress?.questionsAnswered || 0,
      currentScore: submission?.percentage || undefined,
      timeSpent: progress?.timeSpent || 0,
      concepts,
      currentQuestion,
    };
  }

  /**
   * Get concept-specific context for targeted help
   */
  async getConceptContext(
    studentId: string,
    concept: string,
    classId?: string
  ): Promise<ConceptContext | null> {
    const whereClause: any = {
      studentId,
      concept,
    };
    if (classId) whereClause.classId = classId;

    const mastery = await prisma.conceptMastery.findFirst({
      where: whereClause,
    });

    if (!mastery) {
      return null;
    }

    // Count questions related to this concept
    const relatedQuestions = await prisma.question.count({
      where: {
        concept,
        assignment: classId
          ? {
              classId,
            }
          : undefined,
      },
    });

    return {
      concept: mastery.concept,
      masteryLevel: mastery.masteryLevel,
      masteryPercent: Math.round(mastery.masteryPercent),
      totalAttempts: mastery.totalAttempts,
      correctAttempts: mastery.correctAttempts,
      lastAssessed: mastery.lastAssessed || undefined,
      relatedQuestions,
    };
  }

  /**
   * Format context for AI prompt (anonymized, concise)
   */
  formatContextForPrompt(context: StudentContext): string {
    let formatted = `Student: ${context.firstName} (${context.gradeLevel})`;

    if (context.className) {
      formatted += `\nClass: ${context.className}`;
      if (context.subject) formatted += ` (${context.subject})`;
    }

    if (context.averageGrade !== undefined) {
      formatted += `\nAverage Grade: ${Math.round(context.averageGrade)}%`;
    }

    if (context.strugglingConcepts.length > 0) {
      formatted += `\n\nStruggling with:`;
      context.strugglingConcepts.forEach((c) => {
        formatted += `\n- ${c.concept} (${c.masteryPercent}% mastery)`;
      });
    }

    if (context.masteredConcepts.length > 0) {
      formatted += `\n\nMastered concepts: ${context.masteredConcepts.join(', ')}`;
    }

    if (context.assignmentContext) {
      const ac = context.assignmentContext;
      formatted += `\n\nCurrent Assignment: ${ac.title}`;
      formatted += `\nProgress: ${ac.questionsCompleted}/${ac.totalQuestions} questions`;
      if (ac.currentScore !== undefined) {
        formatted += `\nCurrent Score: ${Math.round(ac.currentScore)}%`;
      }
      if (ac.concepts.length > 0) {
        formatted += `\nConcepts: ${ac.concepts.join(', ')}`;
      }
      if (ac.currentQuestion) {
        formatted += `\n\n**Student is currently working on this question:**`;
        formatted += `\nQuestion: ${ac.currentQuestion.questionText}`;
        formatted += `\nType: ${ac.currentQuestion.type}`;
        if (ac.currentQuestion.concept) {
          formatted += `\nConcept: ${ac.currentQuestion.concept}`;
        }
        formatted += `\nPoints: ${ac.currentQuestion.points}`;
      }
    }

    return formatted;
  }

  /**
   * Check if student has hit daily message limit
   */
  async checkMessageLimit(studentId: string): Promise<{
    allowed: boolean;
    count: number;
    limit: number;
  }> {
    const limit = 500; // Soft cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count messages sent today
    const count = await prisma.aIMessage.count({
      where: {
        role: 'USER',
        conversation: {
          studentId,
        },
        createdAt: {
          gte: today,
        },
      },
    });

    return {
      allowed: count < limit,
      count,
      limit,
    };
  }
}

export default new AIContextService();
