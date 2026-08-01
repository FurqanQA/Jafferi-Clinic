import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateMarkReadPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Mark Unread
// Marks notifications as unread by users
// ============================================================================

/**
 * Mark a single notification as unread
 */
export async function markNotificationAsUnread(notificationId: string): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateMarkReadPermission();

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
      logger.error('Failed to fetch notification for marking as unread', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for marking as unread', { error: fetchError });
    }

    // Only read notifications can be marked as unread
    if (existing.status !== 'read') {
      throw new Error(`Cannot mark notification with status ${existing.status} as unread`);
    }

    const now = new Date().toISOString();

    // Revert to delivered status
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'delivered' as NotificationStatus,
        read_at: null,
        read_by: null,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark notification as unread', { error, notificationId });
      throw new DatabaseError('Failed to mark notification as unread', { error });
    }

    logger.info('Notification marked as unread', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error marking notification as unread', { error, notificationId });
    throw new DatabaseError('Failed to mark notification as unread', { error });
  }
}

/**
 * Mark multiple notifications as unread (bulk)
 */
export async function markBulkNotificationsAsUnread(notificationIds: string[]): Promise<{
  marked: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    marked: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await markNotificationAsUnread(notificationId);
      results.marked.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to mark notification as unread in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification unread marking completed', {
    total: notificationIds.length,
    marked: results.marked.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Mark all user notifications as unread
 */
export async function markAllUserNotificationsAsUnread(userId?: string): Promise<number> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateMarkReadPermission();

    const now = new Date().toISOString();

    // Get notifications to mark as unread
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, version_number')
      .eq('clinic_id', clinicId)
      .eq('user_id', targetUserId)
      .eq('status', 'read');

    if (fetchError) {
      logger.error('Failed to fetch user notifications for marking as unread', { error: fetchError, userId: targetUserId });
      throw new DatabaseError('Failed to fetch user notifications for marking as unread', { error: fetchError });
    }

    let markedCount = 0;

    for (const notification of notifications || []) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            status: 'delivered' as NotificationStatus,
            read_at: null,
            read_by: null,
            updated_by: user.id,
            updated_at: now,
            version_number: notification.version_number + 1,
          })
          .eq('id', notification.id);

        if (!error) {
          markedCount++;
        }
      } catch (error) {
        logger.error('Failed to mark user notification as unread', { error, notificationId: notification.id });
      }
    }

    logger.info('All user notifications marked as unread', { userId: targetUserId, count: markedCount });
    return markedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking all user notifications as unread', { error, userId: targetUserId });
    throw new DatabaseError('Failed to mark all user notifications as unread', { error });
  }
}

/**
 * Mark notifications by module as unread
 */
export async function markModuleNotificationsAsUnread(
  module: string,
  userId?: string
): Promise<number> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateMarkReadPermission();

    const now = new Date().toISOString();

    // Get notifications by module
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, version_number')
      .eq('clinic_id', clinicId)
      .eq('user_id', targetUserId)
      .eq('module', module)
      .eq('status', 'read');

    if (fetchError) {
      logger.error('Failed to fetch module notifications for marking as unread', { error: fetchError, module });
      throw new DatabaseError('Failed to fetch module notifications for marking as unread', { error: fetchError });
    }

    let markedCount = 0;

    for (const notification of notifications || []) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            status: 'delivered' as NotificationStatus,
            read_at: null,
            read_by: null,
            updated_by: user.id,
            updated_at: now,
            version_number: notification.version_number + 1,
          })
          .eq('id', notification.id);

        if (!error) {
          markedCount++;
        }
      } catch (error) {
        logger.error('Failed to mark module notification as unread', { error, notificationId: notification.id });
      }
    }

    logger.info('Module notifications marked as unread', { module, userId: targetUserId, count: markedCount });
    return markedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking module notifications as unread', { error, module });
    throw new DatabaseError('Failed to mark module notifications as unread', { error });
  }
}
