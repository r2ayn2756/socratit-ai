# Frontend API Integration Guide - AI Teaching Assistant

This guide shows how to connect the AI TA frontend components to the backend API and WebSocket server.

## Prerequisites

1. Backend server running at `http://localhost:5000` (or your configured API URL)
2. WebSocket server running on the same port
3. Authentication token available in your app state

## 1. API Service Setup

Create an AI TA service file to handle all API calls:

**File: `src/services/aiTA.service.ts`**

```typescript
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
```

## 2. WebSocket Connection Setup

Create a WebSocket service for real-time streaming:

**File: `src/services/websocket.service.ts`**

```typescript
import io, { Socket } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string, usage: any) => void;
  onError: (error: string) => void;
  onThinking?: () => void;
}

export const websocketService = {
  connect: (authToken: string) => {
    if (socket?.connected) return socket;

    socket = io(WS_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinConversation: (conversationId: string) => {
    socket?.emit('ai:conversation:join', { conversationId });
  },

  leaveConversation: (conversationId: string) => {
    socket?.emit('ai:conversation:leave', { conversationId });
  },

  sendMessage: (conversationId: string, content: string, callbacks: StreamCallbacks) => {
    if (!socket) throw new Error('WebSocket not connected');

    // Listen for streaming events
    socket.on('ai:thinking', () => {
      callbacks.onThinking?.();
    });

    socket.on('ai:message:stream', (data: { conversationId: string; token: string }) => {
      if (data.conversationId === conversationId) {
        callbacks.onToken(data.token);
      }
    });

    socket.on('ai:message:complete', (data: { conversationId: string; fullResponse: string; usage: any }) => {
      if (data.conversationId === conversationId) {
        callbacks.onComplete(data.fullResponse, data.usage);
        // Clean up listeners
        socket?.off('ai:thinking');
        socket?.off('ai:message:stream');
        socket?.off('ai:message:complete');
        socket?.off('ai:error');
      }
    });

    socket.on('ai:error', (data: { conversationId: string; error: string }) => {
      if (data.conversationId === conversationId) {
        callbacks.onError(data.error);
        // Clean up listeners
        socket?.off('ai:thinking');
        socket?.off('ai:message:stream');
        socket?.off('ai:message:complete');
        socket?.off('ai:error');
      }
    });

    // Send the message
    socket.emit('ai:message:send', { conversationId, content });
  },

  getSocket: () => socket,
};
```

## 3. Update AIHelpButton Component

Replace the TODO comment in [AIHelpButton.tsx](src/components/ai/AIHelpButton.tsx:20-38):

```typescript
const handleGetHelp = async () => {
  // Create new conversation if needed
  if (!conversationId) {
    try {
      const conversation = await aiTAService.createConversation({
        assignmentId,
        conversationType: 'ASSIGNMENT_HELP',
      });
      setConversationId(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start AI conversation. Please try again.');
      return;
    }
  }

  setShowChat(true);
};
```

## 4. Update AITutorChat Component

Replace the TODO comments in [AITutorChat.tsx](src/components/ai/AITutorChat.tsx):

### Initialize WebSocket (lines 48-67):

```typescript
useEffect(() => {
  // Get auth token from your auth context
  const authToken = localStorage.getItem('authToken'); // Adjust based on your auth
  if (!authToken) return;

  // Connect to WebSocket
  const socket = websocketService.connect(authToken);

  // Join conversation room
  websocketService.joinConversation(conversationId);

  // Cleanup
  return () => {
    websocketService.leaveConversation(conversationId);
  };
}, [conversationId]);
```

### Load Conversation History (lines 74-83):

```typescript
const loadConversation = async () => {
  try {
    const data = await aiTAService.getConversation(conversationId);
    setMessages(data.messages);
  } catch (error) {
    console.error('Error loading conversation:', error);
    alert('Failed to load conversation history.');
  }
};
```

### Send Message (lines 108-129):

```typescript
const handleSendMessage = () => {
  if (!inputValue.trim() || isStreaming) return;

  // Add user message
  const userMessage: Message = {
    id: Math.random().toString(),
    role: 'USER',
    content: inputValue,
    createdAt: new Date(),
  };
  setMessages((prev) => [...prev, userMessage]);

  // Send via WebSocket for streaming
  setIsStreaming(true);
  setIsTyping(true);

  websocketService.sendMessage(conversationId, inputValue, {
    onThinking: () => setIsTyping(true),
    onToken: (token: string) => {
      setStreamingMessage((prev) => prev + token);
    },
    onComplete: (fullResponse: string, usage: any) => {
      const newMessage: Message = {
        id: Math.random().toString(),
        role: 'ASSISTANT',
        content: fullResponse,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setStreamingMessage('');
      setIsStreaming(false);
      setIsTyping(false);
    },
    onError: (error: string) => {
      alert(`Error: ${error}`);
      setIsTyping(false);
      setIsStreaming(false);
    },
  });

  setInputValue('');
};
```

### Rate Message (lines 131-147):

```typescript
const handleRateMessage = async (messageId: string, wasHelpful: boolean) => {
  try {
    await aiTAService.rateMessage(messageId, { wasHelpful });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, wasHelpful } : msg
      )
    );
  } catch (error) {
    console.error('Error rating message:', error);
  }
};
```

### Share with Teacher (lines 149-161):

```typescript
const handleShareWithTeacher = async () => {
  if (confirm('Share this conversation with your teacher?')) {
    try {
      await aiTAService.shareConversation(conversationId);
      alert('Conversation shared with your teacher!');
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share conversation. Please try again.');
    }
  }
};
```

## 5. Update AITutorPage Component

Add the API integration to [AITutorPage.tsx](src/pages/student/AITutorPage.tsx):

### Fetch Conversations:

```typescript
import { useQuery } from '@tanstack/react-query';
import { aiTAService } from '../../services/aiTA.service';

export const AITutorPage: React.FC = () => {
  // ... existing state

  // Fetch conversations
  const { data, isLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiTAService.listConversations({ isActive: true }),
  });

  const conversations = data?.conversations || [];

  // Calculate stats
  const totalConversations = conversations.length;
  const allMessages = conversations.flatMap(c => c.messageCount);
  const totalConcepts = [...new Set(conversations.flatMap(c => c.conceptTags))].length;

  // ... rest of component
};
```

### Create New Conversation:

```typescript
const handleNewConversation = async () => {
  try {
    const conversation = await aiTAService.createConversation({
      conversationType: 'GENERAL_HELP',
      title: 'General Help',
    });
    setSelectedConversation(conversation.id);
    setShowChat(true);
  } catch (error) {
    console.error('Error creating conversation:', error);
    alert('Failed to start conversation. Please try again.');
  }
};
```

## 6. Update AIInsightsDashboard Component

Add the API integration to [AIInsightsDashboard.tsx](src/pages/teacher/AIInsightsDashboard.tsx):

```typescript
import { useQuery } from '@tanstack/react-query';
import { aiTAService } from '../../services/aiTA.service';

export const AIInsightsDashboard: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (timeRange === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (timeRange === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else {
      start.setFullYear(start.getFullYear() - 1);
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const { start, end } = getDateRange();

  // Fetch insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', classId, start, end],
    queryFn: () => aiTAService.getClassInsights(classId!, start, end),
    enabled: !!classId,
  });

  if (isLoading) {
    return <div>Loading insights...</div>;
  }

  // Use insights data in the component
  const overviewStats = {
    activeStudents: insights?.totalStudents || 0,
    totalConversations: insights?.totalConversations || 0,
    helpfulRate: insights?.averageHelpfulness
      ? `${Math.round(insights.averageHelpfulness * 100)}%`
      : 'N/A',
    interventionsNeeded: insights?.interventionNeeded?.length || 0,
  };

  // ... rest of component using insights data
};
```

## 7. Environment Variables

Add to your `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
```

## 8. Install Required Dependencies

```bash
npm install socket.io-client axios
```

## 9. Testing Checklist

- [ ] Student can create new AI conversation
- [ ] Student can send messages and see streaming responses
- [ ] Student can rate AI responses (thumbs up/down)
- [ ] Student can share conversation with teacher
- [ ] AI Help Button appears on assignment page
- [ ] Teacher can view class insights dashboard
- [ ] Teacher can see intervention alerts
- [ ] Teacher can see common questions and struggling concepts
- [ ] WebSocket connection is stable
- [ ] Auto-reconnection works after disconnect

## 10. Error Handling

All API calls should include error handling:

```typescript
try {
  await aiTAService.someMethod();
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle axios errors
    if (error.response?.status === 401) {
      // Redirect to login
    } else if (error.response?.status === 403) {
      alert('You do not have permission to perform this action.');
    } else if (error.response?.status === 429) {
      alert('You have reached the daily message limit. Please try again tomorrow.');
    } else {
      alert(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  } else {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred. Please try again.');
  }
}
```

## 11. Notes

- **Message Limit**: Students have a soft cap of 500 messages/day. The backend will return a 429 error when exceeded.
- **Data Retention**: All AI conversations auto-expire after 90 days for FERPA compliance.
- **Token Usage**: Backend tracks token usage and costs automatically.
- **Concept Extraction**: AI automatically extracts concepts from conversations and stores in `conceptTags`.
- **Intervention Detection**: Backend automatically detects struggling students and sends notifications to teachers.

## Support

For backend API documentation, see the API endpoints in:
- `socratit-backend/src/routes/aiTA.routes.ts`
- `socratit-backend/src/controllers/aiTA.controller.ts`
