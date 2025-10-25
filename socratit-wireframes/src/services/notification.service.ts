// ============================================================================
// NOTIFICATION SERVICE
// API calls for Notification System (Batch 6)
// ============================================================================

import apiClient from './api.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'ASSIGNMENT_GRADED' | 'NEW_ASSIGNMENT' | 'NEW_MESSAGE' | 'SUBMISSION_RECEIVED' | 'GRADE_UPDATED' | 'CLASS_ANNOUNCEMENT' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  isDismissed: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

/**
 * Get all notifications for current user
 */
export const getUserNotifications = async (
  unreadOnly: boolean = false,
  limit: number = 50,
  offset: number = 0
): Promise<NotificationResponse> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Notification[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
    unreadCount: number;
  }>('/notifications', {
    params: { unreadOnly, limit, offset },
  });

  return {
    notifications: response.data.data,
    pagination: response.data.pagination,
    unreadCount: response.data.unreadCount,
  };
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<{ success: boolean; data: UnreadCountResponse }>(
    '/notifications/unread-count'
  );
  return response.data.data.count;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put('/notifications/mark-all-read');
};

/**
 * Dismiss a notification
 */
export const dismissNotification = async (notificationId: string): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/dismiss`);
};

// ============================================================================
// EXPORT
// ============================================================================

const notificationService = {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
};

export default notificationService;
