import { createPermissionCheckers } from '../core/base-permissions';
import { getUserRole, getCurrentUser } from '../core/auth';
import { AuthorizationError } from '../core/errors';
import type { ResourceType } from '../core/permissions';

// ============================================================================
// Notification Permissions
// ============================================================================

/**
 * Resource type for notifications
 * Using 'settings' as it's the closest existing resource type for system-wide management
 */
const NOTIFICATION_RESOURCE: ResourceType = 'settings';

/**
 * Create permission checkers for notifications
 */
const notificationCheckers = createPermissionCheckers(NOTIFICATION_RESOURCE);

// ============================================================================
// Permission Validation Functions
// ============================================================================

/**
 * Validate user can create notification
 */
export async function validateCreateNotificationPermission(): Promise<void> {
  await notificationCheckers.validateCreate();
}

/**
 * Validate user can read notification
 */
export async function validateReadNotificationPermission(): Promise<void> {
  await notificationCheckers.validateRead();
}

/**
 * Validate user can update notification
 */
export async function validateUpdateNotificationPermission(): Promise<void> {
  await notificationCheckers.validateUpdate();
}

/**
 * Validate user can delete notification
 */
export async function validateDeleteNotificationPermission(): Promise<void> {
  await notificationCheckers.validateDelete();
}

/**
 * Validate user can send notification
 */
export async function validateSendNotificationPermission(): Promise<void> {
  await notificationCheckers.validateUpdate();
}

/**
 * Validate user can cancel notification
 */
export async function validateCancelNotificationPermission(): Promise<void> {
  await notificationCheckers.validateUpdate();
}

/**
 * Validate user can archive notification
 */
export async function validateArchiveNotificationPermission(): Promise<void> {
  await notificationCheckers.validateArchive();
}

/**
 * Validate user can restore notification
 */
export async function validateRestoreNotificationPermission(): Promise<void> {
  await notificationCheckers.validateRestore();
}

/**
 * Validate user can export notification
 */
export async function validateExportNotificationPermission(): Promise<void> {
  await notificationCheckers.validateExport();
}

/**
 * Validate user can manage notification templates
 */
export async function validateManageTemplatePermission(): Promise<void> {
  await notificationCheckers.validateUpdate();
}

/**
 * Validate user can manage notification preferences
 */
export async function validateManagePreferencePermission(): Promise<void> {
  // Users can manage their own preferences
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('User not authenticated');
  }
  // Allow users to manage their own preferences
}

/**
 * Validate user can manage notification subscriptions
 */
export async function validateManageSubscriptionPermission(): Promise<void> {
  // Users can manage their own subscriptions
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('User not authenticated');
  }
  // Allow users to manage their own subscriptions
}

/**
 * Validate user can mark notification as read
 */
export async function validateMarkReadPermission(): Promise<void> {
  // Users can mark their own notifications as read
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('User not authenticated');
  }
  // Allow users to mark their own notifications as read
}

/**
 * Validate user can mark notification as unread
 */
export async function validateMarkUnreadPermission(): Promise<void> {
  // Users can mark their own notifications as unread
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('User not authenticated');
  }
  // Allow users to mark their own notifications as unread
}

/**
 * Validate user can access notification analytics
 */
export async function validateAnalyticsPermission(): Promise<void> {
  await notificationCheckers.validateRead();
}

/**
 * Validate user can access notification based on module
 */
export async function validateModuleNotificationPermission(module: string): Promise<void> {
  const role = await getUserRole();

  // Owners and administrators have full access
  if (role === 'owner' || role === 'administrator') {
    return;
  }

  // Doctors can access medical notifications
  if (role === 'doctor' && ['medical_records', 'prescriptions', 'laboratory'].includes(module)) {
    return;
  }

  // Receptionists can access appointment notifications
  if (role === 'receptionist' && ['appointments', 'patients'].includes(module)) {
    return;
  }

  // Accountants can access financial notifications
  if (role === 'accountant' && ['billing'].includes(module)) {
    return;
  }

  // Lab technicians can access laboratory notifications
  if (role === 'lab_technician' && ['laboratory'].includes(module)) {
    return;
  }

  // Radiologists can access laboratory notifications
  if (role === 'radiologist' && ['laboratory'].includes(module)) {
    return;
  }

  // Staff can access basic notifications
  if (role === 'staff' && ['patients', 'appointments'].includes(module)) {
    return;
  }

  throw new AuthorizationError(`You do not have permission to access ${module} notifications`);
}

/**
 * Validate user can send notification to specific channel
 */
export async function validateChannelPermission(channel: string): Promise<void> {
  const role = await getUserRole();

  // Owners and administrators can use all channels
  if (role === 'owner' || role === 'administrator') {
    return;
  }

  // Restrict certain channels to administrators only
  const adminOnlyChannels = ['webhook', 'slack', 'teams', 'discord'];
  if (adminOnlyChannels.includes(channel)) {
    throw new AuthorizationError(`Only administrators can use ${channel} channel`);
  }

  // All other roles can use basic channels
  const basicChannels = ['in_app', 'email', 'sms'];
  if (basicChannels.includes(channel)) {
    return;
  }

  throw new AuthorizationError(`You do not have permission to use ${channel} channel`);
}

/**
 * Check if user can access notification
 */
export async function canAccessNotification(notificationUserId?: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  // If notification is not assigned to a specific user, check general permissions
  if (!notificationUserId) {
    return await notificationCheckers.canRead();
  }

  // Users can access their own notifications
  if (notificationUserId === user.id) {
    return true;
  }

  // Administrators can access all notifications
  const role = await getUserRole();
  if (role === 'owner' || role === 'administrator') {
    return true;
  }

  return false;
}

/**
 * Validate user can access notification
 */
export async function validateNotificationAccess(notificationUserId?: string): Promise<void> {
  if (!(await canAccessNotification(notificationUserId))) {
    throw new AuthorizationError('You do not have permission to access this notification');
  }
}
