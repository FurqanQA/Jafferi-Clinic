import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { validateScheduledTime } from './notification-validation';
import { Notification, NotificationStatus } from './notification-types';

// ============================================================================
// Schedule Notification
// Schedules notifications for future delivery
// ============================================================================

/**
 * Schedule a notification for future delivery
 */
export async function scheduleNotification(
  notificationId: string,
  scheduledAt: string
): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();
    validateScheduledTime(scheduledAt);

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
      logger.error('Failed to fetch notification for scheduling', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for scheduling', { error: fetchError });
    }

    // Only draft or queued notifications can be scheduled
    if (existing.status !== 'draft' && existing.status !== 'queued') {
      throw new Error(`Cannot schedule notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'scheduled' as NotificationStatus,
        scheduled_at: scheduledAt,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to schedule notification', { error, notificationId });
      throw new DatabaseError('Failed to schedule notification', { error });
    }

    logger.info('Notification scheduled', { notificationId, scheduledAt });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error scheduling notification', { error, notificationId });
    throw new DatabaseError('Failed to schedule notification', { error });
  }
}

/**
 * Reschedule a notification
 */
export async function rescheduleNotification(
  notificationId: string,
  newScheduledAt: string
): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();
    validateScheduledTime(newScheduledAt);

    // Check if notification exists and is scheduled
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
      logger.error('Failed to fetch notification for rescheduling', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for rescheduling', { error: fetchError });
    }

    if (existing.status !== 'scheduled') {
      throw new Error(`Cannot reschedule notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        scheduled_at: newScheduledAt,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to reschedule notification', { error, notificationId });
      throw new DatabaseError('Failed to reschedule notification', { error });
    }

    logger.info('Notification rescheduled', { notificationId, newScheduledAt });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rescheduling notification', { error, notificationId });
    throw new DatabaseError('Failed to reschedule notification', { error });
  }
}

/**
 * Unschedule a notification (return to draft)
 */
export async function unscheduleNotification(notificationId: string): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Check if notification exists and is scheduled
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
      logger.error('Failed to fetch notification for unscheduling', { error: fetchError, notificationId });
      throw new DatabaseError('Failed to fetch notification for unscheduling', { error: fetchError });
    }

    if (existing.status !== 'scheduled') {
      throw new Error(`Cannot unschedule notification with status: ${existing.status}`);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'draft' as NotificationStatus,
        scheduled_at: null,
        updated_by: user.id,
        updated_at: now,
        version_number: existing.version_number + 1,
      })
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to unschedule notification', { error, notificationId });
      throw new DatabaseError('Failed to unschedule notification', { error });
    }

    logger.info('Notification unscheduled', { notificationId });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error unscheduling notification', { error, notificationId });
    throw new DatabaseError('Failed to unschedule notification', { error });
  }
}

/**
 * Get scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch scheduled notifications', { error });
      throw new DatabaseError('Failed to fetch scheduled notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching scheduled notifications', { error });
    throw new DatabaseError('Failed to fetch scheduled notifications', { error });
  }
}

/**
 * Get notifications due for sending
 */
export async function getDueNotifications(): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch due notifications', { error });
      throw new DatabaseError('Failed to fetch due notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching due notifications', { error });
    throw new DatabaseError('Failed to fetch due notifications', { error });
  }
}

/**
 * Get scheduled notifications for a user
 */
export async function getUserScheduledNotifications(userId: string): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch user scheduled notifications', { error, userId });
      throw new DatabaseError('Failed to fetch user scheduled notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching user scheduled notifications', { error, userId });
    throw new DatabaseError('Failed to fetch user scheduled notifications', { error });
  }
}
