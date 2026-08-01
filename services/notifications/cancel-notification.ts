import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCancelNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Cancel Notification
// Cancels pending or scheduled notifications
// ============================================================================

/**
 * Cancel a single notification
 */
export async function cancelNotification(notificationId: string): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCancelNotificationPermission();

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
      logger.error('Failed to fetch notification for cancellation', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for cancellation', { error: fetchError });
    }

    // Only draft, queued, or scheduled notifications can be cancelled
    const cancellableStatuses: NotificationStatus[] = ['draft', 'queued', 'scheduled', 'sending'];
    if (!cancellableStatuses.includes(existing.status)) {
      throw new Error(`Cannot cancel notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'cancelled' as NotificationStatus,
        cancelled_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel notification', { error, notificationId });
      throw new DatabaseError('Failed to cancel notification', { error });
    }

    logger.info('Notification cancelled', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling notification', { error, notificationId });
    throw new DatabaseError('Failed to cancel notification', { error });
  }
}

/**
 * Cancel multiple notifications (bulk)
 */
export async function cancelBulkNotifications(notificationIds: string[]): Promise<{
  cancelled: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    cancelled: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await cancelNotification(notificationId);
      results.cancelled.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to cancel notification in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification cancellation completed', {
    total: notificationIds.length,
    cancelled: results.cancelled.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Cancel scheduled notifications for a user
 */
export async function cancelUserScheduledNotifications(userId: string): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCancelNotificationPermission();

    // Get scheduled notifications for user
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .eq('status', 'scheduled');

    if (fetchError) {
      logger.error('Failed to fetch user scheduled notifications', { error: fetchError, userId });
      throw new DatabaseError('Failed to fetch user scheduled notifications', { error: fetchError });
    }

    const cancelled: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const cancelledNotif = await cancelNotification(notification.id);
        cancelled.push(cancelledNotif);
      } catch (error) {
        logger.error('Failed to cancel user notification', { error, notificationId: notification.id });
      }
    }

    logger.info('User scheduled notifications cancelled', { userId, count: cancelled.length });
    return cancelled;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling user scheduled notifications', { error, userId });
    throw new DatabaseError('Failed to cancel user scheduled notifications', { error });
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCancelNotificationPermission();

    // Get all scheduled notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'scheduled');

    if (fetchError) {
      logger.error('Failed to fetch scheduled notifications', { error: fetchError });
      throw new DatabaseError('Failed to fetch scheduled notifications', { error: fetchError });
    }

    const cancelled: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const cancelledNotif = await cancelNotification(notification.id);
        cancelled.push(cancelledNotif);
      } catch (error) {
        logger.error('Failed to cancel scheduled notification', { error, notificationId: notification.id });
      }
    }

    logger.info('All scheduled notifications cancelled', { count: cancelled.length });
    return cancelled;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling all scheduled notifications', { error });
    throw new DatabaseError('Failed to cancel all scheduled notifications', { error });
  }
}

/**
 * Cancel notifications by module
 */
export async function cancelNotificationsByModule(
  module: string
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCancelNotificationPermission();

    // Get notifications by module
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .in('status', ['draft', 'queued', 'scheduled']);

    if (fetchError) {
      logger.error('Failed to fetch notifications by module', { error: fetchError, module });
      throw new DatabaseError('Failed to fetch notifications by module', { error: fetchError });
    }

    const cancelled: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const cancelledNotif = await cancelNotification(notification.id);
        cancelled.push(cancelledNotif);
      } catch (error) {
        logger.error('Failed to cancel notification by module', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications cancelled by module', { module, count: cancelled.length });
    return cancelled;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling notifications by module', { error, module });
    throw new DatabaseError('Failed to cancel notifications by module', { error });
  }
}

/**
 * Cancel notifications by entity
 */
export async function cancelNotificationsByEntity(
  entityId: string
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCancelNotificationPermission();

    // Get notifications by entity
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('entity_id', entityId)
      .in('status', ['draft', 'queued', 'scheduled']);

    if (fetchError) {
      logger.error('Failed to fetch notifications by entity', { error: fetchError, entityId });
      throw new DatabaseError('Failed to fetch notifications by entity', { error: fetchError });
    }

    const cancelled: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const cancelledNotif = await cancelNotification(notification.id);
        cancelled.push(cancelledNotif);
      } catch (error) {
        logger.error('Failed to cancel notification by entity', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications cancelled by entity', { entityId, count: cancelled.length });
    return cancelled;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling notifications by entity', { error, entityId });
    throw new DatabaseError('Failed to cancel notifications by entity', { error });
  }
}
