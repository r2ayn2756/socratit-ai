/**
 * AI TEACHING ASSISTANT SERVICE
 * Core conversation management and AI interaction orchestration
 * Handles message sending, streaming, conversation lifecycle
 */

import { PrismaClient, AIConversation, AIMessage, AIConversationType } from '@prisma/client';
import { prisma } from '../config/database';
import aiContextService from './aiContext.service';
import aiPromptService from './aiPrompt.service';
import aiContentFilterService from './aiContentFilter.service';
import { chatCompletion, streamChatCompletion, ChatMessage, StreamCallback, calculateCost, extractConcepts } from './ai.service';
import * as notificationService from './notification.service';

export interface CreateConversationOptions {
  studentId: string;
  schoolId: string;
  classId?: string;
  assignmentId?: string;
  conversationType?: AIConversationType;
  title?: string;
}

export interface SendMessageOptions {
  conversationId: string;
  studentId: string;
  content: string;
  currentQuestionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConversationWithMessages extends AIConversation {
  messages: AIMessage[];
}

export class AITAService {
  /**
   * Create new AI conversation
   */
  async createConversation(
    options: CreateConversationOptions
  ): Promise<AIConversation> {
    const {
      studentId,
      schoolId,
      classId,
      assignmentId,
      conversationType = 'GENERAL_HELP',
      title,
    } = options;

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Create conversation
    const conversation = await prisma.aIConversation.create({
      data: {
        studentId,
        schoolId,
        classId,
        assignmentId,
        conversationType,
        title,
        isActive: true,
      },
    });

    // Log interaction
    await this.logInteraction({
      conversationId: conversation.id,
      studentId,
      schoolId,
      interactionType: 'conversation_started',
      wasSuccessful: true,
    });

    return conversation;
  }

  /**
   * Send message and get AI response (non-streaming)
   */
  async sendMessage(
    options: SendMessageOptions
  ): Promise<{ userMessage: AIMessage; aiResponse: AIMessage }> {
    const { conversationId, studentId, content, currentQuestionId, ipAddress, userAgent } = options;

    // Check message limit
    const limitCheck = await aiContextService.checkMessageLimit(studentId);
    if (!limitCheck.allowed) {
      throw new Error(
        `Daily message limit reached (${limitCheck.limit} messages per day). Please try again tomorrow.`
      );
    }

    // Get conversation
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        student: true,
        class: true,
        assignment: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.studentId !== studentId) {
      throw new Error('Unauthorized: Not your conversation');
    }

    // Filter student input
    const inputFilter = await aiContentFilterService.filterStudentMessage(
      content,
      studentId,
      conversationId
    );

    if (!inputFilter.allowed) {
      throw new Error(`Message blocked: ${inputFilter.reason}`);
    }

    // Save user message
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content,
      },
    });

    // Build context and prompt
    const context = await aiContextService.buildStudentContext(
      studentId,
      conversation.classId || undefined,
      conversation.assignmentId || undefined,
      currentQuestionId
    );

    const systemPrompt = await aiPromptService.buildSystemPrompt(
      {
        context,
        conversationType: conversation.conversationType,
      },
      conversation.schoolId,
      undefined
    );

    // Get conversation history
    const history = await this.getConversationHistory(conversationId, 10);

    // Build messages for AI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // Get AI response
    const startTime = Date.now();
    const aiResult = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 500,
    });
    const responseTime = Date.now() - startTime;

    // Filter AI output
    const outputFilter = await aiContentFilterService.filterAIResponse(
      aiResult.content,
      conversation.assignmentId || undefined
    );

    let aiContent = aiResult.content;
    if (!outputFilter.allowed && outputFilter.suggestedResponse) {
      aiContent = outputFilter.suggestedResponse;
    }

    // Extract concepts from conversation
    const concepts = await extractConcepts(
      content + ' ' + aiContent,
      conversation.class?.subject || undefined
    );

    // Save AI response
    const aiResponse = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiContent,
        model: process.env.AI_PROVIDER === 'gemini' ? 'gemini-2.0-flash-exp' : (process.env.AI_PROVIDER === 'claude' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo'),
        promptTokens: aiResult.usage.promptTokens,
        completionTokens: aiResult.usage.completionTokens,
        totalTokens: aiResult.usage.totalTokens,
        responseTime,
        contextUsed: JSON.parse(JSON.stringify({
          gradeLevel: context.gradeLevel,
          className: context.className,
          strugglingConcepts: context.strugglingConcepts,
          assignmentContext: context.assignmentContext,
        })),
        rawPrompt: systemPrompt,
        citedConcepts: concepts,
        flaggedContent: !outputFilter.allowed,
        flagReason: outputFilter.reason,
      },
    });

    // Update conversation metadata
    const cost = calculateCost(aiResult.usage);
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 2 },
        totalTokens: { increment: aiResult.usage.totalTokens },
        totalCost: { increment: cost },
        lastMessageAt: new Date(),
        conceptTags: {
          set: [...new Set([...conversation.conceptTags, ...concepts])],
        },
      },
    });

    // Log interaction
    await this.logInteraction({
      conversationId,
      studentId,
      schoolId: conversation.schoolId,
      interactionType: inputFilter.suggestedResponse ? 'direct_answer_request' : 'question_asked',
      studentQuestion: content,
      aiResponse: aiContent,
      conceptTags: concepts,
      responseTime,
      tokensUsed: aiResult.usage.totalTokens,
      costUSD: cost,
      wasSuccessful: outputFilter.allowed,
      classId: conversation.classId || undefined,
      assignmentId: conversation.assignmentId || undefined,
      ipAddress,
      userAgent,
    });

    // Check if student is struggling
    const strugglingCheck = await aiContentFilterService.detectStrugglingPattern(
      studentId,
      conversationId
    );

    if (strugglingCheck.isStruggling && strugglingCheck.severity === 'high') {
      // Alert teacher
      await this.alertTeacherOfStruggle(conversation, strugglingCheck.reason);
    }

    return { userMessage, aiResponse };
  }

  /**
   * Stream AI response token-by-token (for WebSocket)
   */
  async streamMessage(
    options: SendMessageOptions,
    streamCallback: StreamCallback
  ): Promise<{ userMessage: AIMessage; conversationId: string }> {
    const { conversationId, studentId, content, currentQuestionId, ipAddress, userAgent } = options;

    // Check message limit
    const limitCheck = await aiContextService.checkMessageLimit(studentId);
    if (!limitCheck.allowed) {
      throw new Error(
        `Daily message limit reached (${limitCheck.limit} messages per day)`
      );
    }

    // Get conversation
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        student: true,
        class: true,
        assignment: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    // Filter input
    const inputFilter = await aiContentFilterService.filterStudentMessage(
      content,
      studentId,
      conversationId
    );

    if (!inputFilter.allowed) {
      throw new Error(`Message blocked: ${inputFilter.reason}`);
    }

    // Save user message
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content,
      },
    });

    // Build context
    const context = await aiContextService.buildStudentContext(
      studentId,
      conversation.classId || undefined,
      conversation.assignmentId || undefined,
      currentQuestionId
    );

    const systemPrompt = await aiPromptService.buildSystemPrompt(
      {
        context,
        conversationType: conversation.conversationType,
      },
      conversation.schoolId,
      undefined
    );

    // Get history
    const history = await this.getConversationHistory(conversationId, 10);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // Stream response
    const startTime = Date.now();

    await streamChatCompletion(
      messages,
      {
        onToken: streamCallback.onToken,
        onComplete: async (fullResponse, usage) => {
          const responseTime = Date.now() - startTime;

          // Filter output
          const outputFilter = await aiContentFilterService.filterAIResponse(
            fullResponse,
            conversation.assignmentId || undefined
          );

          let finalResponse = fullResponse;
          if (!outputFilter.allowed && outputFilter.suggestedResponse) {
            finalResponse = outputFilter.suggestedResponse;
          }

          // Extract concepts
          const concepts = await extractConcepts(
            content + ' ' + finalResponse,
            conversation.class?.subject || undefined
          );

          // Save AI response
          const aiResponse = await prisma.aIMessage.create({
            data: {
              conversationId,
              role: 'ASSISTANT',
              content: finalResponse,
              model: process.env.AI_PROVIDER === 'gemini' ? 'gemini-2.0-flash-exp' : (process.env.AI_PROVIDER === 'claude' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo'),
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens,
              responseTime,
              contextUsed: {
                gradeLevel: context.gradeLevel,
                className: context.className,
              },
              rawPrompt: systemPrompt,
              citedConcepts: concepts,
              flaggedContent: !outputFilter.allowed,
            },
          });

          // Update conversation
          const cost = calculateCost(usage);
          await prisma.aIConversation.update({
            where: { id: conversationId },
            data: {
              messageCount: { increment: 2 },
              totalTokens: { increment: usage.totalTokens },
              totalCost: { increment: cost },
              lastMessageAt: new Date(),
              conceptTags: {
                set: [...new Set([...conversation.conceptTags, ...concepts])],
              },
            },
          });

          // Log interaction
          await this.logInteraction({
            conversationId,
            studentId,
            schoolId: conversation.schoolId,
            interactionType: 'question_asked',
            studentQuestion: content,
            aiResponse: finalResponse,
            conceptTags: concepts,
            responseTime,
            tokensUsed: usage.totalTokens,
            costUSD: cost,
            wasSuccessful: outputFilter.allowed,
            classId: conversation.classId || undefined,
            assignmentId: conversation.assignmentId || undefined,
            ipAddress,
            userAgent,
          });

          streamCallback.onComplete(finalResponse, usage);
        },
        onError: streamCallback.onError,
      },
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    return { userMessage, conversationId };
  }

  /**
   * Get conversation with full message history
   */
  async getConversation(
    conversationId: string,
    studentId: string
  ): Promise<ConversationWithMessages> {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    return conversation;
  }

  /**
   * Get recent conversation history
   */
  private async getConversationHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<AIMessage[]> {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse(); // Return in chronological order
  }

  /**
   * List student's conversations
   */
  async listConversations(
    studentId: string,
    options: {
      isActive?: boolean;
      classId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AIConversation[]> {
    const { isActive, classId, limit = 20, offset = 0 } = options;

    const where: any = { studentId };
    if (isActive !== undefined) where.isActive = isActive;
    if (classId) where.classId = classId;

    const conversations = await prisma.aIConversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return conversations;
  }

  /**
   * Share conversation with teacher
   */
  async shareConversationWithTeacher(
    conversationId: string,
    studentId: string
  ): Promise<AIConversation> {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { class: { include: { teachers: true } } },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    // Update conversation
    const updated = await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { isSharedWithTeacher: true },
    });

    // Notify teacher(s)
    if (conversation.class) {
      for (const classTeacher of conversation.class.teachers) {
        await notificationService.createNotification({
          userId: classTeacher.teacherId,
          schoolId: conversation.schoolId,
          type: 'AI_CONVERSATION_SHARED',
          title: 'Student Shared AI Conversation',
          message: `A student has shared their AI tutor conversation with you for help.`,
          relatedResourceType: 'ai_conversation',
          relatedResourceId: conversationId,
          classId: conversation.classId || undefined,
          priority: 1,
        });
      }
    }

    return updated;
  }

  /**
   * Rate AI response as helpful/not helpful
   */
  async rateMessage(
    messageId: string,
    wasHelpful: boolean,
    feedbackNote?: string
  ): Promise<AIMessage> {
    const message = await prisma.aIMessage.update({
      where: { id: messageId },
      data: {
        wasHelpful,
        feedbackNote,
      },
    });

    return message;
  }

  /**
   * Alert teacher when student is struggling
   */
  private async alertTeacherOfStruggle(
    conversation: any,
    reason: string
  ): Promise<void> {
    if (!conversation.classId) return;

    const classData = await prisma.class.findUnique({
      where: { id: conversation.classId },
      include: { teachers: true },
    });

    if (!classData) return;

    for (const classTeacher of classData.teachers) {
      await notificationService.createNotification({
        userId: classTeacher.teacherId,
        schoolId: conversation.schoolId,
        type: 'AI_STUDENT_STRUGGLING',
        title: 'Student May Need Help',
        message: `A student has been struggling with the AI tutor. Reason: ${reason}`,
        relatedResourceType: 'ai_conversation',
        relatedResourceId: conversation.id,
        classId: conversation.classId,
        priority: 2,
      });
    }
  }

  /**
   * Log AI interaction for analytics
   */
  private async logInteraction(data: {
    conversationId: string;
    studentId: string;
    schoolId: string;
    interactionType: string;
    studentQuestion?: string;
    aiResponse?: string;
    conceptTags?: string[];
    responseTime?: number;
    tokensUsed?: number;
    costUSD?: number;
    wasSuccessful?: boolean;
    classId?: string;
    assignmentId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.aIInteractionLog.create({
      data: {
        conversationId: data.conversationId,
        studentId: data.studentId,
        schoolId: data.schoolId,
        interactionType: data.interactionType,
        studentQuestion: data.studentQuestion,
        aiResponse: data.aiResponse,
        conceptTags: data.conceptTags || [],
        responseTime: data.responseTime,
        tokensUsed: data.tokensUsed,
        costUSD: data.costUSD,
        wasSuccessful: data.wasSuccessful ?? true,
        classId: data.classId,
        assignmentId: data.assignmentId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Update conversation title (auto-generated from first message)
   */
  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * End/archive conversation
   */
  async endConversation(conversationId: string): Promise<void> {
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }
}

export default new AITAService();
