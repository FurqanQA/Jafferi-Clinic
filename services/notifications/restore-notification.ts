import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Restore Notification
// Restores archived notifications back to active state
// ============================================================================

/**
 * Restore a single archived notification
 */
export async function restoreNotification(notificationId: string): Promise<Notification> {
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
      logger.error('Failed to fetch notification for restoration', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for restoration', { error: fetchError });
    }

    // Only archived notifications can be restored
    if (existing.status !== 'archived') {
      throw new Error(`Cannot restore notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    // Restore to previous status (default to sent if not available)
    const previousStatus = existing.sent_at ? 'sent' as NotificationStatus : 'draft' as NotificationStatus;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: previousStatus,
        is_active: true,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to restore notification', { error, notificationId });
      throw new DatabaseError('Failed to restore notification', { error });
    }

    logger.info('Notification restored', { notificationId, previousStatus });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring notification', { error, notificationId });
    throw new DatabaseError('Failed to restore notification', { error });
  }
}

/**
 * Restore multiple archived notifications (bulk)
 */
export async function restoreBulkNotifications(notificationIds: string[]): Promise<{
  restored: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    restored: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await restoreNotification(notificationId);
      results.restored.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to restore notification in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification restoration completed', {
    total: notificationIds.length,
    restored: results.restored.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Restore archived notifications by module
 */
export async function restoreNotificationsByModule(
  module: string
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Get archived notifications by module
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .eq('status', 'archived');

    if (fetchError) {
      logger.error('Failed to fetch archived notifications by module', { error: fetchError, module });
      throw new DatabaseError('Failed to fetch archived notifications by module', { error: fetchError });
    }

    const restored: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const restoredNotif = await restoreNotification(notification.id);
        restored.push(restoredNotif);
      } catch (error) {
        logger.error('Failed to restore notification by module', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications restored by module', { module, count: restored.length });
    return restored;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error restoring notifications by module', { error, module });
    throw new DatabaseError('Failed to restore notifications by module', { error });
  }
}

/**
 * Restore archived notifications by entity
 */
export async function restoreNotificationsByEntity(
  entityId: string
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Get archived notifications by entity
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('entity_id', entityId)
      .eq('status', 'archived');

    if (fetchError) {
      logger.error('Failed to fetch archived notifications by entity', { error: fetchError, entityId });
      throw new DatabaseError('Failed to fetch archived notifications by entity', { error: fetchError });
    }

    const restored: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const restoredNotif = await restoreNotification(notification.id);
        restored.push(restoredNotif);
      } catch (error) {
        logger.error('Failed to restore notification by entity', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications restored by entity', { entityId, count: restored.length });
    return restored;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error restoring notifications by entity', { error, entityId });
    throw new DatabaseError('Failed to restore notifications by entity', { error });
  }
}

/**
 * Restore all archived notifications
 */
export async function restoreAllArchivedNotifications(): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Get all archived notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'archived');

    if (fetchError) {
      logger.error('Failed to fetch archived notifications', { error: fetchError });
      throw new DatabaseError('Failed to fetch archived notifications', { error: fetchError });
    }

    const restored: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const restoredNotif = await restoreNotification(notification.id);
        restored.push(restoredNotif);
      } catch (error) {
        logger.error('Failed to restore archived notification', { error, notificationId: notification.id });
      }
    }

    logger.info('All archived notifications restored', { count: restored.length });
    return restored;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error restoring all archived notifications', { error });
    throw new DatabaseError('Failed to restore all archived notifications', { error });
  }
}
