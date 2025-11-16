// ============================================================================
// MESSAGE ROUTES
// API endpoints for messaging functionality
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  sendDirectMessageSchema,
  sendClassMessageSchema,
} from '../validation/message.validation';
import {
  sendDirectMessage,
  sendClassMessage,
  getConversation,
  getUserConversations,
  getClassMessages,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  searchMessages,
} from '../services/message.service';
import { createAuditLog } from '../services/audit.service';
import { AuditAction } from '@prisma/client';

const router = Router();

/**
 * POST /api/v1/messages/send
 * Send a direct message to another user
 */
router.post(
  '/send',
  requireAuth,
  validate(sendDirectMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const schoolId = (req as any).user.schoolId;
      const { recipientId, content, classId } = req.body;

      const message = await sendDirectMessage({
        senderId: userId,
        recipientId,
        content,
        classId,
      });

      // Audit log
      await createAuditLog({
        userId,
        schoolId,
        action: AuditAction.VIEW_STUDENT_DATA,
        resourceType: 'message',
        resourceId: message.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent'),
        metadata: { recipientId },
      });

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/messages/class/:classId
 * Send message to entire class (teachers only)
 */
router.post(
  '/class/:classId',
  requireAuth,
  validate(sendClassMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { classId } = req.params;
      const { content, subject, messageType } = req.body;

      console.log('Sending class message:', { userId, classId, content, subject, messageType });

      const message = await sendClassMessage({
        senderId: userId,
        classId,
        content,
        subject: subject?.trim() || undefined, // Convert empty strings to undefined
        messageType: messageType || 'ANNOUNCEMENT',
      });

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent to class successfully',
      });
    } catch (error: any) {
      console.error('Error sending class message:', error);
      next(error);
    }
  }
);

/**
 * GET /api/v1/messages/conversations
 * Get all conversations for current user
 */
router.get(
  '/conversations',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      const conversations = await getUserConversations(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/messages/conversation/:otherUserId
 * Get conversation history with a specific user
 */
router.get(
  '/conversation/:otherUserId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { otherUserId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const conversation = await getConversation({
        userId,
        otherUserId,
        page,
        limit,
      });

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/messages/class/:classId
 * Get class messages/announcements
 */
router.get(
  '/class/:classId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { classId } = req.params;
      const messageType = req.query.messageType as any;

      const messages = await getClassMessages(classId, userId, messageType);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/messages/:messageId/read
 * Mark message as read
 */
router.put(
  '/:messageId/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { messageId } = req.params;

      await markMessageAsRead(messageId, userId);

      res.json({
        success: true,
        message: 'Message marked as read',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/messages/unread-count
 * Get unread message count
 */
router.get(
  '/unread-count',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      const count = await getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/messages/:messageId
 * Delete a message (soft delete)
 */
router.delete(
  '/:messageId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { messageId } = req.params;

      await deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/messages/search
 * Search messages
 */
router.get(
  '/search',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          errors: ['Search query must be at least 2 characters'],
        });
      }

      const messages = await searchMessages(userId, query, limit);

      return res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      return next(error);
    }
  }
);

export default router;
