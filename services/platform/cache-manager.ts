import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Cache Manager
// Advanced cache management with persistence and synchronization
// ============================================================================

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  persistToDatabase: boolean;
  syncInterval: number;
}

/**
 * Cache policy
 */
export interface CachePolicy {
  name: string;
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  refreshOnAccess: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
  evictions: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 10000,
  defaultTTL: 300000,
  persistToDatabase: false,
  syncInterval: 60000,
};

/**
 * Cache manager class
 */
export class CacheManager {
  private config: CacheConfig;
  private stats: CacheStats;
  private policies: Map<string, CachePolicy>;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0,
      evictions: 0,
    };
    this.policies = new Map();
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = cache.get<T>(key);
    
    if (value !== null) {
      this.stats.hits++;
      this.updateHitRate();
      return value;
    }
    
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set cache value
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const policy = this.policies.get(key.split(':')[0]);
    const effectiveTTL = ttl || policy?.ttl || this.config.defaultTTL;
    
    cache.set(key, value, effectiveTTL);
    this.stats.size++;
    this.updateMemoryUsage();
  }

  /**
   * Delete cache value
   */
  async delete(key: string): Promise<void> {
    cache.delete(key);
    this.stats.size--;
    this.updateMemoryUsage();
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return cache.has(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    cache.clear();
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
    logger.info('Cache cleared by manager');
  }

  /**
   * Get or set pattern
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Register cache policy
   */
  registerPolicy(policy: CachePolicy): void {
    this.policies.set(policy.name, policy);
    logger.info('Cache policy registered', { policy: policy.name });
  }

  /**
   * Get cache policy
   */
  getPolicy(name: string): CachePolicy | undefined {
    return this.policies.get(name);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: this.stats.size,
      memoryUsage: this.stats.memoryUsage,
      evictions: this.stats.evictions,
    };
    logger.info('Cache statistics reset');
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Update memory usage (estimate)
   */
  private updateMemoryUsage(): void {
    // Placeholder for memory usage calculation
    // In production, this would calculate actual memory usage
    this.stats.memoryUsage = this.stats.size * 1024; // Estimate 1KB per entry
  }

  /**
   * Evict entries based on policy
   */
  async evictEntries(count: number): Promise<number> {
    // Placeholder for eviction logic
    // In production, this would implement LRU/LFU/FIFO eviction
    this.stats.evictions += count;
    this.stats.size -= count;
    logger.info('Cache entries evicted', { count });
    return count;
  }

  /**
   * Warm up cache with data
   */
  async warmUp(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
      count++;
    }
    logger.info('Cache warmed up', { count });
    return count;
  }

  /**
   * Invalidate by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    // Placeholder for pattern-based invalidation
    logger.info('Cache invalidated by pattern', { pattern });
    return 0;
  }

  /**
   * Persist cache to database
   */
  async persistToDatabase(): Promise<void> {
    if (!this.config.persistToDatabase) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      // Placeholder for persistence logic
      // In production, this would serialize cache entries to database
      logger.info('Cache persisted to database');
    } catch (error) {
      logger.error('Failed to persist cache to database', { error });
      throw new DatabaseError('Failed to persist cache to database', { error });
    }
  }

  /**
   * Load cache from database
   */
  async loadFromDatabase(): Promise<void> {
    if (!this.config.persistToDatabase) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      // Placeholder for loading logic
      // In production, this would deserialize cache entries from database
      logger.info('Cache loaded from database');
    } catch (error) {
      logger.error('Failed to load cache from database', { error });
      throw new DatabaseError('Failed to load cache from database', { error });
    }
  }

  /**
   * Get cache health
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    stats: CacheStats;
  } {
    const { hitRate, size, memoryUsage } = this.stats;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;

    if (hitRate < 50) {
      status = 'unhealthy';
      message = 'Cache hit rate is critically low';
    } else if (hitRate < 70) {
      status = 'degraded';
      message = 'Cache hit rate is below optimal';
    } else if (size > this.config.maxSize * 0.9) {
      status = 'degraded';
      message = 'Cache is near capacity';
    } else {
      status = 'healthy';
      message = 'Cache is operating normally';
    }

    return {
      status,
      message,
      stats: this.getStatistics(),
    };
  }

  /**
   * Optimize cache
   */
  async optimize(): Promise<void> {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    
    const health = this.getHealth();
    
    if (health.status === 'unhealthy' || health.status === 'degraded') {
      // Evict old entries if hit rate is low
      if (health.stats.hitRate < 70) {
        await this.evictEntries(Math.floor(health.stats.size * 0.1));
      }
      
      logger.info('Cache optimized', { previousStatus: health.status });
    }
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  async updateConfig(config: Partial<CacheConfig>): Promise<void> {
    await validatePlatformWritePermission(PlatformResource.CACHE);
    
    this.config = { ...this.config, ...config };
    logger.info('Cache configuration updated', { config });
  }
}

/**
 * Global cache manager instance
 */
let globalCacheManager: CacheManager | null = null;

/**
 * Initialize global cache manager
 */
export function initializeCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(config);
    logger.info('Global cache manager initialized');
  }
  return globalCacheManager;
}

/**
 * Get global cache manager
 */
export function getCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager();
  }
  return globalCacheManager;
}

/**
 * Default cache policies
 */
export const defaultCachePolicies: CachePolicy[] = [
  {
    name: 'tenants',
    ttl: 3600000, // 1 hour
    maxSize: 1000,
    evictionPolicy: 'lru',
    refreshOnAccess: false,
  },
  {
    name: 'users',
    ttl: 1800000, // 30 minutes
    maxSize: 5000,
    evictionPolicy: 'lru',
    refreshOnAccess: false,
  },
  {
    name: 'subscriptions',
    ttl: 300000, // 5 minutes
    maxSize: 2000,
    evictionPolicy: 'lru',
    refreshOnAccess: true,
  },
  {
    name: 'features',
    ttl: 60000, // 1 minute
    maxSize: 100,
    evictionPolicy: 'lru',
    refreshOnAccess: true,
  },
  {
    name: 'metrics',
    ttl: 300000, // 5 minutes
    maxSize: 5000,
    evictionPolicy: 'lfu',
    refreshOnAccess: false,
  },
];

/**
 * Register default policies
 */
export function registerDefaultPolicies(manager: CacheManager): void {
  for (const policy of defaultCachePolicies) {
    manager.registerPolicy(policy);
  }
  logger.info('Default cache policies registered');
}

/**
 * Cache manager utilities
 */
export const cacheManagerUtils = {
  /**
   * Create a namespaced cache manager
   */
  createNamespacedManager(prefix: string): CacheManager {
    const manager = new CacheManager();
    // Override methods to add prefix
    const originalGet = manager.get.bind(manager);
    manager.get = async <T>(key: string) => originalGet<T>(`${prefix}:${key}`);
    
    const originalSet = manager.set.bind(manager);
    manager.set = async (key: string, value: unknown, ttl?: number) => 
      originalSet(`${prefix}:${key}`, value, ttl);
    
    const originalDelete = manager.delete.bind(manager);
    manager.delete = async (key: string) => originalDelete(`${prefix}:${key}`);
    
    const originalHas = manager.has.bind(manager);
    manager.has = async (key: string) => originalHas(`${prefix}:${key}`);
    
    return manager;
  },

  /**
   * Create a cache manager with specific policy
   */
  createWithPolicy(policy: CachePolicy): CacheManager {
    const manager = new CacheManager();
    manager.registerPolicy(policy);
    return manager;
  },

  /**
   * Monitor cache health
   */
  async monitorHealth(interval: number = 60000): Promise<void> {
    const manager = getCacheManager();
    const health = manager.getHealth();
    
    logger.info('Cache health check', health);
    
    if (health.status !== 'healthy') {
      await manager.optimize();
    }
  },

  /**
   * Start automatic health monitoring
   */
  startHealthMonitoring(interval: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      cacheManagerUtils.monitorHealth(interval);
    }, interval);
  },
};
