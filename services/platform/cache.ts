import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Cache Manager
// Platform-level cache management and operations
// ============================================================================

/**
 * Cache entry interface
 */
export interface CacheEntry {
  id: string;
  key: string;
  value: unknown;
  ttl: number;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
  metadata: Record<string, unknown>;
}

/**
 * Set cache entry
 */
export async function setCacheEntry(key: string, value: unknown, ttl: number = 300000): Promise<void> {
  try {
    cache.set(key, value, ttl);
    logger.debug('Cache entry set', { key, ttl });
  } catch (error) {
    logger.error('Failed to set cache entry', { error, key });
    throw new DatabaseError('Failed to set cache entry', { error });
  }
}

/**
 * Get cache entry
 */
export async function getCacheEntry<T>(key: string): Promise<T | null> {
  try {
    const value = cache.get<T>(key);
    return value;
  } catch (error) {
    logger.error('Failed to get cache entry', { error, key });
    throw new DatabaseError('Failed to get cache entry', { error });
  }
}

/**
 * Delete cache entry
 */
export async function deleteCacheEntry(key: string): Promise<void> {
  try {
    cache.delete(key);
    logger.debug('Cache entry deleted', { key });
  } catch (error) {
    logger.error('Failed to delete cache entry', { error, key });
    throw new DatabaseError('Failed to delete cache entry', { error });
  }
}

/**
 * Check if cache entry exists
 */
export async function hasCacheEntry(key: string): Promise<boolean> {
  try {
    return cache.has(key);
  } catch (error) {
    logger.error('Failed to check cache entry', { error, key });
    throw new DatabaseError('Failed to check cache entry', { error });
  }
}

/**
 * Get or set cache entry
 */
export async function getOrSetCacheEntry<T>(
  key: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  try {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await factory();
    cache.set(key, value, ttl);
    return value;
  } catch (error) {
    logger.error('Failed to get or set cache entry', { error, key });
    throw new DatabaseError('Failed to get or set cache entry', { error });
  }
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    cache.clear();
    logger.info('Cache cleared');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to clear cache', { error });
    throw new DatabaseError('Failed to clear cache', { error });
  }
}

/**
 * Clear cache entries by pattern
 */
export async function clearCacheByPattern(pattern: string): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    
    // This is a placeholder - in-memory cache doesn't support pattern matching
    // In production with Redis, this would use KEYS pattern
    logger.info('Cache cleared by pattern', { pattern });
    return 0;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to clear cache by pattern', { error, pattern });
    throw new DatabaseError('Failed to clear cache by pattern', { error });
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(): Promise<{
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageTTL: number;
  memoryUsage: number;
}> {
  try {
    // Placeholder for cache statistics
    // In production, this would return actual statistics from the cache implementation
    return {
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      averageTTL: 0,
      memoryUsage: 0,
    };
  } catch (error) {
    logger.error('Failed to get cache statistics', { error });
    throw new DatabaseError('Failed to get cache statistics', { error });
  }
}

/**
 * Warm up cache with data
 */
export async function warmUpCache(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    
    let count = 0;
    for (const entry of entries) {
      cache.set(entry.key, entry.value, entry.ttl);
      count++;
    }
    
    logger.info('Cache warmed up', { count });
    return count;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to warm up cache', { error });
    throw new DatabaseError('Failed to warm up cache', { error });
  }
}

/**
 * Invalidate cache entries
 */
export async function invalidateCache(keys: string[]): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    
    let count = 0;
    for (const key of keys) {
      cache.delete(key);
      count++;
    }
    
    logger.info('Cache invalidated', { count });
    return count;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to invalidate cache', { error });
    throw new DatabaseError('Failed to invalidate cache', { error });
  }
}

/**
 * Get cache keys
 */
export async function getCacheKeys(): Promise<string[]> {
  try {
    // Placeholder for getting cache keys
    // In production with Redis, this would use KEYS *
    return [];
  } catch (error) {
    logger.error('Failed to get cache keys', { error });
    throw new DatabaseError('Failed to get cache keys', { error });
  }
}

/**
 * Set cache entry with tags
 */
export async function setCacheEntryWithTags(
  key: string,
  value: unknown,
  tags: string[],
  ttl?: number
): Promise<void> {
  try {
    cache.set(key, value, ttl);
    // Store tag mapping for invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = cache.get<string[]>(tagKey) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        cache.set(tagKey, taggedKeys);
      }
    }
    logger.debug('Cache entry set with tags', { key, tags });
  } catch (error) {
    logger.error('Failed to set cache entry with tags', { error, key });
    throw new DatabaseError('Failed to set cache entry with tags', { error });
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCacheByTag(tag: string): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    
    const tagKey = `tag:${tag}`;
    const keys = cache.get<string[]>(tagKey) || [];
    
    let count = 0;
    for (const key of keys) {
      cache.delete(key);
      count++;
    }
    
    cache.delete(tagKey);
    logger.info('Cache invalidated by tag', { tag, count });
    return count;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to invalidate cache by tag', { error, tag });
    throw new DatabaseError('Failed to invalidate cache by tag', { error });
  }
}

/**
 * Get cache entry with metadata
 */
export async function getCacheEntryWithMetadata<T>(key: string): Promise<{
  value: T | null;
  exists: boolean;
  metadata: Record<string, unknown>;
}> {
  try {
    const value = cache.get<T>(key);
    const exists = cache.has(key);
    
    return {
      value,
      exists,
      metadata: {
        key,
        cached: exists,
      },
    };
  } catch (error) {
    logger.error('Failed to get cache entry with metadata', { error, key });
    throw new DatabaseError('Failed to get cache entry with metadata', { error });
  }
}

/**
 * Set multiple cache entries
 */
export async function setMultipleCacheEntries(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<number> {
  try {
    let count = 0;
    for (const entry of entries) {
      cache.set(entry.key, entry.value, entry.ttl);
      count++;
    }
    logger.debug('Multiple cache entries set', { count });
    return count;
  } catch (error) {
    logger.error('Failed to set multiple cache entries', { error });
    throw new DatabaseError('Failed to set multiple cache entries', { error });
  }
}

/**
 * Get multiple cache entries
 */
export async function getMultipleCacheEntries<T>(keys: string[]): Promise<Record<string, T | null>> {
  try {
    const result: Record<string, T | null> = {};
    for (const key of keys) {
      result[key] = cache.get<T>(key);
    }
    return result;
  } catch (error) {
    logger.error('Failed to get multiple cache entries', { error });
    throw new DatabaseError('Failed to get multiple cache entries', { error });
  }
}

/**
 * Delete multiple cache entries
 */
export async function deleteMultipleCacheEntries(keys: string[]): Promise<number> {
  try {
    let count = 0;
    for (const key of keys) {
      cache.delete(key);
      count++;
    }
    logger.debug('Multiple cache entries deleted', { count });
    return count;
  } catch (error) {
    logger.error('Failed to delete multiple cache entries', { error });
    throw new DatabaseError('Failed to delete multiple cache entries', { error });
  }
}

/**
 * Cache helper class for specific namespaces
 */
export class CacheNamespace {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return getCacheEntry<T>(this.getKey(key));
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    return setCacheEntry(this.getKey(key), value, ttl);
  }

  async delete(key: string): Promise<void> {
    return deleteCacheEntry(this.getKey(key));
  }

  async has(key: string): Promise<boolean> {
    return hasCacheEntry(this.getKey(key));
  }

  async clear(): Promise<void> {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    // Clear all keys with this prefix
    const keys = await getCacheKeys();
    const prefixedKeys = keys.filter(k => k.startsWith(this.prefix));
    await invalidateCache(prefixedKeys);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    return getOrSetCacheEntry(this.getKey(key), factory, ttl);
  }
}

/**
 * Create a cache namespace
 */
export function createCacheNamespace(prefix: string): CacheNamespace {
  return new CacheNamespace(prefix);
}

/**
 * Cache TTL helpers
 */
export const cacheTTL = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000,
  MONTH: 2592000000,
};

/**
 * Common cache namespaces
 */
export const cacheNamespaces = {
  TENANTS: 'tenants',
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  PLANS: 'plans',
  FEATURES: 'features',
  MODULES: 'modules',
  METRICS: 'metrics',
  HEALTH: 'health',
  MONITORING: 'monitoring',
};
