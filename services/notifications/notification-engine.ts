import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCreateNotificationPermission, validateSendNotificationPermission, validateChannelPermission } from './notification-permissions';
import { validateCreateNotificationInput, validateNotificationChannels, validateScheduledTime } from './notification-validation';
import { Notification, CreateNotificationInput, NotificationStatus, NotificationChannel, NotificationPriority } from './notification-types';

// Placeholder imports - these will be implemented in subsequent files
// import { renderTemplate } from './template-engine';
// import { queueNotification } from './queue-manager';
// import { scheduleNotification as scheduleNotificationService } from './scheduler';
// import { sendNotification as sendNotificationService } from './send-notification';
// import { trackDelivery } from './delivery-tracker';

// Placeholder functions - these will be replaced by actual implementations
function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

async function queueNotification(notificationId: string, priority: NotificationPriority): Promise<void> {
  // Placeholder for queue manager
  logger.info('Queue notification placeholder', { notificationId, priority });
}

async function scheduleNotificationService(notificationId: string, scheduledAt: string): Promise<void> {
  // Placeholder for scheduler
  logger.info('Schedule notification placeholder', { notificationId, scheduledAt });
}

async function sendNotificationService(notificationId: string): Promise<Notification> {
  // Placeholder for send notification
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();
  
  if (error) throw new DatabaseError('Failed to send notification', { error });
  return data as Notification;
}

// ============================================================================
// Notification Engine
// Central communication engine for the entire platform
// ============================================================================

/**
 * Generate notification number
 */
function generateNotificationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NOT${timestamp}${random}`;
}

/**
 * Create notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  await validateCreateNotificationPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateCreateNotificationInput(input);
    validateNotificationChannels(input.channels);

    if (input.scheduled_at) {
      validateScheduledTime(input.scheduled_at);
    }

    // Validate channel permissions
    for (const channel of input.channels) {
      await validateChannelPermission(channel);
    }

    const notificationNumber = generateNotificationNumber();
    const now = new Date().toISOString();

    const notificationData = {
      clinic_id: clinicId,
      notification_number: notificationNumber,
      user_id: input.user_id,
      role: input.role,
      module: input.module,
      entity_id: input.entity_id,
      source: input.source,
      type: input.type,
      priority: input.priority || 'normal',
      status: input.scheduled_at ? 'scheduled' : 'draft',
      channels: input.channels,
      subject: input.subject,
      body: input.body,
      html_body: input.html_body,
      data: input.data,
      template_id: input.template_id,
      scheduled_at: input.scheduled_at,
      retry_count: 0,
      max_retries: input.max_retries || 3,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now,
      version_number: 1,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create notification', { error, input });
      throw new DatabaseError('Failed to create notification', { error });
    }

    logger.info('Notification created successfully', { notificationNumber });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating notification', { error, input });
    throw new DatabaseError('Failed to create notification', { error });
  }
}

/**
 * Create notification from template
 */
export async function createNotificationFromTemplate(
  templateId: string,
  variables: Record<string, any>,
  options: {
    user_id?: string;
    role?: string;
    entity_id?: string;
    channels?: NotificationChannel[];
    scheduled_at?: string;
    priority?: NotificationPriority;
  } = {}
): Promise<Notification> {
  const supabase = getSupabaseClient();
  const clinicId = await getUserClinicId();

  try {
    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('clinic_id', clinicId)
      .single();

    if (templateError || !template) {
      throw new NotFoundError('Notification template not found');
    }

    // Render template
    const subject = renderTemplate(template.subject_template, variables);
    const body = renderTemplate(template.body_template, variables);
    const htmlBody = template.html_template ? renderTemplate(template.html_template, variables) : undefined;

    // Create notification
    const input: CreateNotificationInput = {
      user_id: options.user_id,
      role: options.role,
      module: template.module,
      entity_id: options.entity_id,
      source: 'system' as any,
      type: template.type,
      priority: options.priority,
      channels: options.channels || template.channels,
      subject,
      body,
      html_body: htmlBody,
      data: variables,
      template_id: templateId,
      scheduled_at: options.scheduled_at,
    };

    return await createNotification(input);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating notification from template', { error, templateId });
    throw new DatabaseError('Failed to create notification from template', { error });
  }
}

/**
 * Queue notification for sending
 */
export async function queueNotificationForSending(notificationId: string): Promise<void> {
  await validateSendNotificationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !notification) {
      throw new NotFoundError('Notification not found');
    }

    // Validate status
    if (notification.status !== 'draft') {
      throw new Error(`Cannot queue notification with status: ${notification.status}`);
    }

    // Update status to queued
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'queued',
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      logger.error('Failed to queue notification', { error, notificationId });
      throw new DatabaseError('Failed to queue notification', { error });
    }

    // Add to queue
    await queueNotification(notificationId, notification.priority);

    logger.info('Notification queued successfully', { notificationId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error queuing notification', { error, notificationId });
    throw new DatabaseError('Failed to queue notification', { error });
  }
}

/**
 * Send notification immediately
 */
export async function sendNotificationNow(notificationId: string): Promise<Notification> {
  await validateSendNotificationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !notification) {
      throw new NotFoundError('Notification not found');
    }

    // Validate status
    if (notification.status !== 'draft' && notification.status !== 'queued') {
      throw new Error(`Cannot send notification with status: ${notification.status}`);
    }

    // Update status to sending
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        status: 'sending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (updateError) {
      logger.error('Failed to update notification status', { updateError, notificationId });
      throw new DatabaseError('Failed to update notification status', { updateError });
    }

    // Send notification via channels
    const result = await sendNotificationService(notificationId);

    logger.info('Notification sent successfully', { notificationId });
    return result;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error sending notification', { error, notificationId });
    throw new DatabaseError('Failed to send notification', { error });
  }
}

/**
 * Schedule notification
 */
export async function scheduleNotification(notificationId: string, scheduledAt: string): Promise<Notification> {
  await validateSendNotificationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateScheduledTime(scheduledAt);

    // Fetch notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !notification) {
      throw new NotFoundError('Notification not found');
    }

    // Validate status
    if (notification.status !== 'draft') {
      throw new Error(`Cannot schedule notification with status: ${notification.status}`);
    }

    // Update notification
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to schedule notification', { error, notificationId });
      throw new DatabaseError('Failed to schedule notification', { error });
    }

    // Add to scheduler
    await scheduleNotificationService(notificationId, scheduledAt);

    logger.info('Notification scheduled successfully', { notificationId, scheduledAt });
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
 * Create and send notification in one operation
 */
export async function createAndSendNotification(input: CreateNotificationInput): Promise<Notification> {
  // Create notification
  const notification = await createNotification(input);

  // Send immediately
  return await sendNotificationNow(notification.id);
}

/**
 * Create and queue notification in one operation
 */
export async function createAndQueueNotification(input: CreateNotificationInput): Promise<Notification> {
  // Create notification
  const notification = await createNotification(input);

  // Queue for sending
  await queueNotificationForSending(notification.id);

  return notification;
}

/**
 * Create and schedule notification in one operation
 */
export async function createAndScheduleNotification(
  input: CreateNotificationInput,
  scheduledAt: string
): Promise<Notification> {
  input.scheduled_at = scheduledAt;

  // Create notification
  const notification = await createNotification(input);

  // Schedule
  await scheduleNotification(notification.id, scheduledAt);

  return notification;
}

/**
 * Bulk create notifications
 */
export async function bulkCreateNotifications(inputs: CreateNotificationInput[]): Promise<Notification[]> {
  const notifications: Notification[] = [];

  for (const input of inputs) {
    const notification = await createNotification(input);
    notifications.push(notification);
  }

  logger.info('Bulk notifications created successfully', { count: notifications.length });
  return notifications;
}

/**
 * Bulk send notifications
 */
export async function bulkSend_notifications(notificationIds: string[]): Promise<Notification[]> {
  const notifications: Notification[] = [];

  for (const notificationId of notificationIds) {
    const notification = await sendNotificationNow(notificationId);
    notifications.push(notification);
  }

  logger.info('Bulk notifications sent successfully', { count: notifications.length });
  return notifications;
}

/**
 * Process notification queue (called by background worker)
 */
export async function processNotificationQueue(): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Fetch queued notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch queued notifications', { error });
      throw new DatabaseError('Failed to fetch queued notifications', { error });
    }

    if (!notifications || notifications.length === 0) {
      return;
    }

    logger.info('Processing notification queue', { count: notifications.length });

    for (const notification of notifications as Notification[]) {
      try {
        await sendNotificationNow(notification.id);
      } catch (error) {
        logger.error('Failed to send notification from queue', { error, notificationId: notification.id });
      }
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error processing notification queue', { error });
    throw new DatabaseError('Failed to process notification queue', { error });
  }
}

/**
 * Process scheduled notifications (called by background worker)
 */
export async function processScheduledNotifications(): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    // Fetch scheduled notifications that are due
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch scheduled notifications', { error });
      throw new DatabaseError('Failed to fetch scheduled notifications', { error });
    }

    if (!notifications || notifications.length === 0) {
      return;
    }

    logger.info('Processing scheduled notifications', { count: notifications.length });

    for (const notification of notifications as Notification[]) {
      try {
        await sendNotificationNow(notification.id);
      } catch (error) {
        logger.error('Failed to send scheduled notification', { error, notificationId: notification.id });
      }
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error processing scheduled notifications', { error });
    throw new DatabaseError('Failed to process scheduled notifications', { error });
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
  byModule: Record<string, number>;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch notification statistics', { error });
      throw new DatabaseError('Failed to fetch notification statistics', { error });
    }

    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    (notifications || []).forEach((notification: Notification) => {
      byStatus[notification.status] = (byStatus[notification.status] || 0) + 1;
      notification.channels.forEach((channel) => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byModule[notification.module] = (byModule[notification.module] || 0) + 1;
    });

    return {
      total: notifications?.length || 0,
      byStatus,
      byChannel,
      byType,
      byModule,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification statistics', { error });
    throw new DatabaseError('Failed to fetch notification statistics', { error });
  }
}
