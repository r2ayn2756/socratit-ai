// ============================================================================
// REDIS CONFIGURATION (OPTIONAL)
// Redis client for rate limiting, caching, and session management
// Falls back to in-memory storage when Redis is unavailable
// ============================================================================

import Redis from 'ioredis';
import { env } from './env';

// In-memory fallback storage
const memoryStore = new Map<string, { value: string; expiry: number }>();

// Redis client (optional)
let redis: Redis | null = null;
let redisAvailable = false;

// Attempt to connect to Redis if enabled
if (env.REDIS_ENABLED) {
  redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => {
      // Stop retrying after 3 attempts
      if (times > 3) {
        console.log('⚠️  Redis unavailable - using in-memory fallback');
        redisAvailable = false;
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect until first operation
  });

  // Redis connection event handlers
  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
    redisAvailable = true;
  });

  redis.on('error', (error) => {
    console.warn('⚠️  Redis error (falling back to memory):', error.message);
    redisAvailable = false;
  });

  redis.on('close', () => {
    console.log('⚠️  Redis connection closed - using in-memory fallback');
    redisAvailable = false;
  });

  // Try to connect
  redis.connect().catch(() => {
    console.log('⚠️  Redis unavailable - using in-memory fallback');
    redisAvailable = false;
  });
} else {
  console.log('ℹ️  Redis disabled - using in-memory storage');
}

// Graceful shutdown handler
export const disconnectRedis = async (): Promise<void> => {
  if (redis && redisAvailable) {
    await redis.quit();
    console.log('✅ Redis disconnected');
  }
};

// Clean up expired items from memory store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expiry < now) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

// ============================================================================
// Helper functions with automatic fallback
// ============================================================================

/**
 * Set a value with expiration (Redis or memory fallback)
 */
export const setWithExpiry = async (
  key: string,
  value: string,
  expirySeconds: number
): Promise<void> => {
  if (redis && redisAvailable) {
    try {
      await redis.setex(key, expirySeconds, value);
      return;
    } catch (error) {
      console.warn('Redis setWithExpiry failed, using memory:', error);
      redisAvailable = false;
    }
  }

  // Fallback to memory
  memoryStore.set(key, {
    value,
    expiry: Date.now() + expirySeconds * 1000,
  });
};

/**
 * Get a value (Redis or memory fallback)
 */
export const get = async (key: string): Promise<string | null> => {
  if (redis && redisAvailable) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.warn('Redis get failed, using memory:', error);
      redisAvailable = false;
    }
  }

  // Fallback to memory
  const item = memoryStore.get(key);
  if (!item) return null;

  // Check if expired
  if (item.expiry < Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  return item.value;
};

/**
 * Delete a key (Redis or memory fallback)
 */
export const del = async (key: string): Promise<void> => {
  if (redis && redisAvailable) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.warn('Redis del failed, using memory:', error);
      redisAvailable = false;
    }
  }

  // Fallback to memory
  memoryStore.delete(key);
};

/**
 * Check if a key exists (Redis or memory fallback)
 */
export const exists = async (key: string): Promise<boolean> => {
  if (redis && redisAvailable) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Redis exists failed, using memory:', error);
      redisAvailable = false;
    }
  }

  // Fallback to memory
  const item = memoryStore.get(key);
  if (!item) return false;

  // Check if expired
  if (item.expiry < Date.now()) {
    memoryStore.delete(key);
    return false;
  }

  return true;
};

/**
 * Blacklist an access token (for logout)
 */
export const blacklistToken = async (
  token: string,
  expirySeconds: number
): Promise<void> => {
  await setWithExpiry(`blacklist:${token}`, '1', expirySeconds);
};

/**
 * Check if a token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  return await exists(`blacklist:${token}`);
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
  return redisAvailable;
};

/**
 * Get storage type being used
 */
export const getStorageType = (): 'redis' | 'memory' => {
  return redisAvailable ? 'redis' : 'memory';
};
