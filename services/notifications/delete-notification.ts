import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateDeleteNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Delete Notification
// Permanently deletes notifications (soft delete with deleted_at timestamp)
// ============================================================================

/**
 * Delete a single notification (soft delete)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateDeleteNotificationPermission();

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
      logger.error('Failed to fetch notification for deletion', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for deletion', { error: fetchError });
    }

    // Check if already deleted
    if (existing.deleted_at) {
      logger.info('Notification already deleted', { notificationId });
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'deleted' as NotificationStatus,
        deleted_at: now,
        is_active: false,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete notification', { error, notificationId });
      throw new DatabaseError('Failed to delete notification', { error });
    }

    logger.info('Notification deleted', { notificationId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting notification', { error, notificationId });
    throw new DatabaseError('Failed to delete notification', { error });
  }
}

/**
 * Delete multiple notifications (bulk)
 */
export async function deleteBulkNotifications(notificationIds: string[]): Promise<{
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    deleted: [] as string[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      await deleteNotification(notificationId);
      results.deleted.push(notificationId);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to delete notification in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification deletion completed', {
    total: notificationIds.length,
    deleted: results.deleted.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Permanently delete notification (hard delete - use with caution)
 */
export async function permanentlyDeleteNotification(notificationId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateDeleteNotificationPermission();

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
      throw new DatabaseError('Failed to fetch notification', { error: fetchError });
    }

    // Only allow hard delete of already soft-deleted notifications
    if (!existing.deleted_at) {
      throw new Error('Cannot permanently delete active notification. Use soft delete first.');
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to permanently delete notification', { error, notificationId });
      throw new DatabaseError('Failed to permanently delete notification', { error });
    }

    logger.info('Notification permanently deleted', { notificationId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error permanently deleting notification', { error, notificationId });
    throw new DatabaseError('Failed to permanently delete notification', { error });
  }
}

/**
 * Delete notifications older than specified days
 */
export async function deleteOldNotifications(daysOld: number = 180): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  try {
    await validateDeleteNotificationPermission();

    // Get notifications to delete
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('clinic_id', clinicId)
      .lt('created_at', cutoffDate)
      .is('deleted_at', null);

    if (fetchError) {
      logger.error('Failed to fetch old notifications for deletion', { error: fetchError });
      throw new DatabaseError('Failed to fetch old notifications for deletion', { error: fetchError });
    }

    let deletedCount = 0;

    for (const notification of notifications || []) {
      try {
        await deleteNotification(notification.id);
        deletedCount++;
      } catch (error) {
        logger.error('Failed to delete old notification', { error, notificationId: notification.id });
      }
    }

    logger.info('Old notifications deleted', { deletedCount, daysOld });
    return deletedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting old notifications', { error });
    throw new DatabaseError('Failed to delete old notifications', { error });
  }
}

/**
 * Delete notifications by module
 */
export async function deleteNotificationsByModule(
  module: string
): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateDeleteNotificationPermission();

    // Get notifications by module
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .is('deleted_at', null);

    if (fetchError) {
      logger.error('Failed to fetch notifications by module for deletion', { error: fetchError, module });
      throw new DatabaseError('Failed to fetch notifications by module for deletion', { error: fetchError });
    }

    let deletedCount = 0;

    for (const notification of notifications || []) {
      try {
        await deleteNotification(notification.id);
        deletedCount++;
      } catch (error) {
        logger.error('Failed to delete notification by module', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications deleted by module', { module, count: deletedCount });
    return deletedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting notifications by module', { error, module });
    throw new DatabaseError('Failed to delete notifications by module', { error });
  }
}

/**
 * Delete notifications by entity
 */
export async function deleteNotificationsByEntity(
  entityId: string
): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateDeleteNotificationPermission();

    // Get notifications by entity
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('entity_id', entityId)
      .is('deleted_at', null);

    if (fetchError) {
      logger.error('Failed to fetch notifications by entity for deletion', { error: fetchError, entityId });
      throw new DatabaseError('Failed to fetch notifications by entity for deletion', { error: fetchError });
    }

    let deletedCount = 0;

    for (const notification of notifications || []) {
      try {
        await deleteNotification(notification.id);
        deletedCount++;
      } catch (error) {
        logger.error('Failed to delete notification by entity', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications deleted by entity', { entityId, count: deletedCount });
    return deletedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting notifications by entity', { error, entityId });
    throw new DatabaseError('Failed to delete notifications by entity', { error });
  }
}

/**
 * Get deleted notifications
 */
export async function getDeletedNotifications(limit: number = 50): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch deleted notifications', { error });
      throw new DatabaseError('Failed to fetch deleted notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching deleted notifications', { error });
    throw new DatabaseError('Failed to fetch deleted notifications', { error });
  }
}

/**
 * Restore deleted notification
 */
export async function restoreDeletedNotification(notificationId: string): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateDeleteNotificationPermission();

    // Check if notification exists and is deleted
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

    if (!existing.deleted_at) {
      throw new Error('Notification is not deleted');
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'draft' as NotificationStatus,
        deleted_at: null,
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
      logger.error('Failed to restore deleted notification', { error, notificationId });
      throw new DatabaseError('Failed to restore deleted notification', { error });
    }

    logger.info('Deleted notification restored', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring deleted notification', { error, notificationId });
    throw new DatabaseError('Failed to restore deleted notification', { error });
  }
}
