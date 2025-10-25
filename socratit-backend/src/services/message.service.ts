// ============================================================================
// MESSAGE SERVICE
// Business logic for messaging between teachers and students
// ============================================================================

import { prisma } from '../config/database';
import { MessageType, UserRole, NotificationType } from '@prisma/client';
import { createNotification } from './notification.service';
import { sendMessage, sendToClass } from './websocket.service';

export interface SendDirectMessageData {
  senderId: string;
  recipientId: string;
  content: string;
  classId?: string;
}

export interface SendClassMessageData {
  senderId: string;
  classId: string;
  content: string;
  subject?: string;
  messageType: MessageType;
}

export interface GetConversationData {
  userId: string;
  otherUserId: string;
  page?: number;
  limit?: number;
}

/**
 * Validate if user can message another user
 * Students can only message teachers in their enrolled classes
 * Teachers can message any student in their classes
 */
export const validateMessagePermission = async (
  senderId: string,
  recipientId: string
): Promise<{ allowed: boolean; reason?: string }> => {
  // Get sender and recipient
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderId },
      select: { role: true, schoolId: true },
    }),
    prisma.user.findUnique({
      where: { id: recipientId },
      select: { role: true, schoolId: true },
    }),
  ]);

  if (!sender || !recipient) {
    return { allowed: false, reason: 'User not found' };
  }

  // Must be in same school
  if (sender.schoolId !== recipient.schoolId) {
    return { allowed: false, reason: 'Users must be in same school' };
  }

  // Teachers and students can message each other
  // Students can only message teachers (not other students)
  if (sender.role === UserRole.STUDENT && recipient.role === UserRole.STUDENT) {
    return { allowed: false, reason: 'Students cannot message other students' };
  }

  // Check if they share a class
  const sharedClass = await findSharedClass(senderId, recipientId);
  if (!sharedClass) {
    return {
      allowed: false,
      reason: 'Users must be in the same class to message',
    };
  }

  return { allowed: true };
};

/**
 * Find if two users share a class
 */
const findSharedClass = async (
  userId1: string,
  userId2: string
): Promise<boolean> => {
  const user1 = await prisma.user.findUnique({
    where: { id: userId1 },
    select: { role: true },
  });

  const user2 = await prisma.user.findUnique({
    where: { id: userId2 },
    select: { role: true },
  });

  if (!user1 || !user2) return false;

  // If one is teacher and one is student
  if (
    (user1.role === UserRole.TEACHER && user2.role === UserRole.STUDENT) ||
    (user1.role === UserRole.STUDENT && user2.role === UserRole.TEACHER)
  ) {
    const teacherId =
      user1.role === UserRole.TEACHER ? userId1 : userId2;
    const studentId =
      user1.role === UserRole.STUDENT ? userId1 : userId2;

    // Find classes where teacher teaches and student is enrolled
    const sharedClass = await prisma.class.findFirst({
      where: {
        teachers: {
          some: { teacherId },
        },
        enrollments: {
          some: {
            studentId,
            status: 'APPROVED',
          },
        },
      },
    });

    return !!sharedClass;
  }

  // If both are teachers, check if they teach the same class
  if (user1.role === UserRole.TEACHER && user2.role === UserRole.TEACHER) {
    const sharedClass = await prisma.class.findFirst({
      where: {
        teachers: {
          some: { teacherId: userId1 },
        },
        AND: {
          teachers: {
            some: { teacherId: userId2 },
          },
        },
      },
    });

    return !!sharedClass;
  }

  return false;
};

/**
 * Send a direct message
 */
export const sendDirectMessage = async (
  data: SendDirectMessageData
): Promise<any> => {
  const { senderId, recipientId, content, classId } = data;

  // Validate permission
  const permission = await validateMessagePermission(senderId, recipientId);
  if (!permission.allowed) {
    throw new Error(permission.reason || 'Not authorized to send message');
  }

  // Get sender info for notification
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { firstName: true, lastName: true, schoolId: true },
  });

  if (!sender) {
    throw new Error('Sender not found');
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId,
      classId,
      content,
      messageType: MessageType.DIRECT,
      schoolId: sender.schoolId,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  // Update or create conversation
  await updateConversation(senderId, recipientId, message.id, content);

  // Create notification for recipient
  await createNotification({
    userId: recipientId,
    schoolId: sender.schoolId,
    type: NotificationType.NEW_MESSAGE,
    title: 'New Message',
    message: `${sender.firstName} ${sender.lastName} sent you a message`,
    relatedResourceType: 'message',
    relatedResourceId: message.id,
    actionUrl: `/messages/${senderId}`,
  });

  // Send via WebSocket if recipient is online
  sendMessage(recipientId, message);

  return message;
};

/**
 * Send a message to entire class (teachers only)
 */
export const sendClassMessage = async (
  data: SendClassMessageData
): Promise<any> => {
  const { senderId, classId, content, subject, messageType } = data;

  // Verify sender is a teacher of this class
  const classTeacher = await prisma.classTeacher.findFirst({
    where: {
      classId,
      teacherId: senderId,
    },
    include: {
      class: {
        select: {
          name: true,
          schoolId: true,
        },
      },
      teacher: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!classTeacher) {
    throw new Error('Not authorized to send messages to this class');
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      senderId,
      classId,
      content,
      subject,
      messageType,
      schoolId: classTeacher.class.schoolId,
      isSystemMessage: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Get all enrolled students
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
    select: {
      studentId: true,
    },
  });

  // Create notifications for all students
  const notificationType =
    messageType === MessageType.ANNOUNCEMENT
      ? NotificationType.NEW_ANNOUNCEMENT
      : NotificationType.NEW_MESSAGE;

  const notificationPromises = enrollments.map((enrollment) =>
    createNotification({
      userId: enrollment.studentId,
      schoolId: classTeacher.class.schoolId,
      type: notificationType,
      title:
        messageType === MessageType.ANNOUNCEMENT
          ? `New Announcement in ${classTeacher.class.name}`
          : `New Message in ${classTeacher.class.name}`,
      message: subject || content.substring(0, 100),
      relatedResourceType: 'message',
      relatedResourceId: message.id,
      classId,
      actionUrl: `/classes/${classId}/messages`,
    })
  );

  await Promise.all(notificationPromises);

  // Broadcast to class room via WebSocket
  sendToClass(classId, 'class_message', message);

  return message;
};

/**
 * Get conversation history between two users
 */
export const getConversation = async (
  data: GetConversationData
): Promise<any> => {
  const { userId, otherUserId, page = 1, limit = 50 } = data;

  // Validate permission
  const permission = await validateMessagePermission(userId, otherUserId);
  if (!permission.allowed) {
    throw new Error(permission.reason || 'Not authorized to view conversation');
  }

  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: {
      messageType: MessageType.DIRECT,
      deletedAt: null,
      OR: [
        {
          senderId: userId,
          recipientId: otherUserId,
          deletedBySender: false,
        },
        {
          senderId: otherUserId,
          recipientId: userId,
          deletedByRecipient: false,
        },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip,
  });

  const total = await prisma.message.count({
    where: {
      messageType: MessageType.DIRECT,
      deletedAt: null,
      OR: [
        {
          senderId: userId,
          recipientId: otherUserId,
          deletedBySender: false,
        },
        {
          senderId: otherUserId,
          recipientId: userId,
          deletedByRecipient: false,
        },
      ],
    },
  });

  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId: string): Promise<any> => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    include: {
      participant1: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
      participant2: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  // Format conversations to show the other participant
  const formattedConversations = conversations.map((conv) => {
    const isParticipant1 = conv.participant1Id === userId;
    const otherParticipant = isParticipant1
      ? conv.participant2
      : conv.participant1;
    const unreadCount = isParticipant1 ? conv.unreadCount1 : conv.unreadCount2;
    const isMuted = isParticipant1 ? conv.isMutedBy1 : conv.isMutedBy2;
    const isArchived = isParticipant1
      ? conv.isArchivedBy1
      : conv.isArchivedBy2;

    return {
      conversationId: conv.id,
      otherUser: otherParticipant,
      lastMessagePreview: conv.lastMessagePreview,
      lastMessageAt: conv.lastMessageAt,
      unreadCount,
      isMuted,
      isArchived,
    };
  });

  return formattedConversations;
};

/**
 * Get class messages/announcements
 */
export const getClassMessages = async (
  classId: string,
  userId: string,
  messageType?: MessageType
): Promise<any> => {
  // Verify user has access to this class
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let hasAccess = false;

  if (user.role === UserRole.TEACHER) {
    const classTeacher = await prisma.classTeacher.findFirst({
      where: { classId, teacherId: userId },
    });
    hasAccess = !!classTeacher;
  } else if (user.role === UserRole.STUDENT) {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: { classId, studentId: userId, status: 'APPROVED' },
    });
    hasAccess = !!enrollment;
  }

  if (!hasAccess) {
    throw new Error('Not authorized to view messages for this class');
  }

  const whereClause: any = {
    classId,
    deletedAt: null,
  };

  if (messageType) {
    whereClause.messageType = messageType;
  } else {
    whereClause.OR = [
      { messageType: MessageType.CLASS_GROUP },
      { messageType: MessageType.ANNOUNCEMENT },
    ];
  }

  const messages = await prisma.message.findMany({
    where: whereClause,
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });

  return messages;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<void> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { recipientId: true, senderId: true, isRead: true },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Only recipient can mark as read
  if (message.recipientId !== userId) {
    throw new Error('Not authorized to mark this message as read');
  }

  // Don't update if already read
  if (message.isRead) {
    return;
  }

  await prisma.$transaction([
    // Update message
    prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    }),
    // Decrement unread count in conversation
  ]);

  // Update conversation unread count
  const conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        {
          participant1Id: message.senderId,
          participant2Id: message.recipientId,
        },
        {
          participant1Id: message.recipientId,
          participant2Id: message.senderId,
        },
      ],
    },
  });

  if (conversation) {
    const isParticipant1 = conversation.participant1Id === userId;
    const unreadCountField = isParticipant1 ? 'unreadCount1' : 'unreadCount2';

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        [unreadCountField]: Math.max(
          0,
          (conversation as any)[unreadCountField] - 1
        ),
      },
    });
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const count = await prisma.message.count({
    where: {
      recipientId: userId,
      isRead: false,
      deletedAt: null,
      deletedByRecipient: false,
    },
  });

  return count;
};

/**
 * Delete message (soft delete)
 */
export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, recipientId: true },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  const isSender = message.senderId === userId;
  const isRecipient = message.recipientId === userId;

  if (!isSender && !isRecipient) {
    throw new Error('Not authorized to delete this message');
  }

  // Soft delete for the user
  await prisma.message.update({
    where: { id: messageId },
    data: {
      ...(isSender && { deletedBySender: true }),
      ...(isRecipient && { deletedByRecipient: true }),
      // If both deleted, mark as fully deleted
      ...(message.senderId === userId &&
        message.recipientId === null && { deletedAt: new Date() }),
    },
  });
};

/**
 * Update or create conversation
 */
const updateConversation = async (
  userId1: string,
  userId2: string,
  lastMessageId: string,
  messagePreview: string
): Promise<void> => {
  // Ensure consistent ordering
  const [participant1Id, participant2Id] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const isUser1Sender = userId1 === participant1Id;

  await prisma.conversation.upsert({
    where: {
      participant1Id_participant2Id: {
        participant1Id,
        participant2Id,
      },
    },
    update: {
      lastMessageId,
      lastMessageAt: new Date(),
      lastMessagePreview: messagePreview.substring(0, 200),
      // Increment unread count for recipient
      ...(isUser1Sender
        ? { unreadCount2: { increment: 1 } }
        : { unreadCount1: { increment: 1 } }),
    },
    create: {
      participant1Id,
      participant2Id,
      lastMessageId,
      lastMessageAt: new Date(),
      lastMessagePreview: messagePreview.substring(0, 200),
      // Set initial unread count for recipient
      ...(isUser1Sender ? { unreadCount2: 1 } : { unreadCount1: 1 }),
    },
  });
};

/**
 * Search messages
 */
export const searchMessages = async (
  userId: string,
  query: string,
  limit: number = 20
): Promise<any> => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, deletedBySender: false },
        { recipientId: userId, deletedByRecipient: false },
      ],
      content: {
        contains: query,
        mode: 'insensitive',
      },
      deletedAt: null,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return messages;
};
