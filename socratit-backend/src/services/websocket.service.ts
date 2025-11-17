// ============================================================================
// WEBSOCKET SERVICE
// Real-time WebSocket service using Socket.IO
// ============================================================================

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { setUserOnline, setUserOffline, updateLastSeen } from './presence.service';
import aiTAService from './aiTA.service';

let io: SocketIOServer | null = null;

// Store socket connections: userId -> socketId[]
const userSockets = new Map<string, Set<string>>();

/**
 * Initialize WebSocket server
 */
export const initializeWebSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        userId: string;
        schoolId: string;
        role: string;
      };

      // Attach user info to socket
      (socket as any).userId = decoded.userId;
      (socket as any).schoolId = decoded.schoolId;
      (socket as any).role = decoded.role;

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    console.log(`[WEBSOCKET] User ${userId} connected (socket: ${socket.id})`);

    // Track user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Set user as online
    setUserOnline(userId, socket.id).catch(console.error);

    // Handle events
    handleSocketEvents(socket, userId);

    // Heartbeat to update last seen
    const heartbeatInterval = setInterval(() => {
      updateLastSeen(userId).catch(console.error);
    }, 30000); // Every 30 seconds

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[WEBSOCKET] User ${userId} disconnected (socket: ${socket.id})`);

      // Remove socket from tracking
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          // User has no more connections, mark as offline
          setUserOffline(userId).catch(console.error);
        }
      }

      clearInterval(heartbeatInterval);
    });
  });

  console.log('✅ WebSocket server initialized');
  return io;
};

/**
 * Handle socket events
 */
const handleSocketEvents = (socket: Socket, userId: string) => {
  // Typing indicators
  socket.on('typing_start', async (data: { recipientId: string }) => {
    sendToUser(data.recipientId, 'user_typing', {
      userId,
      isTyping: true,
    });
  });

  socket.on('typing_stop', async (data: { recipientId: string }) => {
    sendToUser(data.recipientId, 'user_typing', {
      userId,
      isTyping: false,
    });
  });

  // Join class room (for class announcements)
  socket.on('join_class_room', async (data: { classId: string }) => {
    socket.join(`class:${data.classId}`);
    console.log(`[WEBSOCKET] User ${userId} joined class room: ${data.classId}`);
  });

  // Leave class room
  socket.on('leave_class_room', async (data: { classId: string }) => {
    socket.leave(`class:${data.classId}`);
    console.log(`[WEBSOCKET] User ${userId} left class room: ${data.classId}`);
  });

  // Heartbeat
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // ============================================================================
  // AI TEACHING ASSISTANT - Streaming Chat
  // ============================================================================

  // Join AI conversation room
  socket.on('ai:conversation:join', async (data: { conversationId: string }) => {
    socket.join(`ai-conversation:${data.conversationId}`);
    console.log(`[WEBSOCKET] User ${userId} joined AI conversation: ${data.conversationId}`);
  });

  // Leave AI conversation room
  socket.on('ai:conversation:leave', async (data: { conversationId: string }) => {
    socket.leave(`ai-conversation:${data.conversationId}`);
    console.log(`[WEBSOCKET] User ${userId} left AI conversation: ${data.conversationId}`);
  });

  // Send AI message with streaming response
  socket.on('ai:message:send', async (data: { conversationId: string; content: string; currentQuestionId?: string }) => {
    try {
      // Emit thinking indicator
      socket.emit('ai:thinking', { conversationId: data.conversationId });

      // Stream AI response
      await aiTAService.streamMessage(
        {
          conversationId: data.conversationId,
          studentId: userId,
          content: data.content,
          currentQuestionId: data.currentQuestionId,
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
        },
        {
          onToken: (token: string) => {
            // Emit each token as it arrives
            socket.emit('ai:message:stream', {
              conversationId: data.conversationId,
              token,
            });
          },
          onComplete: (fullResponse: string, usage: any) => {
            // Emit completion event
            socket.emit('ai:message:complete', {
              conversationId: data.conversationId,
              fullResponse,
              usage,
            });
          },
          onError: (error: Error) => {
            // Emit error event
            socket.emit('ai:error', {
              conversationId: data.conversationId,
              error: error.message,
            });
          },
        }
      );
    } catch (error: any) {
      socket.emit('ai:error', {
        conversationId: data.conversationId,
        error: error.message,
      });
    }
  });

  // Typing indicators for AI chat
  socket.on('ai:typing:start', async (data: { conversationId: string }) => {
    socket.to(`ai-conversation:${data.conversationId}`).emit('ai:user_typing', {
      userId,
      isTyping: true,
    });
  });

  socket.on('ai:typing:stop', async (data: { conversationId: string }) => {
    socket.to(`ai-conversation:${data.conversationId}`).emit('ai:user_typing', {
      userId,
      isTyping: false,
    });
  });

  // ============================================================================
  // ATLAS KNOWLEDGE GRAPH - Real-time Updates
  // ============================================================================

  // Join Atlas knowledge graph room (student-specific)
  socket.on('atlas:join', async () => {
    socket.join(`atlas:${userId}`);
    console.log(`[WEBSOCKET] User ${userId} joined Atlas room`);
  });

  // Leave Atlas knowledge graph room
  socket.on('atlas:leave', async () => {
    socket.leave(`atlas:${userId}`);
    console.log(`[WEBSOCKET] User ${userId} left Atlas room`);
  });
};

/**
 * Send event to a specific user (all their connected sockets)
 */
export const sendToUser = (userId: string, event: string, data: any): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    // User not connected
    return;
  }

  sockets.forEach((socketId) => {
    io!.to(socketId).emit(event, data);
  });
};

/**
 * Send event to all users in a class
 */
export const sendToClass = (classId: string, event: string, data: any): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.to(`class:${classId}`).emit(event, data);
};

/**
 * Send event to all users in a school
 */
export const sendToSchool = (schoolId: string, event: string, data: any): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.to(`school:${schoolId}`).emit(event, data);
};

/**
 * Broadcast to all connected clients
 */
export const broadcast = (event: string, data: any): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.emit(event, data);
};

/**
 * Get online user count
 */
export const getOnlineUserCount = (): number => {
  return userSockets.size;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
};

/**
 * Get all online users
 */
export const getOnlineUsers = (): string[] => {
  return Array.from(userSockets.keys());
};

// ============================================================================
// ATLAS KNOWLEDGE GRAPH - WebSocket Helpers
// ============================================================================

/**
 * Emit concept mastery update to student's Atlas room
 * Called when assignment is graded or concept mastery changes
 */
export const emitAtlasMasteryUpdate = (
  studentId: string,
  conceptId: string,
  conceptName: string,
  newMastery: number,
  masteryLevel: string,
  trend: string
): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.to(`atlas:${studentId}`).emit('atlas:mastery:updated', {
    conceptId,
    conceptName,
    mastery: newMastery,
    masteryLevel,
    trend,
    timestamp: new Date().toISOString(),
  });

  console.log(`[ATLAS] Sent mastery update for ${conceptName} (${newMastery}%) to student ${studentId}`);
};

/**
 * Emit new concept discovered event
 * Called when student encounters a new concept for the first time
 */
export const emitAtlasConceptDiscovered = (
  studentId: string,
  conceptId: string,
  conceptName: string,
  subject: string
): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.to(`atlas:${studentId}`).emit('atlas:concept:discovered', {
    conceptId,
    conceptName,
    subject,
    timestamp: new Date().toISOString(),
  });

  console.log(`[ATLAS] Student ${studentId} discovered new concept: ${conceptName}`);
};

/**
 * Emit milestone achieved event
 * Called when student reaches mastery milestone (e.g., 90% = MASTERED)
 */
export const emitAtlasMilestoneAchieved = (
  studentId: string,
  conceptId: string,
  conceptName: string,
  milestoneType: string,
  classId?: string
): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.to(`atlas:${studentId}`).emit('atlas:milestone:achieved', {
    conceptId,
    conceptName,
    milestoneType,
    classId,
    timestamp: new Date().toISOString(),
  });

  console.log(`[ATLAS] Student ${studentId} achieved milestone: ${milestoneType} for ${conceptName}`);
};

/**
 * Emit concept discussed in AI chat
 * Called when AI tutor extracts concepts from conversation
 */
export const emitAtlasConceptDiscussed = (
  studentId: string,
  conceptIds: string[],
  conversationId: string
): void => {
  if (!io) {
    console.warn('[WEBSOCKET] Socket.IO not initialized');
    return;
  }

  io.to(`atlas:${studentId}`).emit('atlas:concepts:discussed', {
    conceptIds,
    conversationId,
    timestamp: new Date().toISOString(),
  });

  console.log(`[ATLAS] Student ${studentId} discussed ${conceptIds.length} concepts in AI chat`);
};

/**
 * Send notification via WebSocket
 */
export const sendNotification = (userId: string, notification: any): void => {
  sendToUser(userId, 'notification', notification);
};

/**
 * Send message via WebSocket
 */
export const sendMessage = (userId: string, message: any): void => {
  sendToUser(userId, 'message_received', message);
};

/**
 * Send message read receipt
 */
export const sendMessageReadReceipt = (userId: string, messageId: string): void => {
  sendToUser(userId, 'message_read', { messageId });
};

/**
 * Send user presence update
 */
export const sendPresenceUpdate = (
  recipientIds: string[],
  userId: string,
  isOnline: boolean
): void => {
  recipientIds.forEach((recipientId) => {
    sendToUser(recipientId, 'user_presence', {
      userId,
      isOnline,
    });
  });
};

/**
 * Disconnect all sockets for a user (useful for logout)
 */
export const disconnectUser = (userId: string): void => {
  if (!io) return;

  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.forEach((socketId) => {
    const socket = io!.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
  });

  userSockets.delete(userId);
};

/**
 * Get Socket.IO server instance
 */
export const getIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Send progress update event
 */
export const sendProgressUpdateEvent = (
  studentId: string,
  classId: string,
  progress: any
): void => {
  sendToUser(studentId, 'progress:updated', {
    studentId,
    classId,
    progress,
  });

  // Also send to teachers of the class
  sendToClass(classId, 'student:progress_updated', {
    studentId,
    classId,
    progress,
  });
};

/**
 * Send assignment progress event
 */
export const sendAssignmentProgressEvent = (
  studentId: string,
  assignmentId: string,
  progress: any
): void => {
  sendToUser(studentId, 'assignment:progress', {
    studentId,
    assignmentId,
    progress,
  });
};

/**
 * Send concept mastery event
 */
export const sendConceptMasteryEvent = (
  studentId: string,
  classId: string,
  conceptId: string,
  masteryLevel: number,
  remediationNeeded: boolean
): void => {
  sendToUser(studentId, 'concept:mastery', {
    studentId,
    classId,
    conceptId,
    masteryLevel,
    remediationNeeded,
  });

  // Send to teachers
  sendToClass(classId, 'student:concept_update', {
    studentId,
    conceptId,
    masteryLevel,
    remediationNeeded,
  });
};

/**
 * Send velocity alert event (to teachers)
 */
export const sendVelocityAlertEvent = (
  teacherId: string,
  studentId: string,
  classId: string,
  currentVelocity: number,
  previousVelocity: number
): void => {
  sendToUser(teacherId, 'velocity:alert', {
    studentId,
    classId,
    currentVelocity,
    previousVelocity,
    change: ((currentVelocity - previousVelocity) / previousVelocity) * 100,
  });
};
