// ============================================================================
// Notification Types
// Enterprise Notification & Communication Service
// ============================================================================

// ============================================================================
// Notification Channel Enum
// ============================================================================

export const NOTIFICATION_CHANNEL = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  PUSH: 'push',
  BROWSER: 'browser',
  WEBHOOK: 'webhook',
  SLACK: 'slack',
  TEAMS: 'teams',
  DISCORD: 'discord',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

// ============================================================================
// Notification Type Enum
// ============================================================================

export const NOTIFICATION_TYPE = {
  INFORMATION: 'information',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  REMINDER: 'reminder',
  MEDICAL: 'medical',
  FINANCIAL: 'financial',
  MARKETING: 'marketing',
  SYSTEM: 'system',
  SECURITY: 'security',
  EMERGENCY: 'emergency',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

// ============================================================================
// Notification Priority Enum
// ============================================================================

export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical',
} as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

// ============================================================================
// Notification Status Enum
// ============================================================================

export const NOTIFICATION_STATUS = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

// ============================================================================
// Notification Source Enum
// ============================================================================

export const NOTIFICATION_SOURCE = {
  AUTHENTICATION: 'authentication',
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  APPOINTMENT: 'appointment',
  MEDICAL_RECORD: 'medical_record',
  PRESCRIPTION: 'prescription',
  LABORATORY: 'laboratory',
  BILLING: 'billing',
  PAYMENTS: 'payments',
  INVENTORY: 'inventory',
  REPORTS: 'reports',
  SUBSCRIPTIONS: 'subscriptions',
  SYSTEM: 'system',
  AI: 'ai',
} as const;

export type NotificationSource = (typeof NOTIFICATION_SOURCE)[keyof typeof NOTIFICATION_SOURCE];

// ============================================================================
// Notification Module Enum
// ============================================================================

export const NOTIFICATION_MODULE = {
  AUTHENTICATION: 'authentication',
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  APPOINTMENTS: 'appointments',
  MEDICAL_RECORDS: 'medical_records',
  PRESCRIPTIONS: 'prescriptions',
  LABORATORY: 'laboratory',
  BILLING: 'billing',
  PAYMENTS: 'payments',
  INVENTORY: 'inventory',
  REPORTS: 'reports',
  SYSTEM: 'system',
} as const;

export type NotificationModule = (typeof NOTIFICATION_MODULE)[keyof typeof NOTIFICATION_MODULE];

// ============================================================================
// Delivery Status Enum
// ============================================================================

export const DELIVERY_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  READ: 'read',
  FAILED: 'failed',
  BOUNCE: 'bounce',
  SPAM: 'spam',
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

// ============================================================================
// Email Provider Enum
// ============================================================================

export const EMAIL_PROVIDER = {
  RESEND: 'resend',
  SENDGRID: 'sendgrid',
  MAILGUN: 'mailgun',
  AWS_SES: 'aws_ses',
  SMTP: 'smtp',
} as const;

export type EmailProvider = (typeof EMAIL_PROVIDER)[keyof typeof EMAIL_PROVIDER];

// ============================================================================
// SMS Provider Enum
// ============================================================================

export const SMS_PROVIDER = {
  TWILIO: 'twilio',
  VONAGE: 'vonage',
  AWS_SNS: 'aws_sns',
  LOCAL: 'local',
} as const;

export type SMSProvider = (typeof SMS_PROVIDER)[keyof typeof SMS_PROVIDER];

// ============================================================================
// WhatsApp Provider Enum
// ============================================================================

export const WHATSAPP_PROVIDER = {
  CLOUD_API: 'cloud_api',
  TWILIO: 'twilio',
  DIALOG360: 'dialog360',
} as const;

export type WhatsAppProvider = (typeof WHATSAPP_PROVIDER)[keyof typeof WHATSAPP_PROVIDER];

// ============================================================================
// Push Provider Enum
// ============================================================================

export const PUSH_PROVIDER = {
  FIREBASE: 'firebase',
  ONESIGNAL: 'onesignal',
  EXPO: 'expo',
} as const;

export type PushProvider = (typeof PUSH_PROVIDER)[keyof typeof PUSH_PROVIDER];

// ============================================================================
// Digest Frequency Enum
// ============================================================================

export const DIGEST_FREQUENCY = {
  IMMEDIATE: 'immediate',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type DigestFrequency = (typeof DIGEST_FREQUENCY)[keyof typeof DIGEST_FREQUENCY];

// ============================================================================
// Notification Interface
// ============================================================================

export interface Notification {
  id: string;
  clinic_id: string;
  notification_number: string;
  user_id?: string;
  role?: string;
  module: NotificationModule;
  entity_id?: string;
  source: NotificationSource;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  subject: string;
  body: string;
  html_body?: string;
  data?: Record<string, any>;
  template_id?: string;
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  failure_reason?: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  created_by: string;
  updated_by?: string;
  sent_by?: string;
  cancelled_by?: string;
  read_by?: string;
  created_at: string;
  updated_at: string;
  version_number: number;
  is_active: boolean;
  deleted_at?: string;
}

// ============================================================================
// Notification Template Interface
// ============================================================================

export interface NotificationTemplate {
  id: string;
  clinic_id: string;
  template_number: string;
  name: string;
  description?: string;
  module: NotificationModule;
  type: NotificationType;
  channels: NotificationChannel[];
  subject_template: string;
  body_template: string;
  html_template?: string;
  variables: string[];
  is_system: boolean;
  is_active: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  version_number: number;
}

// ============================================================================
// Notification Delivery Interface
// ============================================================================

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  recipient: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  read_at?: string;
  failed_at?: string;
  failure_reason?: string;
  provider?: string;
  provider_message_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Notification Preference Interface
// ============================================================================

export interface NotificationPreference {
  id: string;
  user_id: string;
  clinic_id: string;
  module: NotificationModule;
  channels_enabled: NotificationChannel[];
  channels_disabled: NotificationChannel[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  language?: string;
  digest_mode: boolean;
  digest_frequency?: DigestFrequency;
  emergency_override: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Notification Subscription Interface
// ============================================================================

export interface NotificationSubscription {
  id: string;
  user_id: string;
  clinic_id: string;
  module: NotificationModule;
  entity_id?: string;
  topic?: string;
  is_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Notification Attachment Interface
// ============================================================================

export interface NotificationAttachment {
  id: string;
  notification_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_provider?: string;
  created_at: string;
}

// ============================================================================
// Notification Analytics Interface
// ============================================================================

export interface NotificationAnalytics {
  id: string;
  clinic_id: string;
  notification_id?: string;
  module?: NotificationModule;
  channel?: NotificationChannel;
  type?: NotificationType;
  date: string;
  created_count: number;
  queued_count: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  read_count: number;
  failed_count: number;
  bounce_count: number;
  spam_count: number;
  avg_delivery_time_ms?: number;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Create Notification Input Interface
// ============================================================================

export interface CreateNotificationInput {
  user_id?: string;
  role?: string;
  module: NotificationModule;
  entity_id?: string;
  source: NotificationSource;
  type: NotificationType;
  priority?: NotificationPriority;
  channels: NotificationChannel[];
  subject: string;
  body: string;
  html_body?: string;
  data?: Record<string, any>;
  template_id?: string;
  scheduled_at?: string;
  max_retries?: number;
  attachments?: Array<{
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
  }>;
}

// ============================================================================
// Update Notification Input Interface
// ============================================================================

export interface UpdateNotificationInput {
  subject?: string;
  body?: string;
  html_body?: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduled_at?: string;
  max_retries?: number;
}

// ============================================================================
// Notification Filters Interface
// ============================================================================

export interface NotificationFilters {
  clinic_id?: string;
  user_id?: string;
  role?: string;
  module?: NotificationModule;
  entity_id?: string;
  source?: NotificationSource;
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  today?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  this_year?: boolean;
}

// ============================================================================
// Notification Search Params Interface
// ============================================================================

export interface NotificationSearchParams {
  query?: string;
  filters?: NotificationFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Notification Export Data Interface
// ============================================================================

export interface NotificationExportData {
  notification_number: string;
  notification_date: string;
  module: string;
  type: string;
  priority: string;
  status: string;
  channels: string;
  subject: string;
  recipient: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
}

// ============================================================================
// Queue Job Interface
// ============================================================================

export interface QueueJob {
  id: string;
  notification_id: string;
  priority: NotificationPriority;
  scheduled_at?: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Retry Config Interface
// ============================================================================

export interface RetryConfig {
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  exponential_backoff: boolean;
  backoff_multiplier: number;
}

// ============================================================================
// Template Variable Interface
// ============================================================================

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  default?: any;
  description?: string;
}

// ============================================================================
// Notification Event Interface
// ============================================================================

export interface NotificationEvent {
  type: 'created' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';
  notification_id: string;
  channel?: NotificationChannel;
  timestamp: string;
  data?: Record<string, any>;
}

// ============================================================================
// AI Notification Extensions Interface (Placeholders)
// ============================================================================

export interface AINotificationExtensions {
  best_send_time?: {
    predicted_time: string;
    confidence: number;
  };
  personalization?: {
    personalized_subject: string;
    personalized_body: string;
    confidence: number;
  };
  prioritization?: {
    suggested_priority: NotificationPriority;
    reason: string;
    confidence: number;
  };
  spam_detection?: {
    is_spam: boolean;
    confidence: number;
    reason: string;
  };
  engagement_prediction?: {
    predicted_open_rate: number;
    predicted_click_rate: number;
    confidence: number;
  };
  smart_reminder?: {
    suggested_reminder_time: string;
    reason: string;
    confidence: number;
  };
  channel_recommendation?: {
    recommended_channels: NotificationChannel[];
    reason: string;
    confidence: number;
  };
}
