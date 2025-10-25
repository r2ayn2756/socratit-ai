// ============================================================================
// NOTIFICATION ROUTES
// API endpoints for notification functionality
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  getUnreadNotificationCount,
} from '../services/notification.service';

const router = Router();

/**
 * GET /api/v1/notifications
 * Get all notifications for current user
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await getUserNotifications(userId, {
        unreadOnly,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
router.get(
  '/unread-count',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      const count = await getUnreadNotificationCount(userId);

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
 * PUT /api/v1/notifications/:notificationId/read
 * Mark notification as read
 */
router.put(
  '/:notificationId/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { notificationId } = req.params;

      await markNotificationAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put(
  '/mark-all-read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      await markAllNotificationsAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/notifications/:notificationId/dismiss
 * Dismiss a notification
 */
router.put(
  '/:notificationId/dismiss',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { notificationId } = req.params;

      await dismissNotification(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification dismissed',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
