import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';

// ============================================================================
// Retry Engine
// Intelligent retry logic with exponential backoff
// ============================================================================

/**
 * Retry Strategy interface
 */
export interface RetryStrategy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
}

/**
 * Retry Attempt interface
 */
export interface RetryAttempt {
  id: string;
  jobId: string;
  attemptNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error: string | null;
  delay: number;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  createdAt: string;
}

/**
 * Default retry strategy
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 60000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'],
};

/**
 * Calculate delay with exponential backoff
 */
export function calculateDelay(attempt: number, strategy: RetryStrategy): number {
  let delay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);
  delay = Math.min(delay, strategy.maxDelay);

  // Add jitter if enabled
  if (strategy.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.round(delay);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error, strategy: RetryStrategy): boolean {
  const errorMessage = error.message;
  const errorCode = (error as any).code;

  // Check if error code is in retryable errors
  if (errorCode && strategy.retryableErrors.includes(errorCode)) {
    return true;
  }

  // Check if error message contains retryable patterns
  const retryablePatterns = [
    'timeout',
    'network',
    'connection',
    'econnreset',
    'etimedout',
    'econnrefused',
    'enotfound',
    'rate limit',
    'too many requests',
  ];

  const lowerMessage = errorMessage.toLowerCase();
  return retryablePatterns.some(pattern => lowerMessage.includes(pattern));
}

/**
 * Create retry attempt
 */
export async function createRetryAttempt(jobId: string, attemptNumber: number, strategy: RetryStrategy): Promise<RetryAttempt> {
  try {
    const supabase = getSupabaseClient();

    const attemptId = `retry-${Date.now()}`;
    const now = new Date().toISOString();
    const delay = calculateDelay(attemptNumber, strategy);
    const scheduledFor = new Date(Date.now() + delay).toISOString();

    const { data: attempt, error } = await supabase
      .from('retry_attempts')
      .insert({
        id: attemptId,
        job_id: jobId,
        attempt_number: attemptNumber,
        status: 'pending',
        error: null,
        delay,
        scheduled_for: scheduledFor,
        started_at: null,
        completed_at: null,
        duration: null,
        created_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create retry attempt', { error, jobId });
      throw new DatabaseError('Failed to create retry attempt', { error });
    }

    logger.info('Retry attempt created', { attemptId, jobId, attemptNumber, delay });

    return attempt as RetryAttempt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating retry attempt', { error, jobId });
    throw new DatabaseError('Failed to create retry attempt', { error });
  }
}

/**
 * Get retry attempt by ID
 */
export async function getRetryAttempt(attemptId: string): Promise<RetryAttempt> {
  try {
    const supabase = getSupabaseClient();

    const { data: attempt, error } = await supabase
      .from('retry_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (error) {
      logger.error('Failed to fetch retry attempt', { error, attemptId });
      throw new DatabaseError('Failed to fetch retry attempt', { error });
    }

    if (!attempt) {
      throw new NotFoundError('Retry attempt not found');
    }

    return attempt as RetryAttempt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching retry attempt', { error, attemptId });
    throw new DatabaseError('Failed to fetch retry attempt', { error });
  }
}

/**
 * Update retry attempt
 */
export async function updateRetryAttempt(attemptId: string, data: {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  duration?: number | null;
}): Promise<RetryAttempt> {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.startedAt !== undefined) updateData.started_at = data.startedAt;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
    if (data.duration !== undefined) updateData.duration = data.duration;

    const { data: attempt, error } = await supabase
      .from('retry_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update retry attempt', { error, attemptId });
      throw new DatabaseError('Failed to update retry attempt', { error });
    }

    if (!attempt) {
      throw new NotFoundError('Retry attempt not found');
    }

    return attempt as RetryAttempt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating retry attempt', { error, attemptId });
    throw new DatabaseError('Failed to update retry attempt', { error });
  }
}

/**
 * Start retry attempt
 */
export async function startRetryAttempt(attemptId: string): Promise<RetryAttempt> {
  return updateRetryAttempt(attemptId, {
    status: 'running',
    startedAt: new Date().toISOString(),
  });
}

/**
 * Complete retry attempt
 */
export async function completeRetryAttempt(attemptId: string): Promise<RetryAttempt> {
  const attempt = await getRetryAttempt(attemptId);
  const duration = attempt.startedAt
    ? Date.now() - new Date(attempt.startedAt).getTime()
    : null;

  return updateRetryAttempt(attemptId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    duration,
  });
}

/**
 * Fail retry attempt
 */
export async function failRetryAttempt(attemptId: string, error: string): Promise<RetryAttempt> {
  const attempt = await getRetryAttempt(attemptId);
  const duration = attempt.startedAt
    ? Date.now() - new Date(attempt.startedAt).getTime()
    : null;

  return updateRetryAttempt(attemptId, {
    status: 'failed',
    error,
    completedAt: new Date().toISOString(),
    duration,
  });
}

/**
 * Get retry attempts for job
 */
export async function getRetryAttempts(jobId: string): Promise<RetryAttempt[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: attempts, error } = await supabase
      .from('retry_attempts')
      .select('*')
      .eq('job_id', jobId)
      .order('attempt_number', { ascending: true });

    if (error) {
      logger.error('Failed to fetch retry attempts', { error, jobId });
      throw new DatabaseError('Failed to fetch retry attempts', { error });
    }

    return (attempts || []) as RetryAttempt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching retry attempts', { error, jobId });
    throw new DatabaseError('Failed to fetch retry attempts', { error });
  }
}

/**
 * Get pending retry attempts
 */
export async function getPendingRetryAttempts(): Promise<RetryAttempt[]> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: attempts, error } = await supabase
      .from('retry_attempts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (error) {
      logger.error('Failed to fetch pending retry attempts', { error });
      throw new DatabaseError('Failed to fetch pending retry attempts', { error });
    }

    return (attempts || []) as RetryAttempt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pending retry attempts', { error });
    throw new DatabaseError('Failed to fetch pending retry attempts', { error });
  }
}

/**
 * Execute with retry logic
 */
export async function executeWithRetry<T>(
  jobId: string,
  fn: () => Promise<T>,
  strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY
): Promise<T> {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < strategy.maxAttempts) {
    attempt++;

    try {
      // Create retry attempt record
      const retryAttempt = await createRetryAttempt(jobId, attempt, strategy);
      await startRetryAttempt(retryAttempt.id);

      // Execute the function
      const result = await fn();

      // Mark attempt as completed
      await completeRetryAttempt(retryAttempt.id);

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(lastError, strategy)) {
        logger.warn('Error is not retryable, aborting', { error: lastError.message });
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt >= strategy.maxAttempts) {
        logger.error('Max retry attempts reached', { attempt, maxAttempts: strategy.maxAttempts });
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt + 1, strategy);
      logger.info(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: lastError.message });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Get retry statistics for job
 */
export async function getRetryStatistics(jobId: string): Promise<{
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageDuration: number;
  totalDuration: number;
}> {
  try {
    const attempts = await getRetryAttempts(jobId);

    const successfulAttempts = attempts.filter(a => a.status === 'completed').length;
    const failedAttempts = attempts.filter(a => a.status === 'failed').length;

    const completedAttempts = attempts.filter(a => a.status === 'completed' && a.duration !== null);
    const totalDuration = completedAttempts.reduce((sum, a) => sum + (a.duration || 0), 0);
    const averageDuration = completedAttempts.length > 0 ? totalDuration / completedAttempts.length : 0;

    return {
      totalAttempts: attempts.length,
      successfulAttempts,
      failedAttempts,
      averageDuration,
      totalDuration,
    };
  } catch (error) {
    logger.error('Failed to get retry statistics', { error, jobId });
    throw new DatabaseError('Failed to get retry statistics', { error });
  }
}

/**
 * Create custom retry strategy
 */
export function createRetryStrategy(config: Partial<RetryStrategy>): RetryStrategy {
  return {
    ...DEFAULT_RETRY_STRATEGY,
    ...config,
  };
}

/**
 * Linear backoff strategy
 */
export const LINEAR_BACKOFF_STRATEGY: RetryStrategy = {
  ...DEFAULT_RETRY_STRATEGY,
  backoffMultiplier: 1,
};

/**
 * Immediate retry strategy (no delay)
 */
export const IMMEDIATE_RETRY_STRATEGY: RetryStrategy = {
  ...DEFAULT_RETRY_STRATEGY,
  initialDelay: 0,
  backoffMultiplier: 0,
  maxDelay: 0,
  jitter: false,
};

/**
 * Aggressive retry strategy (short delays, more attempts)
 */
export const AGGRESSIVE_RETRY_STRATEGY: RetryStrategy = {
  ...DEFAULT_RETRY_STRATEGY,
  maxAttempts: 5,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 1.5,
};

/**
 * Conservative retry strategy (long delays, fewer attempts)
 */
export const CONSERVATIVE_RETRY_STRATEGY: RetryStrategy = {
  ...DEFAULT_RETRY_STRATEGY,
  maxAttempts: 2,
  initialDelay: 5000,
  maxDelay: 120000,
  backoffMultiplier: 3,
};
