import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Send Notification
// Sends notifications through their configured channels
// ============================================================================

/**
 * Send a single notification
 */
export async function sendNotification(notificationId: string): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Check if notification exists
    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      logger.error('Failed to fetch notification for sending', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for sending', { error: fetchError });
    }

    // Only draft, queued, or scheduled notifications can be sent
    const sendableStatuses: NotificationStatus[] = ['draft', 'queued', 'scheduled'];
    if (!sendableStatuses.includes(existing.status)) {
      throw new Error(`Cannot send notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    // Update notification status to sending
    const { data: sendingData, error: sendingError } = await supabase
      .from('notifications')
      .update({
        status: 'sending' as NotificationStatus,
        sent_by: user.id,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (sendingError) {
      logger.error('Failed to update notification status to sending', { error: sendingError, notificationId });
      throw new DatabaseError('Failed to update notification status to sending', { error: sendingError });
    }

    // Placeholder for actual sending logic
    // In production, this would:
    // 1. Check user preferences for each channel
    // 2. Check quiet hours
    // 3. Send through each configured channel provider
    // 4. Track delivery status
    logger.info('Notification sending initiated', { notificationId, channels: existing.channels });

    // Simulate sending (placeholder)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update to sent status
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'sent' as NotificationStatus,
        sent_at: now,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update notification status to sent', { error, notificationId });
      throw new DatabaseError('Failed to update notification status to sent', { error });
    }

    logger.info('Notification sent successfully', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error sending notification', { error, notificationId });
    throw new DatabaseError('Failed to send notification', { error });
  }
}

/**
 * Send multiple notifications (bulk)
 */
export async function sendBulkNotifications(notificationIds: string[]): Promise<{
  sent: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    sent: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await sendNotification(notificationId);
      results.sent.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to send notification in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification send completed', {
    total: notificationIds.length,
    sent: results.sent.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Send notification immediately (bypass queue)
 */
export async function sendNotificationImmediately(notificationId: string): Promise<Notification> {
  // Placeholder for immediate sending
  // In production, this would bypass the queue and send directly
  return await sendNotification(notificationId);
}

/**
 * Send notification to specific channels only
 */
export async function sendNotificationToChannels(
  notificationId: string,
  channels: string[]
): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Update notification channels
    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('channels')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      throw new DatabaseError('Failed to fetch notification', { error: fetchError });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ channels })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update notification channels', { error, notificationId });
      throw new DatabaseError('Failed to update notification channels', { error });
    }

    // Send the notification
    return await sendNotification(notificationId);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error sending notification to channels', { error, notificationId });
    throw new DatabaseError('Failed to send notification to channels', { error });
  }
}

/**
 * Retry failed notification
 */
export async function retryFailedNotification(notificationId: string): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Check if notification exists and is failed
    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      throw new DatabaseError('Failed to fetch notification', { error: fetchError });
    }

    if (existing.status !== 'failed') {
      throw new Error(`Cannot retry notification with status: ${existing.status}`);
    }

    if (existing.retry_count >= existing.max_retries) {
      throw new Error('Maximum retry limit reached');
    }

    const now = new Date().toISOString();

    // Reset for retry
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'queued' as NotificationStatus,
        retry_count: existing.retry_count + 1,
        failure_reason: null,
        failed_at: null,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to reset notification for retry', { error, notificationId });
      throw new DatabaseError('Failed to reset notification for retry', { error });
    }

    logger.info('Notification queued for retry', { notificationId, retryCount: existing.retry_count + 1 });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error retrying notification', { error, notificationId });
    throw new DatabaseError('Failed to retry notification', { error });
  }
}

/**
 * Mark notification as delivered
 */
export async function markNotificationAsDelivered(notificationId: string): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'delivered' as NotificationStatus,
        delivered_at: now,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark notification as delivered', { error, notificationId });
      throw new DatabaseError('Failed to mark notification as delivered', { error });
    }

    logger.info('Notification marked as delivered', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking notification as delivered', { error, notificationId });
    throw new DatabaseError('Failed to mark notification as delivered', { error });
  }
}

/**
 * Mark notification as failed
 */
export async function markNotificationAsFailed(
  notificationId: string,
  failureReason: string
): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'failed' as NotificationStatus,
        failed_at: now,
        failure_reason: failureReason,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark notification as failed', { error, notificationId });
      throw new DatabaseError('Failed to mark notification as failed', { error });
    }

    logger.info('Notification marked as failed', { notificationId, failureReason });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking notification as failed', { error, notificationId });
    throw new DatabaseError('Failed to mark notification as failed', { error });
  }
}
