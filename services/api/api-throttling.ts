import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Throttling
// Request throttling for resource-intensive operations
// ============================================================================

/**
 * Throttle Configuration
 */
export interface ThrottleConfig {
  maxConcurrent: number;
  queueSize: number;
  timeout: number;
  priorityLevels?: number;
}

/**
 * Throttle Result
 */
export interface ThrottleResult {
  allowed: boolean;
  position?: number;
  estimatedWait?: number;
}

/**
 * Default throttle configurations
 */
export const DEFAULT_THROTTLE_CONFIGS: Record<string, ThrottleConfig> = {
  default: {
    maxConcurrent: 10,
    queueSize: 50,
    timeout: 30000,
  },
  strict: {
    maxConcurrent: 3,
    queueSize: 10,
    timeout: 60000,
  },
  relaxed: {
    maxConcurrent: 100,
    queueSize: 500,
    timeout: 60000,
  },
};

/**
 * Throttle queue entry
 */
interface ThrottleEntry {
  requestId: string;
  timestamp: number;
  priority: number;
}

/**
 * Active requests tracker
 */
interface ActiveRequests {
  count: number;
  requests: Map<string, number>;
}

/**
 * Get throttle key
 */
function getThrottleKey(
  resource: string,
  clinicId?: string
): string {
  const parts = ['throttle', resource];
  if (clinicId) {
    parts.push(clinicId);
  }
  return parts.join(':');
}

/**
 * Get queue key
 */
function getQueueKey(
  resource: string,
  clinicId?: string
): string {
  const parts = ['throttle-queue', resource];
  if (clinicId) {
    parts.push(clinicId);
  }
  return parts.join(':');
}

/**
 * Check throttle status
 */
export async function checkThrottle(
  resource: string,
  config: ThrottleConfig,
  clinicId?: string
): Promise<ThrottleResult> {
  const throttleKey = getThrottleKey(resource, clinicId);
  const queueKey = getQueueKey(resource, clinicId);

  try {
    const activeData = cache.get<string>(throttleKey);
    let active: ActiveRequests = { count: 0, requests: new Map() };

    if (activeData) {
      active = JSON.parse(activeData);
      // Clean up expired requests
      const now = Date.now();
      for (const [id, timestamp] of active.requests.entries()) {
        if (now - timestamp > config.timeout) {
          active.requests.delete(id);
          active.count--;
        }
      }
    }

    const queueData = cache.get<string>(queueKey);
    let queue: ThrottleEntry[] = queueData ? JSON.parse(queueData) : [];

    // Clean up expired queue entries
    const now = Date.now();
    queue = queue.filter((entry) => now - entry.timestamp < config.timeout);

    if (active.count < config.maxConcurrent) {
      // Request can proceed immediately
      return {
        allowed: true,
      };
    }

    if (queue.length >= config.queueSize) {
      // Queue is full
      return {
        allowed: false,
      };
    }

    // Request can be queued
    const position = queue.length + 1;
    const estimatedWait = Math.ceil(position * (config.timeout / config.maxConcurrent));

    return {
      allowed: true,
      position,
      estimatedWait,
    };
  } catch (error) {
    logger.error('Throttle check error', { resource, error });
    // Fail open
    return { allowed: true };
  }
}

/**
 * Acquire throttle slot
 */
export async function acquireThrottleSlot(
  resource: string,
  requestId: string,
  config: ThrottleConfig,
  clinicId?: string,
  priority: number = 0
): Promise<boolean> {
  const throttleKey = getThrottleKey(resource, clinicId);
  const queueKey = getQueueKey(resource, clinicId);

  try {
    const activeData = cache.get<string>(throttleKey);
    let active: ActiveRequests = { count: 0, requests: new Map() };

    if (activeData) {
      active = JSON.parse(activeData);
      // Clean up expired requests
      const now = Date.now();
      for (const [id, timestamp] of active.requests.entries()) {
        if (now - timestamp > config.timeout) {
          active.requests.delete(id);
          active.count--;
        }
      }
    }

    if (active.count < config.maxConcurrent) {
      // Acquire slot immediately
      active.requests.set(requestId, Date.now());
      active.count++;
      cache.set(throttleKey, JSON.stringify(active), config.timeout);
      return true;
    }

    // Add to queue
    const queueData = cache.get<string>(queueKey);
    let queue: ThrottleEntry[] = queueData ? JSON.parse(queueData) : [];

    if (queue.length >= config.queueSize) {
      return false;
    }

    queue.push({
      requestId,
      timestamp: Date.now(),
      priority,
    });

    // Sort by priority (higher priority first)
    queue.sort((a, b) => b.priority - a.priority);

    cache.set(queueKey, JSON.stringify(queue), config.timeout);
    return true;
  } catch (error) {
    logger.error('Throttle acquire error', { resource, requestId, error });
    return true;
  }
}

/**
 * Release throttle slot
 */
export async function releaseThrottleSlot(
  resource: string,
  requestId: string,
  config: ThrottleConfig,
  clinicId?: string
): Promise<void> {
  const throttleKey = getThrottleKey(resource, clinicId);
  const queueKey = getQueueKey(resource, clinicId);

  try {
    const activeData = cache.get<string>(throttleKey);
    if (activeData) {
      const active: ActiveRequests = JSON.parse(activeData);
      active.requests.delete(requestId);
      active.count = active.requests.size;
      cache.set(throttleKey, JSON.stringify(active), config.timeout);
    }

    // Process next item from queue
    const queueData = cache.get<string>(queueKey);
    if (queueData) {
      let queue: ThrottleEntry[] = JSON.parse(queueData);
      if (queue.length > 0) {
        const next = queue.shift();
        if (next) {
          const newActiveData = cache.get<string>(throttleKey);
          let newActive: ActiveRequests = { count: 0, requests: new Map() };
          if (newActiveData) {
            newActive = JSON.parse(newActiveData);
          }
          newActive.requests.set(next.requestId, Date.now());
          newActive.count++;
          cache.set(throttleKey, JSON.stringify(newActive), config.timeout);
        }
        cache.set(queueKey, JSON.stringify(queue), config.timeout);
      }
    }
  } catch (error) {
    logger.error('Throttle release error', { resource, requestId, error });
  }
}

/**
 * Get throttle status
 */
export async function getThrottleStatus(
  resource: string,
  clinicId?: string
): Promise<{
  active: number;
  queued: number;
  maxConcurrent: number;
  queueSize: number;
}> {
  const throttleKey = getThrottleKey(resource, clinicId);
  const queueKey = getQueueKey(resource, clinicId);

  const activeData = cache.get<string>(throttleKey);
  const active: ActiveRequests = activeData ? JSON.parse(activeData) : { count: 0, requests: new Map() };

  const queueData = cache.get<string>(queueKey);
  const queue: ThrottleEntry[] = queueData ? JSON.parse(queueData) : [];

  return {
    active: active.count,
    queued: queue.length,
    maxConcurrent: DEFAULT_THROTTLE_CONFIGS.default.maxConcurrent,
    queueSize: DEFAULT_THROTTLE_CONFIGS.default.queueSize,
  };
}

/**
 * Clear throttle for resource
 */
export async function clearThrottle(
  resource: string,
  clinicId?: string
): Promise<void> {
  const throttleKey = getThrottleKey(resource, clinicId);
  const queueKey = getQueueKey(resource, clinicId);

  cache.delete(throttleKey);
  cache.delete(queueKey);

  logger.info('Throttle cleared', { resource, clinicId });
}

/**
 * Create custom throttle config
 */
export function createThrottleConfig(
  maxConcurrent: number,
  queueSize: number,
  timeout: number,
  priorityLevels?: number
): ThrottleConfig {
  return {
    maxConcurrent,
    queueSize,
    timeout,
    priorityLevels,
  };
}
