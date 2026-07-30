/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  value: T;
  expiry: number | null;
}

/**
 * Simple in-memory cache implementation
 * Designed for future extension to Redis or other cache providers
 */
class Cache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl !== undefined ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set pattern
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Singleton cache instance
 */
export const cache = new Cache();

/**
 * Cache helper functions
 */
export const cacheHelpers = {
  /**
   * Cache key generator for common patterns
   */
  keys: {
    user: (id: string) => `user:${id}`,
    clinic: (id: string) => `clinic:${id}`,
    appointment: (id: string) => `appointment:${id}`,
    patient: (id: string) => `patient:${id}`,
    list: (prefix: string, params: Record<string, unknown>) => 
      `${prefix}:${JSON.stringify(params)}`,
  },

  /**
   * Default TTL values
   */
  ttl: {
    SHORT: 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    DAY: 24 * 60 * 60 * 1000, // 1 day
  },
};
