// ============================================================================
// Enterprise Notification & Communication Service
// Central export file for all notification functionality
// ============================================================================

// Types and Interfaces
export * from './notification-types';

// Validation
export * from './notification-validation';

// Permissions
export * from './notification-permissions';

// Templates
export * from './notification-templates';

// Core Engine
export {
  createNotification as createNotificationEngine,
  createNotificationFromTemplate as createNotificationFromTemplateEngine,
  queueNotificationForSending,
  sendNotificationNow,
  scheduleNotification as scheduleNotificationEngine,
  createAndSendNotification,
  createAndQueueNotification,
  createAndScheduleNotification,
  bulkCreateNotifications,
  bulkSend_notifications,
  processNotificationQueue,
  processScheduledNotifications as processScheduledNotificationsEngine,
  getNotificationStatistics,
} from './notification-engine';
export * from './template-engine';
export * from './queue-manager';
export {
  scheduleNotification as scheduleNotificationScheduler,
  rescheduleNotification as rescheduleNotificationScheduler,
} from './scheduler';
export * from './delivery-tracker';
export * from './retry-engine';

// Channel Providers
export * from './email-provider';
export * from './sms-provider';
export * from './whatsapp-provider';
export * from './push-provider';
export * from './browser-provider';
export * from './webhook-provider';
export * from './slack-provider';
export * from './teams-provider';
export * from './discord-provider';

// User Management
export * from './preferences';
export * from './subscriptions';
export * from './digest';

// Utilities
export * from './localization';
export * from './attachments';
export {
  getNotificationAnalytics,
  getNotificationTrends,
  getTopNotificationTypes,
  getChannelPerformance,
  getUserEngagementMetrics,
  generateAnalyticsReport,
} from './analytics';
export * from './print';

// CRUD Operations
export {
  createNotification as createNotificationOperation,
  createBulkNotifications,
  createNotificationFromTemplate,
  createModuleNotification,
  createSystemNotification,
  createEmergencyNotification,
  generateNotificationNumber,
} from './create-notification';
export * from './update-notification';
export {
  scheduleNotification as scheduleNotificationOperation,
  rescheduleNotification as rescheduleNotificationOperation,
  unscheduleNotification,
  getScheduledNotifications,
  getDueNotifications,
  getUserScheduledNotifications,
} from './schedule-notification';
export * from './send-notification';
export * from './resend-notification';
export * from './cancel-notification';
export * from './archive-notification';
export * from './restore-notification';
export * from './delete-notification';

// Read/Unread Operations
export * from './mark-read';
export * from './mark-unread';

// Query Operations
export * from './get-notification';
export {
  getNotifications,
  getUserNotifications,
  getNotificationsByModule,
  getNotificationsByStatus,
  getNotificationsByType,
  getNotificationsByPriority,
  getRecentNotifications,
  getActiveNotifications as getActiveNotificationsOperation,
  getNotificationCountByStatus,
} from './get-notifications';
export * from './search-notifications';
export * from './export-notifications';
