import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { validateUpdateNotificationInput } from './notification-validation';
import { Notification, NotificationChannel, NotificationType, NotificationPriority, NotificationStatus } from './notification-types';

// ============================================================================
// Update Notification
// Updates existing notifications with validation and permission checks
// ============================================================================

/**
 * Update a single notification
 */
export async function updateNotification(
  notificationId: string,
  updates: {
    subject?: string;
    body?: string;
    html_body?: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    data?: Record<string, any>;
    scheduled_at?: string;
  }
): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();
    validateUpdateNotificationInput(updates);

    // Check if notification exists and is in a state that allows updates
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
      logger.error('Failed to fetch notification for update', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for update', { error: fetchError });
    }

    // Only draft, queued, or scheduled notifications can be updated
    const updatableStatuses: NotificationStatus[] = ['draft', 'queued', 'scheduled'];
    if (!updatableStatuses.includes(existing.status)) {
      throw new Error(`Cannot update notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update notification', { error, notificationId });
      throw new DatabaseError('Failed to update notification', { error });
    }

    logger.info('Notification updated', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating notification', { error, notificationId });
    throw new DatabaseError('Failed to update notification', { error });
  }
}

/**
 * Update multiple notifications (bulk)
 */
export async function updateBulkNotifications(
  notificationIds: string[],
  updates: {
    subject?: string;
    body?: string;
    html_body?: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    data?: Record<string, any>;
  }
): Promise<Notification[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();
    validateUpdateNotificationInput(updates);

    const now = new Date().toISOString();

    // Fetch existing notifications to check status and version
    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .in('id', notificationIds);

    if (fetchError) {
      logger.error('Failed to fetch notifications for bulk update', { error: fetchError });
      throw new DatabaseError('Failed to fetch notifications for bulk update', { error: fetchError });
    }

    // Filter to only updatable notifications
    const updatableStatuses: NotificationStatus[] = ['draft', 'queued', 'scheduled'];
    const updatableIds = existing
      .filter((n: any) => updatableStatuses.includes(n.status))
      .map((n: any) => n.id);

    if (updatableIds.length === 0) {
      logger.info('No updatable notifications found for bulk update');
      return [];
    }

    // Update each notification individually to increment version numbers correctly
    const results: Notification[] = [];

    for (const notification of existing.filter((n: any) => updatableIds.includes(n.id))) {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: now,
          version_number: notification.version_number + 1,
        })
        .eq('id', notification.id)
        .select()
        .single();

      if (!error && data) {
        results.push(data as Notification);
      }
    }

    logger.info('Bulk notifications updated', { count: results.length });
    return results;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating bulk notifications', { error });
    throw new DatabaseError('Failed to update bulk notifications', { error });
  }
}

/**
 * Add channels to notification
 */
export async function addNotificationChannels(
  notificationId: string,
  channels: NotificationChannel[]
): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

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

    const currentChannels = existing.channels || [];
    const newChannels = [...new Set([...currentChannels, ...channels])];

    return await updateNotification(notificationId, { channels: newChannels });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding notification channels', { error, notificationId });
    throw new DatabaseError('Failed to add notification channels', { error });
  }
}

/**
 * Remove channels from notification
 */
export async function removeNotificationChannels(
  notificationId: string,
  channels: NotificationChannel[]
): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

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

    const currentChannels = existing.channels || [];
    const newChannels = currentChannels.filter((c: NotificationChannel) => !channels.includes(c));

    return await updateNotification(notificationId, { channels: newChannels });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error removing notification channels', { error, notificationId });
    throw new DatabaseError('Failed to remove notification channels', { error });
  }
}

/**
 * Update notification priority
 */
export async function updateNotificationPriority(
  notificationId: string,
  priority: NotificationPriority
): Promise<Notification> {
  return await updateNotification(notificationId, { priority });
}

/**
 * Update notification type
 */
export async function updateNotificationType(
  notificationId: string,
  type: NotificationType
): Promise<Notification> {
  return await updateNotification(notificationId, { type });
}

/**
 * Reschedule notification
 */
export async function rescheduleNotification(
  notificationId: string,
  scheduledAt: string
): Promise<Notification> {
  return await updateNotification(notificationId, { scheduled_at: scheduledAt });
}

/**
 * Add data to notification
 */
export async function addNotificationData(
  notificationId: string,
  data: Record<string, any>
): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('data')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      throw new DatabaseError('Failed to fetch notification', { error: fetchError });
    }

    const existingData = existing.data || {};
    const newData = { ...existingData, ...data };

    return await updateNotification(notificationId, { data: newData });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding notification data', { error, notificationId });
    throw new DatabaseError('Failed to add notification data', { error });
  }
}
