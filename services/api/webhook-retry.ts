import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { Webhook } from './api-types';

// ============================================================================
// Webhook Retry
// Webhook retry logic with exponential backoff
// ============================================================================

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 5000, // 5 seconds
  maxDelay: 300000, // 5 minutes
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Check if status code is retryable
 */
export function isRetryableStatusCode(statusCode: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  return config.retryableStatusCodes.includes(statusCode);
}

/**
 * Check if webhook delivery should be retried
 */
export function shouldRetry(
  attempt: number,
  statusCode: number | undefined,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  if (attempt >= config.maxRetries) {
    return false;
  }

  if (statusCode === undefined) {
    return true; // Network errors are retryable
  }

  return isRetryableStatusCode(statusCode, config);
}

/**
 * Get next retry timestamp
 */
export function getNextRetryTimestamp(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): Date {
  const delay = calculateRetryDelay(attempt, config);
  return new Date(Date.now() + delay);
}

/**
 * Schedule webhook retry
 */
export async function scheduleWebhookRetry(
  deliveryId: string,
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Date> {
  const nextRetryAt = getNextRetryTimestamp(attempt, config);
  
  // Store retry schedule in cache
  cache.set(`webhook-retry:${deliveryId}`, nextRetryAt.toISOString(), config.maxDelay);
  
  logger.info('Webhook retry scheduled', { deliveryId, attempt, nextRetryAt });
  return nextRetryAt;
}

/**
 * Get scheduled retry time
 */
export function getScheduledRetryTime(deliveryId: string): Date | null {
  const scheduled = cache.get<string>(`webhook-retry:${deliveryId}`);
  if (!scheduled) {
    return null;
  }

  return new Date(scheduled);
}

/**
 * Clear scheduled retry
 */
export function clearScheduledRetry(deliveryId: string): void {
  cache.delete(`webhook-retry:${deliveryId}`);
  logger.info('Webhook retry cleared', { deliveryId });
}

/**
 * Get pending retries
 */
export function getPendingRetries(): Array<{
  deliveryId: string;
  scheduledAt: Date;
}> {
  const pending: Array<{ deliveryId: string; scheduledAt: Date }> = [];
  const now = Date.now();

  // In production, this would query a retry queue
  // For now, return empty array
  return pending;
}

/**
 * Update retry configuration
 */
export function updateRetryConfig(config: Partial<RetryConfig>): RetryConfig {
  Object.assign(DEFAULT_RETRY_CONFIG, config);
  logger.info('Retry configuration updated', { config: DEFAULT_RETRY_CONFIG });
  return { ...DEFAULT_RETRY_CONFIG };
}

/**
 * Get retry configuration
 */
export function getRetryConfig(): RetryConfig {
  return { ...DEFAULT_RETRY_CONFIG };
}

/**
 * Calculate total retry time
 */
export function calculateTotalRetryTime(config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  let total = 0;
  for (let i = 1; i <= config.maxRetries; i++) {
    total += calculateRetryDelay(i, config);
  }
  return total;
}

/**
 * Get retry statistics
 */
export function getRetryStatistics(clinicId: string): Promise<{
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryCount: number;
}> {
  // Placeholder for retry statistics
  // In production, this would query delivery history
  return Promise.resolve({
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageRetryCount: 0,
  });
}

/**
 * Create custom retry configuration
 */
export function createRetryConfig(overrides: Partial<RetryConfig>): RetryConfig {
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...overrides,
  };
}

/**
 * Validate retry configuration
 */
export function validateRetryConfig(config: RetryConfig): boolean {
  if (config.maxRetries < 0 || config.maxRetries > 10) {
    return false;
  }
  if (config.initialDelay < 100 || config.initialDelay > 60000) {
    return false;
  }
  if (config.maxDelay < config.initialDelay) {
    return false;
  }
  if (config.backoffMultiplier < 1 || config.backoffMultiplier > 10) {
    return false;
  }
  return true;
}

/**
 * Get retry attempt info
 */
export function getRetryAttemptInfo(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): {
  attempt: number;
  delay: number;
  isLastAttempt: boolean;
} {
  const delay = calculateRetryDelay(attempt, config);
  const isLastAttempt = attempt >= config.maxRetries;

  return {
    attempt,
    delay,
    isLastAttempt,
  };
}
