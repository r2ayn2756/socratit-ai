// ============================================================================
// ANALYTICS CACHE UTILITY
// Redis-based caching for analytics data
// ============================================================================

import { setWithExpiry, get, del } from '../config/redis';

const CACHE_TTL = {
  CLASS_OVERVIEW: 5 * 60, // 5 minutes
  CONCEPT_HEATMAP: 10 * 60, // 10 minutes
  PERFORMANCE_DISTRIBUTION: 5 * 60, // 5 minutes
  ENGAGEMENT_METRICS: 5 * 60, // 5 minutes
  ASSIGNMENT_PERFORMANCE: 5 * 60, // 5 minutes
  STUDENT_TIMELINE: 15 * 60, // 15 minutes
  CONCEPT_COMPARISON: 10 * 60, // 10 minutes
};

/**
 * Generate cache key for analytics data
 */
function generateCacheKey(type: string, ...identifiers: string[]): string {
  return `analytics:${type}:${identifiers.join(':')}`;
}

/**
 * Get cached analytics data
 */
export async function getCachedAnalytics<T>(
  type: keyof typeof CACHE_TTL,
  ...identifiers: string[]
): Promise<T | null> {
  try {
    const key = generateCacheKey(type, ...identifiers);
    const cached = await get(key);

    if (cached) {
      return JSON.parse(cached) as T;
    }

    return null;
  } catch (error) {
    console.error('Error getting cached analytics:', error);
    return null;
  }
}

/**
 * Set cached analytics data
 */
export async function setCachedAnalytics<T>(
  type: keyof typeof CACHE_TTL,
  data: T,
  ...identifiers: string[]
): Promise<void> {
  try {
    const key = generateCacheKey(type, ...identifiers);
    const ttl = CACHE_TTL[type];

    await setWithExpiry(key, JSON.stringify(data), ttl);
  } catch (error) {
    console.error('Error setting cached analytics:', error);
  }
}

/**
 * Invalidate cached analytics for a class
 */
export async function invalidateClassCache(classId: string): Promise<void> {
  try {
    // Find and delete all keys related to this class
    const patterns = [
      `analytics:CLASS_OVERVIEW:${classId}`,
      `analytics:CONCEPT_HEATMAP:${classId}`,
      `analytics:PERFORMANCE_DISTRIBUTION:${classId}`,
      `analytics:ENGAGEMENT_METRICS:${classId}`,
      `analytics:ASSIGNMENT_PERFORMANCE:${classId}`,
    ];

    for (const pattern of patterns) {
      await del(pattern);
    }
  } catch (error) {
    console.error('Error invalidating class cache:', error);
  }
}

/**
 * Invalidate cached analytics for a student
 */
export async function invalidateStudentCache(studentId: string, classId?: string): Promise<void> {
  try {
    // Delete specific patterns - simplified version
    // In production, you may want to use SCAN instead of KEYS for better performance
    await del(`analytics:STUDENT_TIMELINE:${studentId}`);
    await del(`analytics:CONCEPT_COMPARISON:${studentId}`);

    // Also invalidate class cache if provided
    if (classId) {
      await invalidateClassCache(classId);
    }
  } catch (error) {
    console.error('Error invalidating student cache:', error);
  }
}
