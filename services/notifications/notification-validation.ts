import { z } from 'zod';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationSource,
  NotificationModule,
  DeliveryStatus,
  EmailProvider,
  SMSProvider,
  WhatsAppProvider,
  PushProvider,
  DigestFrequency,
} from './notification-types';

// ============================================================================
// Notification Channel Validation
// ============================================================================

export const notificationChannelSchema = z.enum([
  'in_app',
  'email',
  'sms',
  'whatsapp',
  'push',
  'browser',
  'webhook',
  'slack',
  'teams',
  'discord',
]);

// ============================================================================
// Notification Type Validation
// ============================================================================

export const notificationTypeSchema = z.enum([
  'information',
  'success',
  'warning',
  'error',
  'critical',
  'reminder',
  'medical',
  'financial',
  'marketing',
  'system',
  'security',
  'emergency',
]);

// ============================================================================
// Notification Priority Validation
// ============================================================================

export const notificationPrioritySchema = z.enum([
  'low',
  'normal',
  'high',
  'urgent',
  'critical',
]);

// ============================================================================
// Notification Status Validation
// ============================================================================

export const notificationStatusSchema = z.enum([
  'draft',
  'queued',
  'scheduled',
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
  'cancelled',
  'expired',
  'archived',
  'deleted',
]);

// ============================================================================
// Notification Source Validation
// ============================================================================

export const notificationSourceSchema = z.enum([
  'authentication',
  'patient',
  'doctor',
  'appointment',
  'medical_record',
  'prescription',
  'laboratory',
  'billing',
  'payments',
  'inventory',
  'reports',
  'subscriptions',
  'system',
  'ai',
]);

// ============================================================================
// Notification Module Validation
// ============================================================================

export const notificationModuleSchema = z.enum([
  'authentication',
  'patients',
  'doctors',
  'appointments',
  'medical_records',
  'prescriptions',
  'laboratory',
  'billing',
  'payments',
  'inventory',
  'reports',
  'system',
]);

// ============================================================================
// Create Notification Input Validation
// ============================================================================

export const createNotificationInputSchema = z.object({
  user_id: z.string().uuid().optional(),
  role: z.string().optional(),
  module: notificationModuleSchema,
  entity_id: z.string().uuid().optional(),
  source: notificationSourceSchema,
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.optional().default('normal'),
  channels: z.array(notificationChannelSchema).min(1),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(5000),
  html_body: z.string().max(10000).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  template_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
  max_retries: z.number().int().min(0).max(10).optional().default(3),
  attachments: z.array(
    z.object({
      file_name: z.string().min(1).max(255),
      file_type: z.string().min(1).max(100),
      file_size: z.number().int().positive(),
      file_url: z.string().url(),
    })
  ).optional(),
});

// ============================================================================
// Update Notification Input Validation
// ============================================================================

export const updateNotificationInputSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(5000).optional(),
  html_body: z.string().max(10000).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  priority: notificationPrioritySchema.optional(),
  channels: z.array(notificationChannelSchema).min(1).optional(),
  scheduled_at: z.string().datetime().optional(),
  max_retries: z.number().int().min(0).max(10).optional(),
});

// ============================================================================
// Notification Filters Validation
// ============================================================================

export const notificationFiltersSchema = z.object({
  clinic_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  role: z.string().optional(),
  module: notificationModuleSchema.optional(),
  entity_id: z.string().uuid().optional(),
  source: notificationSourceSchema.optional(),
  type: notificationTypeSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  status: notificationStatusSchema.optional(),
  channel: notificationChannelSchema.optional(),
  is_read: z.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  today: z.boolean().optional(),
  this_week: z.boolean().optional(),
  this_month: z.boolean().optional(),
  this_year: z.boolean().optional(),
});

// ============================================================================
// Notification Preference Validation
// ============================================================================

export const notificationPreferenceSchema = z.object({
  user_id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  module: notificationModuleSchema,
  channels_enabled: z.array(notificationChannelSchema),
  channels_disabled: z.array(notificationChannelSchema),
  quiet_hours_start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM').optional(),
  quiet_hours_end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM').optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  digest_mode: z.boolean().default(false),
  digest_frequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).optional(),
  emergency_override: z.boolean().default(true),
});

// ============================================================================
// Notification Subscription Validation
// ============================================================================

export const notificationSubscriptionSchema = z.object({
  user_id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  module: notificationModuleSchema,
  entity_id: z.string().uuid().optional(),
  topic: z.string().optional(),
  is_subscribed: z.boolean(),
});

// ============================================================================
// Notification Template Validation
// ============================================================================

export const notificationTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  module: notificationModuleSchema,
  type: notificationTypeSchema,
  channels: z.array(notificationChannelSchema).min(1),
  subject_template: z.string().min(1).max(500),
  body_template: z.string().min(1).max(5000),
  html_template: z.string().max(10000).optional(),
  variables: z.array(z.string()),
  is_system: z.boolean().default(false),
});

// ============================================================================
// Notification Attachment Validation
// ============================================================================

export const notificationAttachmentSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_type: z.string().min(1).max(100),
  file_size: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
  file_url: z.string().url(),
  storage_provider: z.string().optional(),
});

// ============================================================================
// Retry Config Validation
// ============================================================================

export const retryConfigSchema = z.object({
  max_retries: z.number().int().min(0).max(10),
  initial_delay_ms: z.number().int().min(100).max(60000),
  max_delay_ms: z.number().int().min(1000).max(3600000),
  exponential_backoff: z.boolean(),
  backoff_multiplier: z.number().min(1).max(5),
});

// ============================================================================
// Template Variable Validation
// ============================================================================

export const templateVariableSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['string', 'number', 'boolean', 'date', 'object']),
  required: z.boolean(),
  default: z.any().optional(),
  description: z.string().max(500).optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate create notification input
 */
export function validateCreateNotificationInput(input: any) {
  return createNotificationInputSchema.parse(input);
}

/**
 * Validate update notification input
 */
export function validateUpdateNotificationInput(input: any) {
  return updateNotificationInputSchema.parse(input);
}

/**
 * Validate notification filters
 */
export function validateNotificationFilters(filters: any) {
  return notificationFiltersSchema.parse(filters);
}

/**
 * Validate notification preference
 */
export function validateNotificationPreference(preference: any) {
  return notificationPreferenceSchema.parse(preference);
}

/**
 * Validate notification subscription
 */
export function validateNotificationSubscription(subscription: any) {
  return notificationSubscriptionSchema.parse(subscription);
}

/**
 * Validate notification template
 */
export function validateNotificationTemplate(template: any) {
  return notificationTemplateSchema.parse(template);
}

/**
 * Validate notification attachment
 */
export function validateNotificationAttachment(attachment: any) {
  return notificationAttachmentSchema.parse(attachment);
}

/**
 * Validate retry config
 */
export function validateRetryConfig(config: any) {
  return retryConfigSchema.parse(config);
}

/**
 * Validate template variable
 */
export function validateTemplateVariable(variable: any) {
  return templateVariableSchema.parse(variable);
}

/**
 * Validate notification status transition
 */
export function validateNotificationStatusTransition(
  currentStatus: NotificationStatus,
  newStatus: NotificationStatus
): void {
  const validTransitions: Record<NotificationStatus, NotificationStatus[]> = {
    draft: ['queued', 'scheduled', 'cancelled', 'deleted'],
    queued: ['sending', 'scheduled', 'cancelled', 'failed', 'expired'],
    scheduled: ['queued', 'sending', 'cancelled', 'expired'],
    sending: ['sent', 'failed', 'cancelled'],
    sent: ['delivered', 'failed'],
    delivered: ['read'],
    read: ['archived'],
    failed: ['queued', 'cancelled', 'archived'],
    cancelled: ['archived', 'deleted'],
    expired: ['archived', 'deleted'],
    archived: ['deleted'],
    deleted: [],
  };

  const allowedTransitions = validTransitions[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
    );
  }
}

/**
 * Validate notification channels
 */
export function validateNotificationChannels(channels: NotificationChannel[]): void {
  if (!channels || channels.length === 0) {
    throw new Error('At least one notification channel must be specified');
  }

  const validChannels: NotificationChannel[] = [
    'in_app',
    'email',
    'sms',
    'whatsapp',
    'push',
    'browser',
    'webhook',
    'slack',
    'teams',
    'discord',
  ];

  for (const channel of channels) {
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid notification channel: ${channel}`);
    }
  }
}

/**
 * Validate scheduled time
 */
export function validateScheduledTime(scheduledAt: string): void {
  const scheduledDate = new Date(scheduledAt);
  const now = new Date();

  if (scheduledDate <= now) {
    throw new Error('Scheduled time must be in the future');
  }

  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);

  if (scheduledDate > maxFutureDate) {
    throw new Error('Scheduled time cannot be more than 1 year in the future');
  }
}

/**
 * Validate quiet hours
 */
export function validateQuietHours(start: string, end: string): void {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes >= endMinutes) {
    throw new Error('Quiet hours start time must be before end time');
  }
}

/**
 * Validate attachment file size
 */
export function validateAttachmentFileSize(fileSize: number, maxSize: number = 50 * 1024 * 1024): void {
  if (fileSize > maxSize) {
    throw new Error(`Attachment file size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
  }
}

/**
 * Validate attachment file type
 */
export function validateAttachmentFileType(fileType: string, allowedTypes: string[]): void {
  if (!allowedTypes.includes(fileType)) {
    throw new Error(`Attachment file type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
}
