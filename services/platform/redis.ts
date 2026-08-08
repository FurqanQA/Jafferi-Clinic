import { logger } from '../shared/logger';

// ============================================================================
// Redis Client
// Redis connection and operations (placeholder for Redis integration)
// ============================================================================

/**
 * Redis configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: boolean;
}

/**
 * Redis client interface
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<void>;
  ping(): Promise<boolean>;
  disconnect(): Promise<void>;
}

/**
 * In-memory Redis client (placeholder for production Redis)
 */
class InMemoryRedisClient implements RedisClient {
  private store: Map<string, { value: string; expiry: number | null }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiry = ttl !== undefined ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.store.get(key);
    
    if (entry) {
      entry.expiry = Date.now() + ttl * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    
    if (!entry || !entry.expiry) {
      return -1;
    }
    
    const remaining = Math.floor((entry.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for in-memory store
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const allKeys = Array.from(this.store.keys());
    return allKeys.filter(key => regex.test(key));
  }

  async flushdb(): Promise<void> {
    this.store.clear();
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    // No-op for in-memory client
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry && entry.expiry < now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Global Redis client instance
 */
let redisClient: RedisClient | null = null;
let redisConfig: RedisConfig | null = null;

/**
 * Initialize Redis client
 */
export async function initializeRedis(config: RedisConfig): Promise<void> {
  try {
    redisConfig = config;

    // In production, use actual Redis client (ioredis, redis, etc.)
    // For now, use in-memory implementation
    redisClient = new InMemoryRedisClient();

    // Test connection
    const pong = await redisClient.ping();
    if (!pong) {
      throw new Error('Redis connection failed');
    }

    logger.info('Redis client initialized successfully', { host: config.host, port: config.port });

    // Start periodic cleanup for in-memory client
    setInterval(() => {
      if (redisClient instanceof InMemoryRedisClient) {
        redisClient.cleanExpired();
      }
    }, 60000); // Clean every minute
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error, config });
    throw new Error('Failed to initialize Redis client');
  }
}

/**
 * Get Redis client
 */
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis first.');
  }
  return redisClient;
}

/**
 * Check if Redis is initialized
 */
export function isRedisInitialized(): boolean {
  return redisClient !== null;
}

/**
 * Get Redis configuration
 */
export function getRedisConfig(): RedisConfig | null {
  return redisConfig;
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    redisConfig = null;
    logger.info('Redis client disconnected');
  }
}

/**
 * Reconnect Redis client
 */
export async function reconnectRedis(): Promise<void> {
  if (redisConfig) {
    await disconnectRedis();
    await initializeRedis(redisConfig);
  }
}

/**
 * Redis utility functions
 */
export const redisUtils = {
  /**
   * Set a value with TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedisClient();
    await client.set(key, value, ttl);
  },

  /**
   * Get a value
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return client.get(key);
  },

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    return client.exists(key);
  },

  /**
   * Set expiry on key
   */
  async expire(key: string, ttl: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, ttl);
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    const client = getRedisClient();
    return client.ttl(key);
  },

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const client = getRedisClient();
    return client.keys(pattern);
  },

  /**
   * Flush database
   */
  async flushdb(): Promise<void> {
    const client = getRedisClient();
    await client.flushdb();
  },

  /**
   * Ping Redis
   */
  async ping(): Promise<boolean> {
    const client = getRedisClient();
    return client.ping();
  },

  /**
   * Set JSON value (helper)
   */
  async setJson(key: string, value: unknown, ttl?: number): Promise<void> {
    const json = JSON.stringify(value);
    await this.set(key, json, ttl);
  },

  /**
   * Get JSON value (helper)
   */
  async getJson<T>(key: string): Promise<T | null> {
    const json = await this.get(key);
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      logger.error('Failed to parse JSON from Redis', { key, error });
      return null;
    }
  },

  /**
   * Increment value
   */
  async increment(key: string): Promise<number> {
    const client = getRedisClient();
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  },

  /**
   * Decrement value
   */
  async decrement(key: string): Promise<number> {
    const client = getRedisClient();
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) - 1 : -1;
    await this.set(key, value.toString());
    return value;
  },

  /**
   * Set with NX (only if not exists)
   */
  async setnx(key: string, value: string, ttl?: number): Promise<boolean> {
    const exists = await this.exists(key);
    if (exists) {
      return false;
    }
    await this.set(key, value, ttl);
    return true;
  },

  /**
   * Get multiple keys
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    const client = getRedisClient();
    const results: (string | null)[] = [];
    for (const key of keys) {
      results.push(await client.get(key));
    }
    return results;
  },

  /**
   * Set multiple keys
   */
  async mset(keyValuePairs: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      await this.set(key, value);
    }
  },

  /**
   * Delete multiple keys
   */
  async mdel(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.del(key);
    }
  },
};

/**
 * Redis cache helper
 */
export class RedisCache {
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return redisUtils.getJson<T>(this.getKey(key));
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    return redisUtils.setJson(this.getKey(key), value, ttl);
  }

  async del(key: string): Promise<void> {
    return redisUtils.del(this.getKey(key));
  }

  async exists(key: string): Promise<boolean> {
    return redisUtils.exists(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keys = await redisUtils.keys(`${this.prefix}:*`);
    await redisUtils.mdel(keys);
  }

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
}

/**
 * Redis lock helper
 */
export class RedisLock {
  private prefix: string = 'lock';
  private ttl: number = 30000; // 30 seconds default

  constructor(ttl?: number) {
    if (ttl) {
      this.ttl = ttl;
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async acquire(key: string): Promise<boolean> {
    return redisUtils.setnx(this.getKey(key), '1', this.ttl);
  }

  async release(key: string): Promise<void> {
    return redisUtils.del(this.getKey(key));
  }

  async isLocked(key: string): Promise<boolean> {
    return redisUtils.exists(this.getKey(key));
  }

  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquire(key);
    if (!acquired) {
      throw new Error('Lock already held');
    }

    try {
      return await fn();
    } finally {
      await this.release(key);
    }
  }
}

/**
 * Redis rate limiter
 */
export class RedisRateLimiter {
  private prefix: string = 'ratelimit';

  private getKey(identifier: string): string {
    return `${this.prefix}:${identifier}`;
  }

  async check(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = this.getKey(identifier);
    const current = await redisUtils.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return false;
    }

    await redisUtils.set(key, (count + 1).toString(), window / 1000);
    return true;
  }

  async reset(identifier: string): Promise<void> {
    return redisUtils.del(this.getKey(identifier));
  }

  async getRemaining(identifier: string, limit: number): Promise<number> {
    const key = this.getKey(identifier);
    const current = await redisUtils.get(key);
    const count = current ? parseInt(current, 10) : 0;
    return Math.max(0, limit - count);
  }
}
