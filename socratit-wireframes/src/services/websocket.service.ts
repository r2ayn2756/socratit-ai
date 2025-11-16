import io, { Socket } from 'socket.io-client';

// Get the API URL and ensure we don't include /api/v1 for WebSocket
const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl.slice(0, -7)  // Remove the /api/v1 suffix for WebSocket
  : rawApiUrl;

let socket: Socket | null = null;

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string, usage: any) => void;
  onError: (error: string) => void;
  onThinking?: () => void;
}

export const websocketService = {
  connect: (authToken: string) => {
    if (socket?.connected) {
      console.log('WebSocket already connected');
      return socket;
    }

    console.log('🔌 DEBUG - Connecting to WebSocket:', WS_URL);
    console.log('🔌 DEBUG - Auth token present:', !!authToken);

    socket = io(WS_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      console.error('Full error:', error);
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

  sendMessage: (conversationId: string, content: string, callbacks: StreamCallbacks, currentQuestionId?: string) => {
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

    // Send the message with optional current question ID
    socket.emit('ai:message:send', { conversationId, content, currentQuestionId });
  },

  getSocket: () => socket,
};
