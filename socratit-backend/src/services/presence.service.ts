// ============================================================================
// PRESENCE SERVICE
// Manages user online/offline status for real-time features
// ============================================================================

import { prisma } from '../config/database';
import { setWithExpiry, get, del } from '../config/redis';

const PRESENCE_TTL = 300; // 5 minutes in seconds

/**
 * Set user as online
 */
export const setUserOnline = async (
  userId: string,
  socketId: string
): Promise<void> => {
  try {
    // Update database
    await prisma.userPresence.upsert({
      where: { userId },
      update: {
        isOnline: true,
        lastSeenAt: new Date(),
        socketId,
      },
      create: {
        userId,
        isOnline: true,
        lastSeenAt: new Date(),
        socketId,
      },
    });

    // Store in Redis for fast lookup
    await setWithExpiry(
      `presence:${userId}`,
      JSON.stringify({
        isOnline: true,
        socketId,
        lastSeenAt: new Date().toISOString(),
      }),
      PRESENCE_TTL
    );

    // Map socket to user for cleanup
    await setWithExpiry(`socket:${socketId}`, userId, PRESENCE_TTL);

    console.log(`[PRESENCE] User ${userId} is now online (socket: ${socketId})`);
  } catch (error) {
    console.error('[PRESENCE ERROR]', error);
  }
};

/**
 * Set user as offline
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    // Get current presence to clean up socket mapping
    const presence = await prisma.userPresence.findUnique({
      where: { userId },
      select: { socketId: true },
    });

    // Update database
    await prisma.userPresence.update({
      where: { userId },
      data: {
        isOnline: false,
        lastSeenAt: new Date(),
        socketId: null,
      },
    });

    // Update Redis
    await setWithExpiry(
      `presence:${userId}`,
      JSON.stringify({
        isOnline: false,
        lastSeenAt: new Date().toISOString(),
      }),
      PRESENCE_TTL
    );

    // Clean up socket mapping
    if (presence?.socketId) {
      await del(`socket:${presence.socketId}`);
    }

    console.log(`[PRESENCE] User ${userId} is now offline`);
  } catch (error) {
    console.error('[PRESENCE ERROR]', error);
  }
};

/**
 * Get user presence status
 */
export const getUserPresence = async (
  userId: string
): Promise<{
  isOnline: boolean;
  lastSeenAt: Date;
} | null> => {
  try {
    // Try Redis first for speed
    const cached = await get(`presence:${userId}`);
    if (cached) {
      const data = JSON.parse(cached);
      return {
        isOnline: data.isOnline,
        lastSeenAt: new Date(data.lastSeenAt),
      };
    }

    // Fall back to database
    const presence = await prisma.userPresence.findUnique({
      where: { userId },
      select: {
        isOnline: true,
        lastSeenAt: true,
      },
    });

    if (presence) {
      // Cache for next time
      await setWithExpiry(
        `presence:${userId}`,
        JSON.stringify({
          isOnline: presence.isOnline,
          lastSeenAt: presence.lastSeenAt.toISOString(),
        }),
        PRESENCE_TTL
      );
    }

    return presence;
  } catch (error) {
    console.error('[PRESENCE ERROR]', error);
    return null;
  }
};

/**
 * Get presence for multiple users
 */
export const getBulkUserPresence = async (
  userIds: string[]
): Promise<Record<string, { isOnline: boolean; lastSeenAt: Date }>> => {
  try {
    const presences = await prisma.userPresence.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        isOnline: true,
        lastSeenAt: true,
      },
    });

    const result: Record<
      string,
      { isOnline: boolean; lastSeenAt: Date }
    > = {};

    presences.forEach((p) => {
      result[p.userId] = {
        isOnline: p.isOnline,
        lastSeenAt: p.lastSeenAt,
      };
    });

    return result;
  } catch (error) {
    console.error('[PRESENCE ERROR]', error);
    return {};
  }
};

/**
 * Get online users in a class
 */
export const getClassOnlineUsers = async (
  classId: string
): Promise<string[]> => {
  try {
    // Get all class members (teachers and students)
    const [teachers, students] = await Promise.all([
      prisma.classTeacher.findMany({
        where: { classId },
        select: { teacherId: true },
      }),
      prisma.classEnrollment.findMany({
        where: { classId, status: 'APPROVED' },
        select: { studentId: true },
      }),
    ]);

    const allMemberIds = [
      ...teachers.map((t) => t.teacherId),
      ...students.map((s) => s.studentId),
    ];

    // Get online status for all members
    const onlineUsers = await prisma.userPresence.findMany({
      where: {
        userId: { in: allMemberIds },
        isOnline: true,
      },
      select: {
        userId: true,
      },
    });

    return onlineUsers.map((u) => u.userId);
  } catch (error) {
    console.error('[PRESENCE ERROR]', error);
    return [];
  }
};

/**
 * Update last seen timestamp (heartbeat)
 */
export const updateLastSeen = async (userId: string): Promise<void> => {
  try {
    await prisma.userPresence.update({
      where: { userId },
      data: {
        lastSeenAt: new Date(),
      },
    });

    // Update Redis cache
    const cached = await get(`presence:${userId}`);
    if (cached) {
      const data = JSON.parse(cached);
      data.lastSeenAt = new Date().toISOString();
      await setWithExpiry(
        `presence:${userId}`,
        JSON.stringify(data),
        PRESENCE_TTL
      );
    }
  } catch (error) {
    console.error('[PRESENCE HEARTBEAT ERROR]', error);
  }
};

/**
 * Get user ID from socket ID
 */
export const getUserIdFromSocket = async (
  socketId: string
): Promise<string | null> => {
  try {
    const userId = await get(`socket:${socketId}`);
    return userId;
  } catch (error) {
    console.error('[PRESENCE ERROR]', error);
    return null;
  }
};

/**
 * Cleanup stale presence records (run periodically)
 */
export const cleanupStalePresence = async (): Promise<number> => {
  try {
    // Users not seen in last 10 minutes should be marked offline
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const result = await prisma.userPresence.updateMany({
      where: {
        isOnline: true,
        lastSeenAt: {
          lt: tenMinutesAgo,
        },
      },
      data: {
        isOnline: false,
        socketId: null,
      },
    });

    if (result.count > 0) {
      console.log(`[PRESENCE CLEANUP] Marked ${result.count} users offline`);
    }

    return result.count;
  } catch (error) {
    console.error('[PRESENCE CLEANUP ERROR]', error);
    return 0;
  }
};
