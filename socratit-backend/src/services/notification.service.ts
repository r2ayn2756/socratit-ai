// ============================================================================
// NOTIFICATION SERVICE
// Real-time notification system with database persistence and WebSocket support
// ============================================================================

import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';
import { sendNotification as sendWebSocketNotification } from './websocket.service';

export interface CreateNotificationData {
  userId: string;
  schoolId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
  classId?: string;
  actionUrl?: string;
  priority?: number;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Create a notification for a user
 * Stores in database and will push via WebSocket if user is connected
 */
export const createNotification = async (
  data: CreateNotificationData
): Promise<any> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        schoolId: data.schoolId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedResourceType: data.relatedResourceType,
        relatedResourceId: data.relatedResourceId,
        classId: data.classId,
        actionUrl: data.actionUrl,
        priority: data.priority || 0,
        metadata: data.metadata || undefined,
        expiresAt: data.expiresAt,
        isRead: false,
        isDismissed: false,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[NOTIFICATION CREATED]', {
      id: notification.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
    });

    // Push via WebSocket if user is connected
    sendWebSocketNotification(data.userId, notification);

    return notification;
  } catch (error) {
    console.error('[NOTIFICATION ERROR]', error);
    // Don't throw - notifications should not break the main flow
    return null;
  }
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (
  notifications: CreateNotificationData[]
): Promise<void> => {
  try {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        schoolId: n.schoolId,
        type: n.type,
        title: n.title,
        message: n.message,
        relatedResourceType: n.relatedResourceType,
        relatedResourceId: n.relatedResourceId,
        classId: n.classId,
        actionUrl: n.actionUrl,
        priority: n.priority || 0,
        metadata: n.metadata || undefined,
        expiresAt: n.expiresAt,
      })),
    });

    console.log(`[BULK NOTIFICATIONS CREATED] ${notifications.length} notifications`);
  } catch (error) {
    console.error('[BULK NOTIFICATION ERROR]', error);
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<any> => {
  const { unreadOnly = false, limit = 50, offset = 0 } = options || {};

  const whereClause: any = {
    userId,
    isDismissed: false,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };

  if (unreadOnly) {
    whereClause.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + notifications.length < total,
    },
    unreadCount,
  };
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/**
 * Dismiss a notification
 */
export const dismissNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isDismissed: true,
    },
  });
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (
  userId: string
): Promise<number> => {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
      isDismissed: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  return count;
};

/**
 * Delete old notifications (cleanup job)
 */
export const deleteExpiredNotifications = async (): Promise<number> => {
  const result = await prisma.notification.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  console.log(`[CLEANUP] Deleted ${result.count} expired notifications`);
  return result.count;
};

// ============================================================================
// SPECIFIC NOTIFICATION HELPERS
// ============================================================================

/**
 * Send enrollment request notification to all teachers of a class
 */
export const notifyTeachersOfEnrollmentRequest = async (
  classId: string,
  studentName: string,
  className: string,
  schoolId: string
): Promise<void> => {
  try {
    const classTeachers = await prisma.classTeacher.findMany({
      where: { classId },
      select: { teacherId: true },
    });

    const notifications = classTeachers.map((ct) => ({
      userId: ct.teacherId,
      schoolId,
      type: NotificationType.ENROLLMENT_REQUEST,
      title: 'New Enrollment Request',
      message: `${studentName} has requested to join ${className}`,
      relatedResourceType: 'class' as const,
      relatedResourceId: classId,
      classId,
      actionUrl: `/classes/${classId}/enrollments`,
      priority: 1,
    }));

    await createBulkNotifications(notifications);
  } catch (error) {
    console.error('[NOTIFY TEACHERS ERROR]', error);
  }
};

/**
 * Send enrollment approved notification to student
 */
export const notifyStudentEnrollmentApproved = async (
  studentId: string,
  className: string,
  classId: string,
  schoolId: string
): Promise<void> => {
  await createNotification({
    userId: studentId,
    schoolId,
    type: NotificationType.ENROLLMENT_APPROVED,
    title: 'Enrollment Approved',
    message: `You have been approved to join ${className}`,
    relatedResourceType: 'class',
    relatedResourceId: classId,
    classId,
    actionUrl: `/classes/${classId}`,
  });
};

/**
 * Send enrollment rejected notification to student
 */
export const notifyStudentEnrollmentRejected = async (
  studentId: string,
  className: string,
  schoolId: string,
  reason?: string
): Promise<void> => {
  const message = reason
    ? `Your request to join ${className} was not approved. Reason: ${reason}`
    : `Your request to join ${className} was not approved`;

  await createNotification({
    userId: studentId,
    schoolId,
    type: NotificationType.ENROLLMENT_REJECTED,
    title: 'Enrollment Not Approved',
    message,
  });
};

/**
 * Send added to class notification (for manual adds)
 */
export const notifyStudentAddedToClass = async (
  studentId: string,
  className: string,
  classId: string,
  teacherName: string,
  schoolId: string
): Promise<void> => {
  await createNotification({
    userId: studentId,
    schoolId,
    type: NotificationType.ADDED_TO_CLASS,
    title: 'Added to Class',
    message: `${teacherName} has added you to ${className}`,
    relatedResourceType: 'class',
    relatedResourceId: classId,
    classId,
    actionUrl: `/classes/${classId}`,
  });
};

/**
 * Send removed from class notification
 */
export const notifyStudentRemovedFromClass = async (
  studentId: string,
  className: string,
  schoolId: string
): Promise<void> => {
  await createNotification({
    userId: studentId,
    schoolId,
    type: NotificationType.REMOVED_FROM_CLASS,
    title: 'Removed from Class',
    message: `You have been removed from ${className}`,
  });
};

/**
 * Notify students of new assignment
 */
export const notifyStudentsOfNewAssignment = async (
  classId: string,
  assignmentTitle: string,
  assignmentId: string,
  dueDate: Date | null,
  schoolId: string
): Promise<void> => {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
    select: { studentId: true },
  });

  const dueDateStr = dueDate
    ? ` (Due: ${dueDate.toLocaleDateString()})`
    : '';

  const notifications = enrollments.map((e) => ({
    userId: e.studentId,
    schoolId,
    type: NotificationType.NEW_ASSIGNMENT,
    title: 'New Assignment',
    message: `New assignment posted: ${assignmentTitle}${dueDateStr}`,
    relatedResourceType: 'assignment' as const,
    relatedResourceId: assignmentId,
    classId,
    actionUrl: `/assignments/${assignmentId}`,
    priority: 1,
  }));

  await createBulkNotifications(notifications);
};

/**
 * Notify student of published grade
 */
export const notifyStudentOfGrade = async (
  studentId: string,
  assignmentTitle: string,
  assignmentId: string,
  percentage: number,
  schoolId: string,
  classId?: string
): Promise<void> => {
  await createNotification({
    userId: studentId,
    schoolId,
    type: NotificationType.GRADE_PUBLISHED,
    title: 'Grade Published',
    message: `Your grade for "${assignmentTitle}" has been published: ${percentage.toFixed(1)}%`,
    relatedResourceType: 'assignment',
    relatedResourceId: assignmentId,
    classId,
    actionUrl: `/assignments/${assignmentId}/grade`,
  });
};
