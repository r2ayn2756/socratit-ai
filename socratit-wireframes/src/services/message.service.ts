// ============================================================================
// MESSAGE SERVICE
// API calls for Messaging System (Batch 5)
// ============================================================================

import apiClient from './api.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Message {
  id: string;
  senderId: string;
  recipientId: string | null;
  classId: string | null;
  content: string;
  subject?: string;
  messageType: 'DIRECT' | 'CLASS_ANNOUNCEMENT' | 'CLASS_GENERAL';
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePhotoUrl?: string;
  };
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePhotoUrl?: string;
  };
}

export interface Conversation {
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePhotoUrl?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export interface ConversationHistory {
  messages: Message[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export interface SendDirectMessageRequest {
  recipientId: string;
  content: string;
  classId?: string;
}

export interface SendClassMessageRequest {
  content: string;
  subject?: string;
  messageType?: 'CLASS_ANNOUNCEMENT' | 'CLASS_GENERAL';
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================

/**
 * Send a direct message to another user
 */
export const sendDirectMessage = async (data: SendDirectMessageRequest): Promise<Message> => {
  const response = await apiClient.post<{ success: boolean; data: Message }>('/messages/send', data);
  return response.data.data;
};

/**
 * Send message to entire class (teachers only)
 */
export const sendClassMessage = async (
  classId: string,
  data: SendClassMessageRequest
): Promise<Message> => {
  const response = await apiClient.post<{ success: boolean; data: Message }>(
    `/messages/class/${classId}`,
    data
  );
  return response.data.data;
};

/**
 * Get all conversations for current user
 */
export const getUserConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get<{ success: boolean; data: Conversation[] }>(
    '/messages/conversations'
  );
  return response.data.data;
};

/**
 * Get conversation history with a specific user
 */
export const getConversation = async (
  otherUserId: string,
  page: number = 1,
  limit: number = 50
): Promise<ConversationHistory> => {
  const response = await apiClient.get<{ success: boolean; data: ConversationHistory }>(
    `/messages/conversation/${otherUserId}`,
    { params: { page, limit } }
  );
  return response.data.data;
};

/**
 * Get class messages/announcements
 */
export const getClassMessages = async (
  classId: string,
  messageType?: 'CLASS_ANNOUNCEMENT' | 'CLASS_GENERAL'
): Promise<Message[]> => {
  const params: any = {};
  if (messageType) params.messageType = messageType;

  const response = await apiClient.get<{ success: boolean; data: Message[] }>(
    `/messages/class/${classId}`,
    { params }
  );
  return response.data.data;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await apiClient.put(`/messages/${messageId}/read`);
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<{ success: boolean; data: UnreadCountResponse }>(
    '/messages/unread-count'
  );
  return response.data.data.count;
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/messages/${messageId}`);
};

/**
 * Search messages
 */
export const searchMessages = async (query: string, limit: number = 20): Promise<Message[]> => {
  const response = await apiClient.get<{ success: boolean; data: Message[] }>('/messages/search', {
    params: { q: query, limit },
  });
  return response.data.data;
};

// ============================================================================
// EXPORT
// ============================================================================

const messageService = {
  sendDirectMessage,
  sendClassMessage,
  getUserConversations,
  getConversation,
  getClassMessages,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  searchMessages,
};

export default messageService;
