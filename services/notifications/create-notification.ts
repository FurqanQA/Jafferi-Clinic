import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCreateNotificationPermission } from './notification-permissions';
import { validateCreateNotificationInput } from './notification-validation';
import { Notification, NotificationChannel, NotificationModule, NotificationType, NotificationPriority, NotificationSource } from './notification-types';

// ============================================================================
// Create Notification
// Creates new notifications with validation and permission checks
// ============================================================================

/**
 * Generate notification number
 */
export function generateNotificationNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NOT${timestamp}${random}`;
}

/**
 * Create a single notification
 */
export async function createNotification(input: {
  subject: string;
  body: string;
  html_body?: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  module: NotificationModule;
  entity_id?: string;
  user_id?: string;
  role?: string;
  data?: Record<string, any>;
  template_id?: string;
  scheduled_at?: string;
}): Promise<Notification> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCreateNotificationPermission();
    validateCreateNotificationInput(input);

    const notificationNumber = generateNotificationNumber();
    const now = new Date().toISOString();

    const notificationData = {
      clinic_id: clinicId,
      notification_number: notificationNumber,
      user_id: input.user_id || null,
      role: input.role || null,
      module: input.module,
      entity_id: input.entity_id || null,
      source: 'system' as NotificationSource,
      type: input.type,
      priority: input.priority,
      status: 'draft' as const,
      channels: input.channels,
      subject: input.subject,
      body: input.body,
      html_body: input.html_body || null,
      data: input.data || null,
      template_id: input.template_id || null,
      scheduled_at: input.scheduled_at || null,
      sent_at: null,
      delivered_at: null,
      read_at: null,
      failed_at: null,
      failure_reason: null,
      retry_count: 0,
      max_retries: 3,
      next_retry_at: null,
      created_by: user.id,
      updated_by: null,
      sent_by: null,
      cancelled_by: null,
      read_by: null,
      created_at: now,
      updated_at: now,
      version_number: 1,
      is_active: true,
      deleted_at: null,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create notification', { error });
      throw new DatabaseError('Failed to create notification', { error });
    }

    logger.info('Notification created', { notificationId: data.id, notificationNumber });
    return data as Notification;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating notification', { error });
    throw new DatabaseError('Failed to create notification', { error });
  }
}

/**
 * Create multiple notifications (bulk)
 */
export async function createBulkNotifications(inputs: Array<{
  subject: string;
  body: string;
  html_body?: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  module: NotificationModule;
  entity_id?: string;
  user_id?: string;
  role?: string;
  data?: Record<string, any>;
  template_id?: string;
  scheduled_at?: string;
}>): Promise<Notification[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateCreateNotificationPermission();

    const now = new Date().toISOString();
    const notifications = inputs.map((input) => {
      validateCreateNotificationInput(input);

      return {
        clinic_id: clinicId,
        notification_number: generateNotificationNumber(),
        user_id: input.user_id || null,
        role: input.role || null,
        module: input.module,
        entity_id: input.entity_id || null,
        source: 'system' as NotificationSource,
        type: input.type,
        priority: input.priority,
        status: 'draft' as const,
        channels: input.channels,
        subject: input.subject,
        body: input.body,
        html_body: input.html_body || null,
        data: input.data || null,
        template_id: input.template_id || null,
        scheduled_at: input.scheduled_at || null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        failed_at: null,
        failure_reason: null,
        retry_count: 0,
        max_retries: 3,
        next_retry_at: null,
        created_by: user.id,
        updated_by: null,
        sent_by: null,
        cancelled_by: null,
        read_by: null,
        created_at: now,
        updated_at: now,
        version_number: 1,
        is_active: true,
        deleted_at: null,
      };
    });

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      logger.error('Failed to create bulk notifications', { error });
      throw new DatabaseError('Failed to create bulk notifications', { error });
    }

    logger.info('Bulk notifications created', { count: data?.length });
    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating bulk notifications', { error });
    throw new DatabaseError('Failed to create bulk notifications', { error });
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
  }
): Promise<Notification> {
  // Placeholder for template-based notification creation
  // In production, this would load the template, render it with variables, and create the notification
  logger.info('Template-based notification creation requested', { templateId, variables });

  return await createNotification({
    subject: variables.subject || 'Notification',
    body: variables.body || 'Notification body',
    type: 'information' as NotificationType,
    priority: 'normal' as NotificationPriority,
    channels: options.channels || ['in_app'],
    module: 'general' as NotificationModule,
    entity_id: options.entity_id,
    user_id: options.user_id,
    role: options.role,
    data: variables,
    scheduled_at: options.scheduled_at,
  });
}

/**
 * Create notification for specific module
 */
export async function createModuleNotification(
  module: NotificationModule,
  entityId: string,
  subject: string,
  body: string,
  options: {
    type?: NotificationType;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    user_id?: string;
    role?: string;
    data?: Record<string, any>;
  }
): Promise<Notification> {
  return await createNotification({
    subject,
    body,
    type: options.type || 'information',
    priority: options.priority || 'normal',
    channels: options.channels || ['in_app'],
    module,
    entity_id: entityId,
    user_id: options.user_id,
    role: options.role,
    data: options.data,
  });
}

/**
 * Create system notification (broadcast to all users or role)
 */
export async function createSystemNotification(
  subject: string,
  body: string,
  options: {
    type?: NotificationType;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    role?: string;
    data?: Record<string, any>;
  }
): Promise<Notification> {
  return await createNotification({
    subject,
    body,
    type: options.type || 'information',
    priority: options.priority || 'normal',
    channels: options.channels || ['in_app', 'browser'],
    module: 'system' as NotificationModule,
    role: options.role,
    data: options.data,
  });
}

/**
 * Create emergency notification
 */
export async function createEmergencyNotification(
  subject: string,
  body: string,
  options: {
    user_id?: string;
    role?: string;
    entity_id?: string;
    channels?: NotificationChannel[];
    data?: Record<string, any>;
  }
): Promise<Notification> {
  return await createNotification({
    subject,
    body,
    type: 'emergency' as NotificationType,
    priority: 'critical' as NotificationPriority,
    channels: options.channels || ['in_app', 'browser', 'push', 'sms'],
    module: 'general' as NotificationModule,
    entity_id: options.entity_id,
    user_id: options.user_id,
    role: options.role,
    data: options.data,
  });
}
