import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';

// ============================================================================
// Scheduler
// Manages scheduled notifications with timezone support
// Placeholder for future cron integration
// ============================================================================

/**
 * In-memory scheduled jobs storage (placeholder for cron/external scheduler)
 */
const scheduledJobs: Map<string, { notificationId: string; scheduledAt: string; timezone?: string }> = new Map();

/**
 * Schedule notification for future delivery
 */
export async function scheduleNotification(
  notificationId: string,
  scheduledAt: string,
  timezone?: string
): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate scheduled time
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    if (scheduledDate <= now) {
      throw new Error('Scheduled time must be in the future');
    }

    // Store in memory
    const jobId = `SCHED_${notificationId}_${Date.now()}`;
    scheduledJobs.set(jobId, {
      notificationId,
      scheduledAt,
      timezone,
    });

    // Store in database for persistence
    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        notification_id: notificationId,
        scheduled_at: scheduledAt,
        timezone: timezone || 'UTC',
        status: 'pending',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (error) {
      logger.error('Failed to schedule notification', { error, notificationId });
      throw new DatabaseError('Failed to schedule notification', { error });
    }

    logger.info('Notification scheduled successfully', { notificationId, scheduledAt, timezone });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error scheduling notification', { error, notificationId });
    throw new DatabaseError('Failed to schedule notification', { error });
  }
}

/**
 * Schedule recurring notification
 */
export async function scheduleRecurringNotification(
  notificationId: string,
  cronExpression: string,
  timezone?: string
): Promise<void> {
  // Placeholder for cron-based recurring notifications
  // This would integrate with a cron library like node-cron
  logger.info('Recurring notification scheduling requested', { notificationId, cronExpression, timezone });
}

/**
 * Reschedule notification
 */
export async function rescheduleNotification(
  notificationId: string,
  newScheduledAt: string,
  timezone?: string
): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({
        scheduled_at: newScheduledAt,
        timezone: timezone || 'UTC',
        updated_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId);

    if (error) {
      logger.error('Failed to reschedule notification', { error, notificationId });
      throw new DatabaseError('Failed to reschedule notification', { error });
    }

    logger.info('Notification rescheduled successfully', { notificationId, newScheduledAt });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error rescheduling notification', { error, notificationId });
    throw new DatabaseError('Failed to reschedule notification', { error });
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId);

    if (error) {
      logger.error('Failed to cancel scheduled notification', { error, notificationId });
      throw new DatabaseError('Failed to cancel scheduled notification', { error });
    }

    // Remove from memory
    for (const [jobId, job] of scheduledJobs.entries()) {
      if (job.notificationId === notificationId) {
        scheduledJobs.delete(jobId);
      }
    }

    logger.info('Scheduled notification cancelled', { notificationId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling scheduled notification', { error, notificationId });
    throw new DatabaseError('Failed to cancel scheduled notification', { error });
  }
}

/**
 * Get scheduled notifications due for delivery
 */
export async function getDueScheduledNotifications(): Promise<Array<{ notificationId: string; scheduledAt: string }>> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('notification_id, scheduled_at')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch due scheduled notifications', { error });
      throw new DatabaseError('Failed to fetch due scheduled notifications', { error });
    }

    return (data || []).map(item => ({
      notificationId: item.notification_id,
      scheduledAt: item.scheduled_at,
    }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching due scheduled notifications', { error });
    throw new DatabaseError('Failed to fetch due scheduled notifications', { error });
  }
}

/**
 * Mark scheduled notification as sent
 */
export async function markScheduledNotificationAsSent(notificationId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId);

    if (error) {
      logger.error('Failed to mark scheduled notification as sent', { error, notificationId });
      throw new DatabaseError('Failed to mark scheduled notification as sent', { error });
    }

    // Remove from memory
    for (const [jobId, job] of scheduledJobs.entries()) {
      if (job.notificationId === notificationId) {
        scheduledJobs.delete(jobId);
      }
    }

    logger.info('Scheduled notification marked as sent', { notificationId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking scheduled notification as sent', { error, notificationId });
    throw new DatabaseError('Failed to mark scheduled notification as sent', { error });
  }
}

/**
 * Get scheduled notification by ID
 */
export async function getScheduledNotification(notificationId: string): Promise<{
  notificationId: string;
  scheduledAt: string;
  timezone?: string;
  status: string;
} | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('notification_id', notificationId)
      .single();

    if (error) {
      return null;
    }

    return {
      notificationId: data.notification_id,
      scheduledAt: data.scheduled_at,
      timezone: data.timezone,
      status: data.status,
    };
  } catch (error) {
    logger.error('Unexpected error fetching scheduled notification', { error, notificationId });
    return null;
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Array<{
  notificationId: string;
  scheduledAt: string;
  timezone?: string;
  status: string;
}>> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch all scheduled notifications', { error });
      throw new DatabaseError('Failed to fetch all scheduled notifications', { error });
    }

    return (data || []).map(item => ({
      notificationId: item.notification_id,
      scheduledAt: item.scheduled_at,
      timezone: item.timezone,
      status: item.status,
    }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching all scheduled notifications', { error });
    throw new DatabaseError('Failed to fetch all scheduled notifications', { error });
  }
}

/**
 * Get scheduler statistics
 */
export async function getSchedulerStatistics(): Promise<{
  total: number;
  pending: number;
  sent: number;
  cancelled: number;
  failed: number;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('*');

    if (error) {
      logger.error('Failed to fetch scheduler statistics', { error });
      throw new DatabaseError('Failed to fetch scheduler statistics', { error });
    }

    let pending = 0;
    let sent = 0;
    let cancelled = 0;
    let failed = 0;

    (data || []).forEach((item: any) => {
      switch (item.status) {
        case 'pending':
          pending++;
          break;
        case 'sent':
          sent++;
          break;
        case 'cancelled':
          cancelled++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });

    return {
      total: data?.length || 0,
      pending,
      sent,
      cancelled,
      failed,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching scheduler statistics', { error });
    throw new DatabaseError('Failed to fetch scheduler statistics', { error });
  }
}

/**
 * Convert time to timezone
 */
export function convertTimeToTimezone(time: string, fromTimezone: string, toTimezone: string): string {
  // Placeholder for timezone conversion
  // In production, use a library like date-fns-tz or luxon
  return time;
}

/**
 * Get next occurrence of a recurring schedule
 */
export function getNextOccurrence(cronExpression: string, timezone?: string): string | null {
  // Placeholder for cron parsing
  // In production, use a library like node-cron or cron-parser
  return null;
}

/**
 * Validate cron expression
 */
export function validateCronExpression(cronExpression: string): boolean {
  // Placeholder for cron validation
  // In production, use a library like cron-parser
  return true;
}

/**
 * Clear old scheduled notifications
 */
export async function clearOldScheduledNotifications(olderThanDays: number = 30): Promise<number> {
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .in('status', ['sent', 'cancelled', 'failed'])
      .lt('scheduled_at', cutoffDate)
      .select();

    if (error) {
      logger.error('Failed to clear old scheduled notifications', { error });
      throw new DatabaseError('Failed to clear old scheduled notifications', { error });
    }

    const count = data?.length || 0;
    logger.info('Old scheduled notifications cleared', { count });
    return count;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error clearing old scheduled notifications', { error });
    throw new DatabaseError('Failed to clear old scheduled notifications', { error });
  }
}
