/**
 * AI TEACHING ASSISTANT CONTROLLER
 * Handles HTTP requests for AI TA features
 */

import { Request, Response } from 'express';
import aiTAService from '../services/aiTA.service';
import aiInsightsService from '../services/aiInsights.service';
import aiPromptService from '../services/aiPrompt.service';
import { AuthRequest } from '../types';

/**
 * Create new AI conversation
 * POST /api/v1/ai-ta/conversations
 */
export async function createConversation(req: AuthRequest, res: Response) {
  try {
    const { classId, assignmentId, conversationType, title } = req.body;
    const studentId = req.user!.id;
    const schoolId = req.user!.schoolId;

    const conversation = await aiTAService.createConversation({
      studentId,
      schoolId,
      classId,
      assignmentId,
      conversationType,
      title,
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * List student's conversations
 * GET /api/v1/ai-ta/conversations
 */
export async function listConversations(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user!.id;
    const { isActive, classId, limit, offset } = req.query;

    const conversations = await aiTAService.listConversations(studentId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      classId: classId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        conversations,
        total: conversations.length,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get conversation with messages
 * GET /api/v1/ai-ta/conversations/:id
 */
export async function getConversation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const conversation = await aiTAService.getConversation(id, studentId);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Send message (non-streaming)
 * POST /api/v1/ai-ta/conversations/:id/messages
 */
export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const studentId = req.user!.id;

    const result = await aiTAService.sendMessage({
      conversationId: id,
      studentId,
      content,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Share conversation with teacher
 * POST /api/v1/ai-ta/conversations/:id/share
 */
export async function shareConversation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const conversation = await aiTAService.shareConversationWithTeacher(id, studentId);

    res.json({
      success: true,
      data: conversation,
      message: 'Conversation shared with your teacher',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Rate AI message
 * POST /api/v1/ai-ta/messages/:id/feedback
 */
export async function rateMessage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { wasHelpful, feedbackNote } = req.body;

    const message = await aiTAService.rateMessage(id, wasHelpful, feedbackNote);

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * End conversation
 * POST /api/v1/ai-ta/conversations/:id/end
 */
export async function endConversation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await aiTAService.endConversation(id);

    res.json({
      success: true,
      message: 'Conversation ended',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get class AI insights (teachers only)
 * GET /api/v1/ai-ta/insights/class/:classId
 */
export async function getClassInsights(req: AuthRequest, res: Response) {
  try {
    const { classId } = req.params;
    const { periodStart, periodEnd } = req.query;

    // Default to last 7 days if not provided
    const end = periodEnd ? new Date(periodEnd as string) : new Date();
    const start = periodStart
      ? new Date(periodStart as string)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const insights = await aiInsightsService.getClassInsights(classId, start, end);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get student AI usage stats (teachers can view their students)
 * GET /api/v1/ai-ta/insights/student/:studentId
 */
export async function getStudentAIUsage(req: AuthRequest, res: Response) {
  try {
    const { studentId } = req.params;
    const { classId } = req.query;

    const usage = await aiInsightsService.getStudentAIUsage(
      studentId,
      classId as string
    );

    res.json({
      success: true,
      data: usage,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * List prompt templates (teachers)
 * GET /api/v1/ai-ta/templates
 */
export async function listTemplates(req: AuthRequest, res: Response) {
  try {
    const schoolId = req.user!.schoolId;
    const teacherId = req.user!.role === 'TEACHER' ? req.user!.id : undefined;

    const templates = await aiPromptService.listTemplates(schoolId, teacherId);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Create custom prompt template (teachers only)
 * POST /api/v1/ai-ta/templates
 */
export async function createTemplate(req: AuthRequest, res: Response) {
  try {
    const teacherId = req.user!.id;
    const schoolId = req.user!.schoolId;

    const template = await aiPromptService.createTemplate({
      ...req.body,
      teacherId,
      schoolId,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Update prompt template
 * PATCH /api/v1/ai-ta/templates/:id
 */
export async function updateTemplate(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const template = await aiPromptService.updateTemplate(id, req.body);

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
