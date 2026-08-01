import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadNotificationPermission } from './notification-permissions';
import { Notification } from './notification-types';

// ============================================================================
// Get Notification
// Retrieves individual notifications with permission checks
// ============================================================================

/**
 * Get a single notification by ID
 */
export async function getNotification(notificationId: string): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      logger.error('Failed to fetch notification', { error, notificationId });
      throw new DatabaseError('Failed to fetch notification', { error });
    }

    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification', { error, notificationId });
    throw new DatabaseError('Failed to fetch notification', { error });
  }
}

/**
 * Get notification by notification number
 */
export async function getNotificationByNumber(notificationNumber: string): Promise<Notification> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('notification_number', notificationNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      logger.error('Failed to fetch notification by number', { error, notificationNumber });
      throw new DatabaseError('Failed to fetch notification by number', { error });
    }

    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification by number', { error, notificationNumber });
    throw new DatabaseError('Failed to fetch notification by number', { error });
  }
}

/**
 * Get notification with delivery details
 */
export async function getNotificationWithDeliveries(notificationId: string): Promise<{
  notification: Notification;
  deliveries: any[];
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    // Get notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (notifError) {
      if (notifError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      throw new DatabaseError('Failed to fetch notification', { error: notifError });
    }

    // Get deliveries
    const { data: deliveries, error: deliveryError } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('clinic_id', clinicId);

    if (deliveryError) {
      logger.error('Failed to fetch notification deliveries', { error: deliveryError, notificationId });
      throw new DatabaseError('Failed to fetch notification deliveries', { error: deliveryError });
    }

    return {
      notification: notification as Notification,
      deliveries: deliveries || [],
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification with deliveries', { error, notificationId });
    throw new DatabaseError('Failed to fetch notification with deliveries', { error });
  }
}

/**
 * Get notification with attachments
 */
export async function getNotificationWithAttachments(notificationId: string): Promise<{
  notification: Notification;
  attachments: any[];
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    // Get notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (notifError) {
      if (notifError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      throw new DatabaseError('Failed to fetch notification', { error: notifError });
    }

    // Get attachments
    const { data: attachments, error: attachmentError } = await supabase
      .from('notification_attachments')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('clinic_id', clinicId);

    if (attachmentError) {
      logger.error('Failed to fetch notification attachments', { error: attachmentError, notificationId });
      throw new DatabaseError('Failed to fetch notification attachments', { error: attachmentError });
    }

    return {
      notification: notification as Notification,
      attachments: attachments || [],
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification with attachments', { error, notificationId });
    throw new DatabaseError('Failed to fetch notification with attachments', { error });
  }
}

/**
 * Get notification with full details (deliveries + attachments)
 */
export async function getNotificationFullDetails(notificationId: string): Promise<{
  notification: Notification;
  deliveries: any[];
  attachments: any[];
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    // Get notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (notifError) {
      if (notifError.code === 'PGRST116') {
        throw new NotFoundError('Notification not found');
      }
      throw new DatabaseError('Failed to fetch notification', { error: notifError });
    }

    // Get deliveries and attachments in parallel
    const [deliveriesResult, attachmentsResult] = await Promise.all([
      supabase
        .from('notification_deliveries')
        .select('*')
        .eq('notification_id', notificationId)
        .eq('clinic_id', clinicId),
      supabase
        .from('notification_attachments')
        .select('*')
        .eq('notification_id', notificationId)
        .eq('clinic_id', clinicId),
    ]);

    if (deliveriesResult.error) {
      logger.error('Failed to fetch notification deliveries', { error: deliveriesResult.error, notificationId });
      throw new DatabaseError('Failed to fetch notification deliveries', { error: deliveriesResult.error });
    }

    if (attachmentsResult.error) {
      logger.error('Failed to fetch notification attachments', { error: attachmentsResult.error, notificationId });
      throw new DatabaseError('Failed to fetch notification attachments', { error: attachmentsResult.error });
    }

    return {
      notification: notification as Notification,
      deliveries: deliveriesResult.data || [],
      attachments: attachmentsResult.data || [],
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification full details', { error, notificationId });
    throw new DatabaseError('Failed to fetch notification full details', { error });
  }
}
