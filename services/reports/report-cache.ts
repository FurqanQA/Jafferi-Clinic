import { logger } from '../shared/logger';
import { ReportCache } from './report-types';

// ============================================================================
// Report Cache
// Caching layer for report results to improve performance
// ============================================================================

/**
 * In-memory cache store (placeholder for Redis or similar)
 */
const cacheStore = new Map<string, ReportCache>();

/**
 * Default cache TTL in seconds
 */
const DEFAULT_CACHE_TTL = 3600; // 1 hour

/**
 * Generate cache key for a report
 */
export function generateCacheKey(reportId: string, parameters: Record<string, any>): string {
  const paramsString = JSON.stringify(parameters);
  return `${reportId}:${Buffer.from(paramsString).toString('base64')}`;
}

/**
 * Cache report result
 */
export async function cacheReportResult(
  reportId: string,
  data: any,
  parameters: Record<string, any>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(reportId, parameters);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const cacheEntry: ReportCache = {
      id: `CACHE-${Date.now()}`,
      reportId,
      cacheKey,
      data,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
    };

    cacheStore.set(cacheKey, cacheEntry);

    logger.info('Report result cached', { reportId, cacheKey, ttl });
  } catch (error) {
    logger.error('Failed to cache report result', { error, reportId });
  }
}

/**
 * Get cached report result
 */
export async function getCachedReportResult(
  reportId: string,
  parameters: Record<string, any>
): Promise<any | null> {
  try {
    const cacheKey = generateCacheKey(reportId, parameters);
    const cached = cacheStore.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (new Date(cached.expiresAt) < new Date()) {
      cacheStore.delete(cacheKey);
      logger.info('Cache entry expired', { cacheKey });
      return null;
    }

    // Increment hit count
    cached.hitCount++;
    cacheStore.set(cacheKey, cached);

    logger.info('Cache hit', { reportId, cacheKey, hitCount: cached.hitCount });
    return cached.data;
  } catch (error) {
    logger.error('Failed to get cached report result', { error, reportId });
    return null;
  }
}

/**
 * Invalidate cache for a specific report
 */
export async function invalidateReportCache(reportId: string): Promise<void> {
  try {
    let invalidatedCount = 0;

    for (const [key, cache] of cacheStore.entries()) {
      if (cache.reportId === reportId) {
        cacheStore.delete(key);
        invalidatedCount++;
      }
    }

    logger.info('Report cache invalidated', { reportId, invalidatedCount });
  } catch (error) {
    logger.error('Failed to invalidate report cache', { error, reportId });
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCacheByKey(cacheKey: string): Promise<void> {
  try {
    cacheStore.delete(cacheKey);
    logger.info('Cache entry invalidated by key', { cacheKey });
  } catch (error) {
    logger.error('Failed to invalidate cache by key', { error, cacheKey });
  }
}

/**
 * Clear all expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const now = new Date();
    let clearedCount = 0;

    for (const [key, cache] of cacheStore.entries()) {
      if (new Date(cache.expiresAt) < now) {
        cacheStore.delete(key);
        clearedCount++;
      }
    }

    logger.info('Expired cache entries cleared', { clearedCount });
    return clearedCount;
  } catch (error) {
    logger.error('Failed to clear expired cache', { error });
    return 0;
  }
}

/**
 * Clear all cache entries
 */
export async function clearAllCache(): Promise<number> {
  try {
    const count = cacheStore.size;
    cacheStore.clear();
    logger.info('All cache cleared', { count });
    return count;
  } catch (error) {
    logger.error('Failed to clear all cache', { error });
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(): Promise<{
  totalEntries: number;
  expiredEntries: number;
  totalHits: number;
  averageHitCount: number;
}> {
  try {
    const now = new Date();
    let expiredEntries = 0;
    let totalHits = 0;

    for (const cache of cacheStore.values()) {
      if (new Date(cache.expiresAt) < now) {
        expiredEntries++;
      }
      totalHits += cache.hitCount;
    }

    const totalEntries = cacheStore.size;
    const averageHitCount = totalEntries > 0 ? totalHits / totalEntries : 0;

    return {
      totalEntries,
      expiredEntries,
      totalHits,
      averageHitCount,
    };
  } catch (error) {
    logger.error('Failed to get cache statistics', { error });
    return {
      totalEntries: 0,
      expiredEntries: 0,
      totalHits: 0,
      averageHitCount: 0,
    };
  }
}

/**
 * Get cache entry details
 */
export async function getCacheEntry(cacheKey: string): Promise<ReportCache | null> {
  try {
    return cacheStore.get(cacheKey) || null;
  } catch (error) {
    logger.error('Failed to get cache entry', { error, cacheKey });
    return null;
  }
}

/**
 * Set custom TTL for cache entry
 */
export async function setCacheTTL(cacheKey: string, ttl: number): Promise<void> {
  try {
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      const now = new Date();
      cached.expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();
      cacheStore.set(cacheKey, cached);
      logger.info('Cache TTL updated', { cacheKey, ttl });
    }
  } catch (error) {
    logger.error('Failed to set cache TTL', { error, cacheKey });
  }
}

/**
 * Warm up cache for frequently accessed reports
 */
export async function warmUpCache(reportIds: string[]): Promise<void> {
  logger.info('Warming up cache', { reportIds });
  // Placeholder for cache warming logic
  // This would pre-generate reports for frequently accessed reports
}

/**
 * Get cache keys for a report
 */
export async function getReportCacheKeys(reportId: string): Promise<string[]> {
  try {
    const keys: string[] = [];
    for (const [key, cache] of cacheStore.entries()) {
      if (cache.reportId === reportId) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    logger.error('Failed to get report cache keys', { error, reportId });
    return [];
  }
}
