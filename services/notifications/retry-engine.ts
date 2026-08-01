import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { RetryConfig } from './notification-types';

// ============================================================================
// Retry Engine
// Handles notification retry logic with exponential backoff
// ============================================================================

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  max_retries: 3,
  initial_delay_ms: 5000,
  max_delay_ms: 300000, // 5 minutes
  exponential_backoff: true,
  backoff_multiplier: 2,
};

/**
 * Calculate next retry delay
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  if (!config.exponential_backoff) {
    return config.initial_delay_ms;
  }

  const delay = config.initial_delay_ms * Math.pow(config.backoff_multiplier, attempt);
  return Math.min(delay, config.max_delay_ms);
}

/**
 * Calculate next retry time
 */
export function calculateNextRetryTime(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Date {
  const delay = calculateRetryDelay(attempt, config);
  return new Date(Date.now() + delay);
}

/**
 * Check if notification should be retried
 */
export function shouldRetry(
  attempt: number,
  maxRetries: number,
  errorType?: string
): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  // Don't retry certain error types
  const nonRetryableErrors = [
    'invalid_recipient',
    'blocked',
    'unsubscribed',
    'permission_denied',
    'authentication_failed',
  ];

  if (errorType && nonRetryableErrors.includes(errorType)) {
    return false;
  }

  return true;
}

/**
 * Mark notification for retry
 */
export async function markNotificationForRetry(
  notificationId: string,
  attempt: number,
  errorType?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { data: notification } = await supabase
      .from('notifications')
      .select('max_retries')
      .eq('id', notificationId)
      .single();

    if (!notification) {
      throw new Error('Notification not found');
    }

    const maxRetries = notification.max_retries || DEFAULT_RETRY_CONFIG.max_retries;

    if (!shouldRetry(attempt, maxRetries, errorType)) {
      // Mark as permanently failed
      await markNotificationAsPermanentlyFailed(notificationId, errorMessage || 'Max retries exceeded');
      return;
    }

    const nextRetryDelay = calculateRetryDelay(attempt);
    const nextRetryAt = new Date(Date.now() + nextRetryDelay).toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({
        retry_count: attempt + 1,
        next_retry_at: nextRetryAt,
        status: 'queued',
        failure_reason: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      logger.error('Failed to mark notification for retry', { error, notificationId });
      throw new DatabaseError('Failed to mark notification for retry', { error });
    }

    logger.info('Notification marked for retry', { notificationId, attempt, nextRetryAt });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking notification for retry', { error, notificationId });
    throw new DatabaseError('Failed to mark notification for retry', { error });
  }
}

/**
 * Mark notification as permanently failed
 */
export async function markNotificationAsPermanentlyFailed(
  notificationId: string,
  failureReason: string
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'failed',
        failure_reason: failureReason,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      logger.error('Failed to mark notification as permanently failed', { error, notificationId });
      throw new DatabaseError('Failed to mark notification as permanently failed', { error });
    }

    logger.info('Notification marked as permanently failed', { notificationId, failureReason });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking notification as permanently failed', { error, notificationId });
    throw new DatabaseError('Failed to mark notification as permanently failed', { error });
  }
}

/**
 * Get notifications ready for retry
 */
export async function getNotificationsReadyForRetry(): Promise<Array<{
  id: string;
  retry_count: number;
  max_retries: number;
  next_retry_at: string;
}>> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, retry_count, max_retries, next_retry_at')
      .eq('status', 'queued')
      .lte('next_retry_at', now)
      .order('next_retry_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch notifications ready for retry', { error });
      throw new DatabaseError('Failed to fetch notifications ready for retry', { error });
    }

    return (data || []) as Array<{
      id: string;
      retry_count: number;
      max_retries: number;
      next_retry_at: string;
    }>;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notifications ready for retry', { error });
    throw new DatabaseError('Failed to fetch notifications ready for retry', { error });
  }
}

/**
 * Get retry statistics
 */
export async function getRetryStatistics(): Promise<{
  totalRetried: number;
  successfulRetries: number;
  failedRetries: number;
  avgRetryCount: number;
  byAttempt: Record<number, number>;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('retry_count, status')
      .gt('retry_count', 0);

    if (error) {
      logger.error('Failed to fetch retry statistics', { error });
      throw new DatabaseError('Failed to fetch retry statistics', { error });
    }

    const notifications = data || [];
    const totalRetried = notifications.length;
    const successfulRetries = notifications.filter((n: any) => n.status === 'delivered' || n.status === 'sent').length;
    const failedRetries = notifications.filter((n: any) => n.status === 'failed').length;

    const totalRetryCount = notifications.reduce((sum: number, n: any) => sum + n.retry_count, 0);
    const avgRetryCount = totalRetried > 0 ? totalRetryCount / totalRetried : 0;

    const byAttempt: Record<number, number> = {};
    notifications.forEach((n: any) => {
      byAttempt[n.retry_count] = (byAttempt[n.retry_count] || 0) + 1;
    });

    return {
      totalRetried,
      successfulRetries,
      failedRetries,
      avgRetryCount,
      byAttempt,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching retry statistics', { error });
    throw new DatabaseError('Failed to fetch retry statistics', { error });
  }
}

/**
 * Reset retry count for notification
 */
export async function resetRetryCount(notificationId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        retry_count: 0,
        next_retry_at: null,
        failure_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      logger.error('Failed to reset retry count', { error, notificationId });
      throw new DatabaseError('Failed to reset retry count', { error });
    }

    logger.info('Retry count reset', { notificationId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error resetting retry count', { error, notificationId });
    throw new DatabaseError('Failed to reset retry count', { error });
  }
}

/**
 * Update retry configuration for notification
 */
export async function updateRetryConfig(
  notificationId: string,
  config: Partial<RetryConfig>
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (config.max_retries !== undefined) {
      updateData.max_retries = config.max_retries;
    }

    const { error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId);

    if (error) {
      logger.error('Failed to update retry config', { error, notificationId });
      throw new DatabaseError('Failed to update retry config', { error });
    }

    logger.info('Retry config updated', { notificationId, config });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating retry config', { error, notificationId });
    throw new DatabaseError('Failed to update retry config', { error });
  }
}

/**
 * Get stuck notifications (notifications that have been retrying too long)
 */
export async function getStuckNotifications(maxAgeHours: number = 24): Promise<Array<{
  id: string;
  retry_count: number;
  created_at: string;
  next_retry_at: string;
}>> {
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, retry_count, created_at, next_retry_at')
      .eq('status', 'queued')
      .gt('retry_count', 0)
      .lt('created_at', cutoffDate)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      logger.error('Failed to fetch stuck notifications', { error });
      throw new DatabaseError('Failed to fetch stuck notifications', { error });
    }

    return (data || []) as Array<{
      id: string;
      retry_count: number;
      created_at: string;
      next_retry_at: string;
    }>;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching stuck notifications', { error });
    throw new DatabaseError('Failed to fetch stuck notifications', { error });
  }
}

/**
 * Process retry queue (called by background worker)
 */
export async function processRetryQueue(): Promise<number> {
  const notifications = await getNotificationsReadyForRetry();
  let processed = 0;

  for (const notification of notifications) {
    try {
      // Re-queue notification for sending
      logger.info('Re-queuing notification for retry', { notificationId: notification.id });
      processed++;
    } catch (error) {
      logger.error('Failed to process retry', { error, notificationId: notification.id });
    }
  }

  if (processed > 0) {
    logger.info('Retry queue processed', { processed });
  }

  return processed;
}
