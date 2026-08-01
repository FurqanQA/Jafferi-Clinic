import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Archive Notification
// Archives notifications for long-term storage
// ============================================================================

/**
 * Archive a single notification
 */
export async function archiveNotification(notificationId: string): Promise<Notification> {
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
      logger.error('Failed to fetch notification for archiving', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for archiving', { error: fetchError });
    }

    // Only sent, delivered, read, failed, or cancelled notifications can be archived
    const archivableStatuses: NotificationStatus[] = ['sent', 'delivered', 'read', 'failed', 'cancelled', 'expired'];
    if (!archivableStatuses.includes(existing.status)) {
      throw new Error(`Cannot archive notification with status: ${existing.status}`);
    }

    if (existing.status === 'archived') {
      return existing as Notification;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'archived' as NotificationStatus,
        is_active: false,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to archive notification', { error, notificationId });
      throw new DatabaseError('Failed to archive notification', { error });
    }

    logger.info('Notification archived', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error archiving notification', { error, notificationId });
    throw new DatabaseError('Failed to archive notification', { error });
  }
}

/**
 * Archive multiple notifications (bulk)
 */
export async function archiveBulkNotifications(notificationIds: string[]): Promise<{
  archived: Notification[];
  failed: Array<{ id: string; error: string }>;
}> {
  const results = {
    archived: [] as Notification[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const notificationId of notificationIds) {
    try {
      const notification = await archiveNotification(notificationId);
      results.archived.push(notification);
    } catch (error: any) {
      results.failed.push({
        id: notificationId,
        error: error.message || 'Unknown error',
      });
      logger.error('Failed to archive notification in bulk', { error, notificationId });
    }
  }

  logger.info('Bulk notification archiving completed', {
    total: notificationIds.length,
    archived: results.archived.length,
    failed: results.failed.length,
  });

  return results;
}

/**
 * Archive notifications older than specified days
 */
export async function archiveOldNotifications(daysOld: number = 90): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  try {
    await validateUpdateNotificationPermission();

    // Get notifications to archive
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .in('status', ['sent', 'delivered', 'read', 'failed', 'cancelled', 'expired'])
      .lt('created_at', cutoffDate)
      .eq('is_active', true);

    if (fetchError) {
      logger.error('Failed to fetch old notifications for archiving', { error: fetchError });
      throw new DatabaseError('Failed to fetch old notifications for archiving', { error: fetchError });
    }

    let archivedCount = 0;

    for (const notification of notifications || []) {
      try {
        await archiveNotification(notification.id);
        archivedCount++;
      } catch (error) {
        logger.error('Failed to archive old notification', { error, notificationId: notification.id });
      }
    }

    logger.info('Old notifications archived', { archivedCount, daysOld });
    return archivedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error archiving old notifications', { error });
    throw new DatabaseError('Failed to archive old notifications', { error });
  }
}

/**
 * Archive notifications by module
 */
export async function archiveNotificationsByModule(
  module: string
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Get notifications by module
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .in('status', ['sent', 'delivered', 'read', 'failed', 'cancelled', 'expired'])
      .eq('is_active', true);

    if (fetchError) {
      logger.error('Failed to fetch notifications by module for archiving', { error: fetchError, module });
      throw new DatabaseError('Failed to fetch notifications by module for archiving', { error: fetchError });
    }

    const archived: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const archivedNotif = await archiveNotification(notification.id);
        archived.push(archivedNotif);
      } catch (error) {
        logger.error('Failed to archive notification by module', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications archived by module', { module, count: archived.length });
    return archived;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error archiving notifications by module', { error, module });
    throw new DatabaseError('Failed to archive notifications by module', { error });
  }
}

/**
 * Archive notifications by entity
 */
export async function archiveNotificationsByEntity(
  entityId: string
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Get notifications by entity
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('entity_id', entityId)
      .in('status', ['sent', 'delivered', 'read', 'failed', 'cancelled', 'expired'])
      .eq('is_active', true);

    if (fetchError) {
      logger.error('Failed to fetch notifications by entity for archiving', { error: fetchError, entityId });
      throw new DatabaseError('Failed to fetch notifications by entity for archiving', { error: fetchError });
    }

    const archived: Notification[] = [];

    for (const notification of notifications || []) {
      try {
        const archivedNotif = await archiveNotification(notification.id);
        archived.push(archivedNotif);
      } catch (error) {
        logger.error('Failed to archive notification by entity', { error, notificationId: notification.id });
      }
    }

    logger.info('Notifications archived by entity', { entityId, count: archived.length });
    return archived;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error archiving notifications by entity', { error, entityId });
    throw new DatabaseError('Failed to archive notifications by entity', { error });
  }
}

/**
 * Get archived notifications
 */
export async function getArchivedNotifications(limit: number = 50): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch archived notifications', { error });
      throw new DatabaseError('Failed to fetch archived notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching archived notifications', { error });
    throw new DatabaseError('Failed to fetch archived notifications', { error });
  }
}

/**
 * Get archived notifications for a user
 */
export async function getUserArchivedNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .eq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch user archived notifications', { error, userId });
      throw new DatabaseError('Failed to fetch user archived notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching user archived notifications', { error, userId });
    throw new DatabaseError('Failed to fetch user archived notifications', { error });
  }
}
