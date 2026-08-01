import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Resend Notification
// Resends notifications that were previously sent or failed
// ============================================================================

/**
 * Resend a notification
 */
export async function resendNotification(notificationId: string): Promise<Notification> {
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
      logger.error('Failed to fetch notification for resending', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for resending', { error: fetchError });
    }

    // Only sent, delivered, read, or failed notifications can be resent
    const resolvableStatuses: NotificationStatus[] = ['sent', 'delivered', 'read', 'failed'];
    if (!resolvableStatuses.includes(existing.status)) {
      throw new Error(`Cannot resend notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    // Reset for resend
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'queued' as NotificationStatus,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: null,
        failure_reason: null,
        retry_count: 0,
        next_retry_at: null,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to reset notification for resend', { error, notificationId });
      throw new DatabaseError('Failed to reset notification for resend', { error });
    }

    logger.info('Notification queued for resend', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resending notification', { error, notificationId });
    throw new DatabaseError('Failed to resend notification', { error });
  }
}

/**
 * Resend notification to specific channels
 */
export async function resendNotificationToChannels(
  notificationId: string,
  channels: string[]
): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Update notification channels
    const { data, error: updateError } = await supabase
      .from('notifications')
      .update({ channels })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update notification channels for resend', { error: updateError, notificationId });
      throw new DatabaseError('Failed to update notification channels for resend', { error: updateError });
    }

    // Resend the notification
    return await resendNotification(notificationId);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resending notification to channels', { error, notificationId });
    throw new DatabaseError('Failed to resend notification to channels', { error });
  }
}

/**
 * Resend multiple notifications (bulk)
 */
export async function resendBulkNotifications(notificationIds: string[]): Promise<{
  queued: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    queued: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await resendNotification(notificationId);
      results.queued.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to resend notification in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification resend completed', {
    total: notificationIds.length,
    queued: results.queued.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Resend failed notifications automatically
 */
export async function autoResendFailedNotifications(): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get failed notifications that haven't exceeded retry limit
    const { data: failedNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .order('failed_at', { ascending: true });

    if (fetchError) {
      logger.error('Failed to fetch failed notifications for auto-resend', { error: fetchError });
      throw new DatabaseError('Failed to fetch failed notifications for auto-resend', { error: fetchError });
    }

    let resentCount = 0;

    for (const notification of failedNotifications || []) {
      try {
        await resendNotification(notification.id);
        resentCount++;
      } catch (error) {
        logger.error('Failed to auto-resend notification', { error, notificationId: notification.id });
      }
    }

    logger.info('Auto-resend of failed notifications completed', { resentCount });
    return resentCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error auto-resending failed notifications', { error });
    throw new DatabaseError('Failed to auto-resend failed notifications', { error });
  }
}

/**
 * Resend notification to different recipient
 */
export async function resendNotificationToRecipient(
  notificationId: string,
  newUserId: string
): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Check if original notification exists
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

    const now = new Date().toISOString();

    // Create a new notification for the new recipient
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        clinic_id: clinicId,
        notification_number: existing.notification_number,
        user_id: newUserId,
        role: existing.role,
        module: existing.module,
        entity_id: existing.entity_id,
        source: existing.source,
        type: existing.type,
        priority: existing.priority,
        status: 'queued' as NotificationStatus,
        channels: existing.channels,
        subject: existing.subject,
        body: existing.body,
        html_body: existing.html_body,
        data: existing.data,
        template_id: existing.template_id,
        scheduled_at: null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: null,
        failure_reason: null,
        retry_count: 0,
        max_retries: existing.max_retries,
        next_retry_at: null,
        created_by: user.id,
        updated_by: null,
        sent_by: null,
        cancelled_by: null,
        read_by: null,
        created_at: now,
        updated_at: now,
        version_number: 1,
        is_active: true,
        deleted_at: null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create notification for new recipient', { error });
      throw new DatabaseError('Failed to create notification for new recipient', { error });
    }

    logger.info('Notification resent to new recipient', { originalId: notificationId, newId: data.id, newUserId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resending notification to new recipient', { error, notificationId });
    throw new DatabaseError('Failed to resend notification to new recipient', { error });
  }
}
