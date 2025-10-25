import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_PREFIX = '/api/v1';

// Get auth token from your auth context/store
const getAuthToken = () => {
  return localStorage.getItem('authToken'); // Adjust based on your auth implementation
};

const apiClient = axios.create({
  baseURL: `${API_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AIConversation {
  id: string;
  title: string | null;
  conversationType: string;
  isActive: boolean;
  isSharedWithTeacher: boolean;
  messageCount: number;
  conceptTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  wasHelpful: boolean | null;
  createdAt: string;
}

export interface CreateConversationRequest {
  classId?: string;
  assignmentId?: string;
  conversationType?: 'GENERAL_HELP' | 'ASSIGNMENT_HELP' | 'CONCEPT_REVIEW' | 'HOMEWORK_HELP' | 'EXAM_PREP';
  title?: string;
}

export interface ConversationWithMessages extends AIConversation {
  messages: AIMessage[];
}

export const aiTAService = {
  // Create a new conversation
  createConversation: async (data: CreateConversationRequest): Promise<AIConversation> => {
    const response = await apiClient.post('/ai-ta/conversations', data);
    return response.data.data;
  },

  // Get a specific conversation with messages
  getConversation: async (conversationId: string): Promise<ConversationWithMessages> => {
    const response = await apiClient.get(`/ai-ta/conversations/${conversationId}`);
    return response.data.data;
  },

  // List all conversations
  listConversations: async (params?: {
    isActive?: boolean;
    classId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: AIConversation[]; total: number }> => {
    const response = await apiClient.get('/ai-ta/conversations', { params });
    return response.data.data;
  },

  // Share conversation with teacher
  shareConversation: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/ai-ta/conversations/${conversationId}/share`);
  },

  // Close conversation
  closeConversation: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/ai-ta/conversations/${conversationId}/close`);
  },

  // Rate a message
  rateMessage: async (
    messageId: string,
    data: { wasHelpful: boolean; feedbackNote?: string }
  ): Promise<void> => {
    await apiClient.post(`/ai-ta/messages/${messageId}/feedback`, data);
  },

  // Get class insights (teacher only)
  getClassInsights: async (
    classId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<any> => {
    const response = await apiClient.get(`/ai-ta/insights/class/${classId}`, {
      params: { periodStart, periodEnd },
    });
    return response.data.data;
  },
};
