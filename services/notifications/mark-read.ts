import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateMarkReadPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Mark Read
// Marks notifications as read by users
// ============================================================================

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
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
      logger.error('Failed to fetch notification for marking as read', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for marking as read', { error: fetchError });
    }

    // Only delivered or sent notifications can be marked as read
    const readableStatuses: NotificationStatus[] = ['sent', 'delivered'];
    if (!readableStatuses.includes(existing.status)) {
      throw new Error(`Cannot mark notification with status ${existing.status} as read`);
    }

    if (existing.status === 'read') {
      return existing as Notification;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'read' as NotificationStatus,
        read_at: now,
        read_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
      throw new DatabaseError('Failed to mark notification as read', { error });
    }

    logger.info('Notification marked as read', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error marking notification as read', { error, notificationId });
    throw new DatabaseError('Failed to mark notification as read', { error });
  }
}

/**
 * Mark multiple notifications as read (bulk)
 */
export async function markBulkNotificationsAsRead(notificationIds: string[]): Promise<{
  marked: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    marked: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await markNotificationAsRead(notificationId);
      results.marked.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to mark notification as read in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification read marking completed', {
    total: notificationIds.length,
    marked: results.marked.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Mark all user notifications as read
 */
export async function markAllUserNotificationsAsRead(userId?: string): Promise<number> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateMarkReadPermission();

    const now = new Date().toISOString();

    // Get notifications to mark as read
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, version_number')
      .eq('clinic_id', clinicId)
      .eq('user_id', targetUserId)
      .in('status', ['sent', 'delivered']);

    if (fetchError) {
      logger.error('Failed to fetch user notifications for marking as read', { error: fetchError, userId: targetUserId });
      throw new DatabaseError('Failed to fetch user notifications for marking as read', { error: fetchError });
    }

    let markedCount = 0;

    for (const notification of notifications || []) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            status: 'read' as NotificationStatus,
            read_at: now,
            read_by: user.id,
            updated_at: now,
            version_number: notification.version_number + 1,
          })
          .eq('id', notification.id);

        if (!error) {
          markedCount++;
        }
      } catch (error) {
        logger.error('Failed to mark user notification as read', { error, notificationId: notification.id });
      }
    }

    logger.info('All user notifications marked as read', { userId: targetUserId, count: markedCount });
    return markedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking all user notifications as read', { error, userId: targetUserId });
    throw new DatabaseError('Failed to mark all user notifications as read', { error });
  }
}

/**
 * Mark notifications by module as read
 */
export async function markModuleNotificationsAsRead(
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
      .in('status', ['sent', 'delivered']);

    if (fetchError) {
      logger.error('Failed to fetch module notifications for marking as read', { error: fetchError, module });
      throw new DatabaseError('Failed to fetch module notifications for marking as read', { error: fetchError });
    }

    let markedCount = 0;

    for (const notification of notifications || []) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            status: 'read' as NotificationStatus,
            read_at: now,
            read_by: user.id,
            updated_at: now,
            version_number: notification.version_number + 1,
          })
          .eq('id', notification.id);

        if (!error) {
          markedCount++;
        }
      } catch (error) {
        logger.error('Failed to mark module notification as read', { error, notificationId: notification.id });
      }
    }

    logger.info('Module notifications marked as read', { module, userId: targetUserId, count: markedCount });
    return markedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking module notifications as read', { error, module });
    throw new DatabaseError('Failed to mark module notifications as read', { error });
  }
}

/**
 * Get unread notification count for user
 */
export async function getUnreadNotificationCount(userId?: string): Promise<number> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('user_id', targetUserId)
      .in('status', ['sent', 'delivered']);

    if (error) {
      logger.error('Failed to fetch unread notification count', { error, userId: targetUserId });
      throw new DatabaseError('Failed to fetch unread notification count', { error });
    }

    return count || 0;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching unread notification count', { error, userId: targetUserId });
    throw new DatabaseError('Failed to fetch unread notification count', { error });
  }
}

/**
 * Get unread notifications for user
 */
export async function getUnreadNotifications(userId?: string, limit: number = 50): Promise<Notification[]> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', targetUserId)
      .in('status', ['sent', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch unread notifications', { error, userId: targetUserId });
      throw new DatabaseError('Failed to fetch unread notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching unread notifications', { error, userId: targetUserId });
    throw new DatabaseError('Failed to fetch unread notifications', { error });
  }
}
