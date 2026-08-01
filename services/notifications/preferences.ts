import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManagePreferencePermission } from './notification-permissions';
import { validateNotificationPreference } from './notification-validation';
import { NotificationPreference, NotificationChannel, NotificationModule } from './notification-types';

// ============================================================================
// Notification Preferences
// Manages user notification preferences per channel and type
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId?: string, module?: NotificationModule): Promise<NotificationPreference> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManagePreferencePermission();

    let query = supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId);

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query.single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return getDefaultPreferences(targetUserId, clinicId, module);
      }
      logger.error('Failed to fetch notification preferences', { error, userId: targetUserId });
      throw new DatabaseError('Failed to fetch notification preferences', { error });
    }

    return data as NotificationPreference;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification preferences', { error, userId: targetUserId });
    throw new DatabaseError('Failed to fetch notification preferences', { error });
  }
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences(userId: string, clinicId: string, module?: NotificationModule): NotificationPreference {
  return {
    id: '',
    user_id: userId,
    clinic_id: clinicId,
    module: module || 'general' as NotificationModule,
    channels_enabled: ['in_app', 'browser'],
    channels_disabled: ['sms', 'whatsapp'],
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: 'UTC',
    language: 'en',
    digest_mode: false,
    digest_frequency: 'daily',
    emergency_override: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Update user notification preferences
 */
export async function updateUserNotificationPreferences(
  preferences: Partial<NotificationPreference>,
  userId?: string
): Promise<NotificationPreference> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManagePreferencePermission();
    validateNotificationPreference(preferences);

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .eq('module', preferences.module || 'general')
      .single();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update notification preferences', { error, userId: targetUserId });
        throw new DatabaseError('Failed to update notification preferences', { error });
      }

      logger.info('Notification preferences updated', { userId: targetUserId });
      return data as NotificationPreference;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: targetUserId,
          clinic_id: clinicId,
          module: preferences.module || 'general' as NotificationModule,
          ...preferences,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create notification preferences', { error, userId: targetUserId });
        throw new DatabaseError('Failed to create notification preferences', { error });
      }

      logger.info('Notification preferences created', { userId: targetUserId });
      return data as NotificationPreference;
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating notification preferences', { error, userId: targetUserId });
    throw new DatabaseError('Failed to update notification preferences', { error });
  }
}

/**
 * Enable notification channel for user
 */
export async function enableNotificationChannel(
  channel: NotificationChannel,
  userId?: string,
  module?: NotificationModule
): Promise<NotificationPreference> {
  const preferences = await getUserNotificationPreferences(userId, module);

  const channelsEnabled = [...(preferences.channels_enabled || [])];
  const channelsDisabled = [...(preferences.channels_disabled || [])];

  if (!channelsEnabled.includes(channel)) {
    channelsEnabled.push(channel);
  }
  const disabledIndex = channelsDisabled.indexOf(channel);
  if (disabledIndex > -1) {
    channelsDisabled.splice(disabledIndex, 1);
  }

  return await updateUserNotificationPreferences(
    {
      channels_enabled: channelsEnabled,
      channels_disabled: channelsDisabled,
    },
    userId
  );
}

/**
 * Disable notification channel for user
 */
export async function disableNotificationChannel(
  channel: NotificationChannel,
  userId?: string,
  module?: NotificationModule
): Promise<NotificationPreference> {
  const preferences = await getUserNotificationPreferences(userId, module);

  const channelsEnabled = [...(preferences.channels_enabled || [])];
  const channelsDisabled = [...(preferences.channels_disabled || [])];

  if (!channelsDisabled.includes(channel)) {
    channelsDisabled.push(channel);
  }
  const enabledIndex = channelsEnabled.indexOf(channel);
  if (enabledIndex > -1) {
    channelsEnabled.splice(enabledIndex, 1);
  }

  return await updateUserNotificationPreferences(
    {
      channels_enabled: channelsEnabled,
      channels_disabled: channelsDisabled,
    },
    userId
  );
}

/**
 * Set quiet hours for user
 */
export async function setQuietHours(
  startTime: string,
  endTime: string,
  userId?: string,
  module?: NotificationModule
): Promise<NotificationPreference> {
  return await updateUserNotificationPreferences(
    {
      quiet_hours_start: startTime,
      quiet_hours_end: endTime,
    },
    userId
  );
}

/**
 * Check if user is in quiet hours
 */
export function isInQuietHours(preferences: NotificationPreference): boolean {
  if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHours, startMinutes] = preferences.quiet_hours_start.split(':').map(Number);
  const [endHours, endMinutes] = preferences.quiet_hours_end.split(':').map(Number);

  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Set user timezone
 */
export async function setUserTimezone(timezone: string, userId?: string): Promise<NotificationPreference> {
  return await updateUserNotificationPreferences({ timezone }, userId);
}

/**
 * Enable digest for user
 */
export async function enableDigest(
  frequency: 'daily' | 'weekly' | 'monthly',
  userId?: string,
  module?: NotificationModule
): Promise<NotificationPreference> {
  return await updateUserNotificationPreferences(
    {
      digest_mode: true,
      digest_frequency: frequency,
    },
    userId
  );
}

/**
 * Disable digest for user
 */
export async function disableDigest(userId?: string, module?: NotificationModule): Promise<NotificationPreference> {
  return await updateUserNotificationPreferences({ digest_mode: false }, userId);
}

/**
 * Get all notification preferences (admin only)
 */
export async function getAllNotificationPreferences(): Promise<NotificationPreference[]> {
  await validateManagePreferencePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch all notification preferences', { error });
      throw new DatabaseError('Failed to fetch all notification preferences', { error });
    }

    return (data || []) as NotificationPreference[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching all notification preferences', { error });
    throw new DatabaseError('Failed to fetch all notification preferences', { error });
  }
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(userId?: string, module?: NotificationModule): Promise<NotificationPreference> {
  await validateManagePreferencePermission();

  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .eq('module', module || 'general');

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to reset notification preferences', { error, userId: targetUserId });
      throw new DatabaseError('Failed to reset notification preferences', { error });
    }

    logger.info('Notification preferences reset', { userId: targetUserId });
    return getDefaultPreferences(targetUserId, clinicId, module);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error resetting notification preferences', { error, userId: targetUserId });
    throw new DatabaseError('Failed to reset notification preferences', { error });
  }
}

/**
 * Get preferences statistics
 */
export async function getPreferencesStatistics(): Promise<{
  totalUsers: number;
  emailEnabled: number;
  smsEnabled: number;
  whatsappEnabled: number;
  pushEnabled: number;
  browserEnabled: number;
  inAppEnabled: number;
  digestEnabled: number;
}> {
  await validateManagePreferencePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to fetch preferences statistics', { error });
      throw new DatabaseError('Failed to fetch preferences statistics', { error });
    }

    const preferences = data || [];

    return {
      totalUsers: preferences.length,
      emailEnabled: preferences.filter((p: any) => p.channels_enabled?.includes('email')).length,
      smsEnabled: preferences.filter((p: any) => p.channels_enabled?.includes('sms')).length,
      whatsappEnabled: preferences.filter((p: any) => p.channels_enabled?.includes('whatsapp')).length,
      pushEnabled: preferences.filter((p: any) => p.channels_enabled?.includes('push')).length,
      browserEnabled: preferences.filter((p: any) => p.channels_enabled?.includes('browser')).length,
      inAppEnabled: preferences.filter((p: any) => p.channels_enabled?.includes('in_app')).length,
      digestEnabled: preferences.filter((p: any) => p.digest_mode).length,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching preferences statistics', { error });
    throw new DatabaseError('Failed to fetch preferences statistics', { error });
  }
}
