/**
 * AI INSIGHTS SERVICE
 * Aggregates AI TA usage data for teacher analytics
 * Runs daily via cron job to calculate insights
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

export interface CommonQuestion {
  question: string;
  count: number;
  concepts: string[];
  students: string[];
}

export interface StrugglingConcept {
  concept: string;
  helpRequestCount: number;
  students: string[];
  averageMastery: number;
}

export interface ActiveStudent {
  studentId: string;
  studentName: string;
  conversationCount: number;
  messageCount: number;
  avgHelpfulness?: number;
}

export interface InterventionAlert {
  studentId: string;
  studentName: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  conversationId?: string;
}

export class AIInsightsService {
  /**
   * Calculate insights for a class (daily cron job)
   */
  async calculateClassInsights(
    classId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teachers: true,
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Get all AI conversations for this class in period
    const conversations = await prisma.aIConversation.findMany({
      where: {
        classId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        messages: true,
        student: true,
      },
    });

    if (conversations.length === 0) {
      // No AI activity in this period
      return;
    }

    // Calculate metrics
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.messageCount,
      0
    );
    const uniqueStudents = new Set(conversations.map((c) => c.studentId)).size;

    const sessionLengths = conversations.map((c) => {
      if (!c.endedAt || !c.startedAt) return 0;
      return (c.endedAt.getTime() - c.startedAt.getTime()) / 1000 / 60; // minutes
    });
    const averageSessionLength =
      sessionLengths.length > 0
        ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length
        : 0;

    // Common questions
    const commonQuestions = await this.extractCommonQuestions(
      classId,
      periodStart,
      periodEnd
    );

    // Struggling concepts
    const strugglingConcepts = await this.identifyStrugglingConcepts(
      classId,
      periodStart,
      periodEnd
    );

    // Most active students
    const mostActiveStudents = await this.getMostActiveStudents(
      classId,
      periodStart,
      periodEnd
    );

    // Intervention needed
    const interventionNeeded = await this.identifyInterventionNeeded(
      classId,
      periodStart,
      periodEnd
    );

    // Calculate totals
    const totalTokens = conversations.reduce((sum, c) => sum + c.totalTokens, 0);
    const totalCost = conversations.reduce((sum, c) => sum + c.totalCost, 0);

    // Average helpfulness
    const allMessages = conversations.flatMap((c) => c.messages);
    const ratedMessages = allMessages.filter((m) => m.wasHelpful !== null);
    const averageHelpfulness =
      ratedMessages.length > 0
        ? ratedMessages.filter((m) => m.wasHelpful === true).length /
          ratedMessages.length
        : undefined;

    // Determine period type
    const daysDiff =
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const periodType =
      daysDiff <= 1 ? 'daily' : daysDiff <= 7 ? 'weekly' : 'monthly';

    // Create or update insight
    const teacherId = classData.teachers[0]?.teacherId;
    if (!teacherId) return;

    await prisma.aITeacherInsight.upsert({
      where: {
        classId_periodStart_periodEnd: {
          classId,
          periodStart,
          periodEnd,
        },
      },
      create: {
        teacherId,
        classId,
        schoolId: classData.schoolId,
        periodStart,
        periodEnd,
        periodType,
        totalConversations,
        totalMessages,
        totalStudents: uniqueStudents,
        averageSessionLength,
        commonQuestions: commonQuestions as any,
        strugglingConcepts: strugglingConcepts as any,
        mostActiveStudents: mostActiveStudents as any,
        interventionNeeded: interventionNeeded as any,
        averageHelpfulness,
        totalTokensUsed: totalTokens,
        totalCostUSD: totalCost,
        dataPoints: conversations.length,
      },
      update: {
        totalConversations,
        totalMessages,
        totalStudents: uniqueStudents,
        averageSessionLength,
        commonQuestions: commonQuestions as any,
        strugglingConcepts: strugglingConcepts as any,
        mostActiveStudents: mostActiveStudents as any,
        interventionNeeded: interventionNeeded as any,
        averageHelpfulness,
        totalTokensUsed: totalTokens,
        totalCostUSD: totalCost,
        dataPoints: conversations.length,
        lastCalculated: new Date(),
      },
    });
  }

  /**
   * Extract common questions asked by students
   */
  private async extractCommonQuestions(
    classId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CommonQuestion[]> {
    const interactions = await prisma.aIInteractionLog.findMany({
      where: {
        classId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        studentQuestion: {
          not: null,
        },
      },
      select: {
        studentQuestion: true,
        conceptTags: true,
        studentId: true,
      },
    });

    // Group similar questions (simple grouping by first 50 chars)
    const questionMap = new Map<string, CommonQuestion>();

    for (const interaction of interactions) {
      if (!interaction.studentQuestion) continue;

      const key = interaction.studentQuestion.substring(0, 50).toLowerCase();
      const existing = questionMap.get(key);

      if (existing) {
        existing.count++;
        existing.concepts = [
          ...new Set([...existing.concepts, ...interaction.conceptTags]),
        ];
        existing.students = [...new Set([...existing.students, interaction.studentId])];
      } else {
        questionMap.set(key, {
          question: interaction.studentQuestion,
          count: 1,
          concepts: interaction.conceptTags,
          students: [interaction.studentId],
        });
      }
    }

    // Return top 10
    return Array.from(questionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Identify concepts students are struggling with
   */
  private async identifyStrugglingConcepts(
    classId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<StrugglingConcept[]> {
    const interactions = await prisma.aIInteractionLog.findMany({
      where: {
        classId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        conceptTags: {
          isEmpty: false,
        },
      },
      select: {
        conceptTags: true,
        studentId: true,
      },
    });

    const conceptMap = new Map<string, { count: number; students: Set<string> }>();

    for (const interaction of interactions) {
      for (const concept of interaction.conceptTags) {
        const existing = conceptMap.get(concept);
        if (existing) {
          existing.count++;
          existing.students.add(interaction.studentId);
        } else {
          conceptMap.set(concept, {
            count: 1,
            students: new Set([interaction.studentId]),
          });
        }
      }
    }

    // Get mastery data for these concepts
    const concepts = Array.from(conceptMap.keys());
    const masteryData = await prisma.conceptMastery.findMany({
      where: {
        classId,
        concept: { in: concepts },
      },
      select: {
        concept: true,
        masteryPercent: true,
      },
    });

    const masteryMap = new Map<string, number[]>();
    for (const m of masteryData) {
      const existing = masteryMap.get(m.concept);
      if (existing) {
        existing.push(m.masteryPercent);
      } else {
        masteryMap.set(m.concept, [m.masteryPercent]);
      }
    }

    const result: StrugglingConcept[] = [];

    for (const [concept, data] of conceptMap.entries()) {
      const masteryLevels = masteryMap.get(concept) || [];
      const avgMastery =
        masteryLevels.length > 0
          ? masteryLevels.reduce((a, b) => a + b, 0) / masteryLevels.length
          : 0;

      result.push({
        concept,
        helpRequestCount: data.count,
        students: Array.from(data.students),
        averageMastery: Math.round(avgMastery),
      });
    }

    // Sort by help request count, filter those with low mastery
    return result
      .filter((c) => c.averageMastery < 70 || c.helpRequestCount >= 3)
      .sort((a, b) => b.helpRequestCount - a.helpRequestCount)
      .slice(0, 10);
  }

  /**
   * Get most active students
   */
  private async getMostActiveStudents(
    classId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ActiveStudent[]> {
    const conversations = await prisma.aIConversation.findMany({
      where: {
        classId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        student: true,
        messages: {
          where: {
            role: 'ASSISTANT',
            wasHelpful: {
              not: null,
            },
          },
        },
      },
    });

    const studentMap = new Map<string, ActiveStudent>();

    for (const conv of conversations) {
      const existing = studentMap.get(conv.studentId);
      const helpfulCount = conv.messages.filter((m) => m.wasHelpful === true).length;
      const totalRated = conv.messages.length;
      const avgHelpfulness =
        totalRated > 0 ? helpfulCount / totalRated : undefined;

      if (existing) {
        existing.conversationCount++;
        existing.messageCount += conv.messageCount;
        if (avgHelpfulness !== undefined) {
          existing.avgHelpfulness =
            ((existing.avgHelpfulness || 0) + avgHelpfulness) / 2;
        }
      } else {
        studentMap.set(conv.studentId, {
          studentId: conv.studentId,
          studentName: `${conv.student.firstName} ${conv.student.lastName.charAt(0)}.`,
          conversationCount: 1,
          messageCount: conv.messageCount,
          avgHelpfulness,
        });
      }
    }

    return Array.from(studentMap.values())
      .sort((a, b) => b.conversationCount - a.conversationCount)
      .slice(0, 10);
  }

  /**
   * Identify students who need teacher intervention
   */
  private async identifyInterventionNeeded(
    classId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<InterventionAlert[]> {
    const conversations = await prisma.aIConversation.findMany({
      where: {
        classId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        student: true,
        messages: true,
      },
    });

    const alerts: InterventionAlert[] = [];

    for (const conv of conversations) {
      // Long conversations (20+ messages)
      if (conv.messageCount >= 20) {
        alerts.push({
          studentId: conv.studentId,
          studentName: `${conv.student.firstName} ${conv.student.lastName.charAt(0)}.`,
          reason: `Extended AI conversation (${conv.messageCount} messages) - may need direct help`,
          severity: 'medium',
          conversationId: conv.id,
        });
      }

      // Many unhelpful responses
      const unhelpfulCount = conv.messages.filter(
        (m) => m.role === 'ASSISTANT' && m.wasHelpful === false
      ).length;

      if (unhelpfulCount >= 3) {
        alerts.push({
          studentId: conv.studentId,
          studentName: `${conv.student.firstName} ${conv.student.lastName.charAt(0)}.`,
          reason: `Marked ${unhelpfulCount} AI responses as unhelpful`,
          severity: 'high',
          conversationId: conv.id,
        });
      }

      // Flagged content
      const flaggedCount = conv.messages.filter((m) => m.flaggedContent).length;
      if (flaggedCount >= 1) {
        alerts.push({
          studentId: conv.studentId,
          studentName: `${conv.student.firstName} ${conv.student.lastName.charAt(0)}.`,
          reason: `${flaggedCount} messages flagged for review`,
          severity: 'high',
          conversationId: conv.id,
        });
      }
    }

    // Deduplicate by studentId (keep highest severity)
    const studentAlerts = new Map<string, InterventionAlert>();
    for (const alert of alerts) {
      const existing = studentAlerts.get(alert.studentId);
      if (!existing || this.compareSeverity(alert.severity, existing.severity) > 0) {
        studentAlerts.set(alert.studentId, alert);
      }
    }

    return Array.from(studentAlerts.values())
      .sort((a, b) => this.compareSeverity(b.severity, a.severity))
      .slice(0, 10);
  }

  /**
   * Compare severity levels
   */
  private compareSeverity(
    a: 'low' | 'medium' | 'high',
    b: 'low' | 'medium' | 'high'
  ): number {
    const levels = { low: 1, medium: 2, high: 3 };
    return levels[a] - levels[b];
  }

  /**
   * Get insights for a class
   */
  async getClassInsights(
    classId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const insight = await prisma.aITeacherInsight.findFirst({
      where: {
        classId,
        periodStart,
        periodEnd,
      },
    });

    return insight;
  }

  /**
   * Refresh insights for all active classes (cron job)
   */
  async refreshAllClassInsights(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get all active classes
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    console.log(`Refreshing AI insights for ${classes.length} classes...`);

    for (const classData of classes) {
      try {
        await this.calculateClassInsights(classData.id, yesterday, today);
      } catch (error) {
        console.error(`Error calculating insights for class ${classData.id}:`, error);
      }
    }

    console.log('AI insights refresh complete');
  }

  /**
   * Get student AI usage analytics
   */
  async getStudentAIUsage(studentId: string, classId?: string) {
    const where: any = { studentId };
    if (classId) where.classId = classId;

    const conversations = await prisma.aIConversation.findMany({
      where,
      include: {
        messages: true,
      },
    });

    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
    const conceptsCovered = [
      ...new Set(conversations.flatMap((c) => c.conceptTags)),
    ];

    const totalTimeMinutes = conversations.reduce((sum, c) => {
      if (!c.endedAt || !c.startedAt) return sum;
      return sum + (c.endedAt.getTime() - c.startedAt.getTime()) / 1000 / 60;
    }, 0);

    const allMessages = conversations.flatMap((c) => c.messages);
    const helpfulCount = allMessages.filter((m) => m.wasHelpful === true).length;
    const ratedCount = allMessages.filter((m) => m.wasHelpful !== null).length;
    const helpfulnessRate = ratedCount > 0 ? helpfulCount / ratedCount : undefined;

    return {
      totalConversations,
      totalMessages,
      conceptsCovered,
      totalTimeMinutes: Math.round(totalTimeMinutes),
      helpfulnessRate: helpfulnessRate ? Math.round(helpfulnessRate * 100) : undefined,
    };
  }
}

export default new AIInsightsService();
