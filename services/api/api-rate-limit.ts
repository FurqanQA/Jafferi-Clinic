import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Rate Limiting
// Rate limiting implementation using sliding window algorithm
// ============================================================================

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
  retryAfter?: number;
}

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Default rate limit configurations
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
  strict: {
    windowMs: 60000,
    maxRequests: 10,
  },
  relaxed: {
    windowMs: 60000,
    maxRequests: 1000,
  },
};

/**
 * Rate limit tracker key
 */
function getRateLimitKey(
  identifier: string,
  clinicId?: string
): string {
  const parts = ['ratelimit', identifier];
  if (clinicId) {
    parts.push(clinicId);
  }
  return parts.join(':');
}

/**
 * Check rate limit
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  clinicId?: string
): Promise<RateLimitResult> {
  const key = getRateLimitKey(identifier, clinicId);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const cached = cache.get<string>(key);
    let requests: number[] = [];

    if (cached) {
      requests = JSON.parse(cached);
      // Remove requests outside the current window
      requests = requests.filter((timestamp) => timestamp > windowStart);
    }

    const currentCount = requests.length;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const allowed = currentCount < config.maxRequests;

    if (allowed) {
      requests.push(now);
      cache.set(key, JSON.stringify(requests), config.windowMs);
    }

    // Calculate reset time (when oldest request expires)
    const reset = requests.length > 0
      ? requests[0] + config.windowMs
      : now + config.windowMs;

    const result: RateLimitResult = {
      allowed,
      remaining,
      reset,
      limit: config.maxRequests,
    };

    if (!allowed) {
      result.retryAfter = Math.ceil((reset - now) / 1000);
      logger.warn('Rate limit exceeded', {
        identifier,
        clinicId,
        limit: config.maxRequests,
        window: config.windowMs,
      });
    }

    return result;
  } catch (error) {
    logger.error('Rate limit check error', { identifier, error });
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      reset: now + config.windowMs,
      limit: config.maxRequests,
    };
  }
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(
  identifier: string,
  clinicId?: string
): Promise<void> {
  const key = getRateLimitKey(identifier, clinicId);
  cache.delete(key);
  logger.info('Rate limit reset', { identifier, clinicId });
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
  clinicId?: string
): Promise<{
  current: number;
  remaining: number;
  reset: number;
}> {
  const key = getRateLimitKey(identifier, clinicId);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const cached = cache.get<string>(key);
  let requests: number[] = [];

  if (cached) {
    requests = JSON.parse(cached);
    requests = requests.filter((timestamp) => timestamp > windowStart);
  }

  const current = requests.length;
  const remaining = Math.max(0, config.maxRequests - current);
  const reset = requests.length > 0
    ? requests[0] + config.windowMs
    : now + config.windowMs;

  return { current, remaining, reset };
}

/**
 * Rate limit middleware result
 */
export async function rateLimitMiddleware(
  identifier: string,
  config: RateLimitConfig,
  clinicId?: string
): Promise<RateLimitResult> {
  return await checkRateLimit(identifier, config, clinicId);
}

/**
 * Create custom rate limit config
 */
export function createRateLimitConfig(
  windowMs: number,
  maxRequests: number,
  options?: {
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  }
): RateLimitConfig {
  return {
    windowMs,
    maxRequests,
    skipSuccessfulRequests: options?.skipSuccessfulRequests,
    skipFailedRequests: options?.skipFailedRequests,
  };
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupExpiredRateLimits(): void {
  // Placeholder for cleanup logic
  // In a real implementation with Redis, this would be handled by TTL
  logger.debug('Rate limit cleanup triggered');
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(): Promise<{
  totalIdentifiers: number;
  totalRequests: number;
  blockedRequests: number;
}> {
  // Placeholder for statistics
  return {
    totalIdentifiers: 0,
    totalRequests: 0,
    blockedRequests: 0,
  };
}
