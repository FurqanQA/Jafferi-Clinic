import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Cache
// Caching layer for API responses
// ============================================================================

/**
 * Cache Configuration
 */
export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number;
  prefix: string;
  maxSize?: number;
}

/**
 * Cache Entry
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: string;
  ttl: number;
  hits: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  defaultTTL: 300000, // 5 minutes
  prefix: 'api',
  maxSize: 1000,
};

/**
 * Get cache configuration
 */
export function getCacheConfig(): CacheConfig {
  return DEFAULT_CACHE_CONFIG;
}

/**
 * Generate cache key
 */
export function generateCacheKey(
  method: string,
  path: string,
  query?: Record<string, string>,
  clinicId?: string
): string {
  const parts = [DEFAULT_CACHE_CONFIG.prefix, method, path];

  if (clinicId) {
    parts.push(clinicId);
  }

  if (query && Object.keys(query).length > 0) {
    const queryString = new URLSearchParams(query).toString();
    parts.push(queryString);
  }

  return parts.join(':');
}

/**
 * Get cached data
 */
export async function getCachedData<T = unknown>(
  key: string
): Promise<T | null> {
  try {
    const config = getCacheConfig();
    if (!config.enabled) {
      return null;
    }

    const cached = cache.get<string>(key);
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    const entryTime = new Date(entry.timestamp).getTime();

    if (now - entryTime > entry.ttl) {
      cache.delete(key);
      return null;
    }

    entry.hits += 1;
    cache.set(key, JSON.stringify(entry), entry.ttl);

    logger.debug('Cache hit', { key, hits: entry.hits });
    return entry.data;
  } catch (error) {
    logger.error('Cache get error', { key, error });
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCachedData<T = unknown>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  try {
    const config = getCacheConfig();
    if (!config.enabled) {
      return;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date().toISOString(),
      ttl: ttl || config.defaultTTL,
      hits: 0,
    };

    cache.set(key, JSON.stringify(entry), entry.ttl);
    logger.debug('Cache set', { key, ttl: entry.ttl });
  } catch (error) {
    logger.error('Cache set error', { key, error });
  }
}

/**
 * Invalidate cache
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    cache.delete(key);
    logger.debug('Cache invalidated', { key });
  } catch (error) {
    logger.error('Cache invalidate error', { key, error });
  }
}

/**
 * Clear all API cache
 */
export async function clearApiCache(): Promise<void> {
  try {
    cache.clear();
    logger.info('API cache cleared');
  } catch (error) {
    logger.error('Cache clear error', { error });
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  try {
    const config = getCacheConfig();
    const fullPattern = `${config.prefix}:${pattern}`;
    // Placeholder for pattern-based invalidation
    // In a real implementation, this would use Redis keys command
    logger.debug('Cache pattern invalidated', { pattern: fullPattern });
  } catch (error) {
    logger.error('Cache pattern invalidate error', { pattern, error });
  }
}

/**
 * Invalidate cache by clinic
 */
export async function invalidateCacheByClinic(clinicId: string): Promise<void> {
  await invalidateCacheByPattern(`*:${clinicId}:*`);
}

/**
 * Invalidate cache by path
 */
export async function invalidateCacheByPath(path: string): Promise<void> {
  await invalidateCacheByPattern(`*:${path}:*`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number;
  hits: number;
  misses: number;
}> {
  // Placeholder for cache statistics
  return {
    keys: 0,
    hits: 0,
    misses: 0,
  };
}

/**
 * Cache middleware result
 */
export async function cacheMiddleware<T = unknown>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = await getCachedData<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  await setCachedData(key, data, ttl);
  return data;
}

/**
 * Check if caching is enabled
 */
export function isCacheEnabled(): boolean {
  return getCacheConfig().enabled;
}

/**
 * Enable or disable caching
 */
export function setCacheEnabled(enabled: boolean): void {
  DEFAULT_CACHE_CONFIG.enabled = enabled;
  logger.info('Cache enabled changed', { enabled });
}

/**
 * Set default TTL
 */
export function setDefaultTTL(ttl: number): void {
  DEFAULT_CACHE_CONFIG.defaultTTL = ttl;
  logger.info('Cache default TTL changed', { ttl });
}

/**
 * Warm up cache with data
 */
export async function warmUpCache(
  entries: Array<{ key: string; data: unknown; ttl?: number }>
): Promise<void> {
  for (const entry of entries) {
    await setCachedData(entry.key, entry.data, entry.ttl);
  }
  logger.info('Cache warmed up', { entryCount: entries.length });
}
