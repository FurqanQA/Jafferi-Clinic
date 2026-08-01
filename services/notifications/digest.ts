import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManagePreferencePermission } from './notification-permissions';
import { Notification, NotificationPreference, DigestFrequency } from './notification-types';

// ============================================================================
// Digest
// Aggregates notifications into periodic digests
// ============================================================================

/**
 * Digest interface
 */
export interface NotificationDigest {
  id: string;
  user_id: string;
  clinic_id: string;
  frequency: DigestFrequency;
  notification_count: number;
  notification_ids: string[];
  subject: string;
  body: string;
  html_body?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get pending digest for user
 */
export async function getPendingDigest(userId?: string): Promise<NotificationDigest | null> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_digests')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .is('sent_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Failed to fetch pending digest', { error, userId: targetUserId });
      throw new DatabaseError('Failed to fetch pending digest', { error });
    }

    return data as NotificationDigest;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pending digest', { error, userId: targetUserId });
    throw new DatabaseError('Failed to fetch pending digest', { error });
  }
}

/**
 * Create digest for user
 */
export async function createDigest(
  notifications: Notification[],
  frequency: DigestFrequency,
  userId?: string
): Promise<NotificationDigest> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManagePreferencePermission();

    const notificationIds = notifications.map(n => n.id);
    const subject = generateDigestSubject(frequency);
    const body = generateDigestBody(notifications);
    const htmlBody = generateDigestHtmlBody(notifications);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notification_digests')
      .insert({
        user_id: targetUserId,
        clinic_id: clinicId,
        frequency,
        notification_count: notifications.length,
        notification_ids: notificationIds,
        subject,
        body,
        html_body: htmlBody,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create digest', { error, userId: targetUserId });
      throw new DatabaseError('Failed to create digest', { error });
    }

    logger.info('Digest created', { userId: targetUserId, notificationCount: notifications.length });
    return data as NotificationDigest;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating digest', { error, userId: targetUserId });
    throw new DatabaseError('Failed to create digest', { error });
  }
}

/**
 * Generate digest subject
 */
function generateDigestSubject(frequency: DigestFrequency): string {
  const frequencyText = {
    immediate: 'Immediate',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  }[frequency];

  return `${frequencyText} Notification Digest`;
}

/**
 * Generate digest body (plain text)
 */
function generateDigestBody(notifications: Notification[]): string {
  if (notifications.length === 0) {
    return 'No new notifications.';
  }

  let body = `You have ${notifications.length} new notification(s):\n\n`;

  notifications.forEach((notification, index) => {
    body += `${index + 1}. ${notification.subject}\n`;
    body += `   ${notification.body}\n`;
    body += `   ${new Date(notification.created_at).toLocaleString()}\n\n`;
  });

  return body;
}

/**
 * Generate digest body (HTML)
 */
function generateDigestHtmlBody(notifications: Notification[]): string {
  if (notifications.length === 0) {
    return '<p>No new notifications.</p>';
  }

  let html = `<p>You have ${notifications.length} new notification(s):</p>`;
  html += '<ul>';

  notifications.forEach((notification) => {
    html += '<li>';
    html += `<strong>${notification.subject}</strong><br>`;
    html += `${notification.body}<br>`;
    html += `<small>${new Date(notification.created_at).toLocaleString()}</small>`;
    html += '</li>';
  });

  html += '</ul>';

  return html;
}

/**
 * Send digest
 */
export async function sendDigest(digestId: string): Promise<NotificationDigest> {
  const supabase = getSupabaseClient();

  try {
    const { data: digest, error: fetchError } = await supabase
      .from('notification_digests')
      .select('*')
      .eq('id', digestId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch digest for sending', { error: fetchError, digestId });
      throw new DatabaseError('Failed to fetch digest for sending', { error: fetchError });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notification_digests')
      .update({
        sent_at: now,
        updated_at: now,
      })
      .eq('id', digestId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to send digest', { error, digestId });
      throw new DatabaseError('Failed to send digest', { error });
    }

    logger.info('Digest sent', { digestId });
    return data as NotificationDigest;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error sending digest', { error, digestId });
    throw new DatabaseError('Failed to send digest', { error });
  }
}

/**
 * Get user's digest history
 */
export async function getDigestHistory(userId?: string, limit: number = 50): Promise<NotificationDigest[]> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManagePreferencePermission();

    const { data, error } = await supabase
      .from('notification_digests')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch digest history', { error, userId: targetUserId });
      throw new DatabaseError('Failed to fetch digest history', { error });
    }

    return (data || []) as NotificationDigest[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching digest history', { error, userId: targetUserId });
    throw new DatabaseError('Failed to fetch digest history', { error });
  }
}

/**
 * Get users with digest enabled
 */
export async function getUsersWithDigestEnabled(frequency?: DigestFrequency): Promise<string[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('clinic_id', clinicId)
      .eq('digest_mode', true);

    if (frequency) {
      query = query.eq('digest_frequency', frequency);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch users with digest enabled', { error });
      throw new DatabaseError('Failed to fetch users with digest enabled', { error });
    }

    return (data || []).map((p: any) => p.user_id);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching users with digest enabled', { error });
    throw new DatabaseError('Failed to fetch users with digest enabled', { error });
  }
}

/**
 * Process pending digests
 */
export async function processPendingDigests(): Promise<number> {
  let processed = 0;

  try {
    // Get all users with digest enabled
    const userIds = await getUsersWithDigestEnabled();

    for (const userId of userIds) {
      const pendingDigest = await getPendingDigest(userId);

      if (pendingDigest) {
        await sendDigest(pendingDigest.id);
        processed++;
      }
    }

    if (processed > 0) {
      logger.info('Pending digests processed', { processed });
    }
  } catch (error) {
    logger.error('Error processing pending digests', { error });
  }

  return processed;
}

/**
 * Get digest statistics
 */
export async function getDigestStatistics(): Promise<{
  totalDigests: number;
  sentDigests: number;
  pendingDigests: number;
  byFrequency: Record<string, number>;
}> {
  await validateManagePreferencePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_digests')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to fetch digest statistics', { error });
      throw new DatabaseError('Failed to fetch digest statistics', { error });
    }

    const digests = data || [];

    const byFrequency: Record<string, number> = {};

    digests.forEach((d: any) => {
      byFrequency[d.frequency] = (byFrequency[d.frequency] || 0) + 1;
    });

    return {
      totalDigests: digests.length,
      sentDigests: digests.filter((d: any) => d.sent_at).length,
      pendingDigests: digests.filter((d: any) => !d.sent_at).length,
      byFrequency,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching digest statistics', { error });
    throw new DatabaseError('Failed to fetch digest statistics', { error });
  }
}

/**
 * Delete old digests
 */
export async function deleteOldDigests(daysOld: number = 30): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('notification_digests')
      .delete()
      .eq('clinic_id', clinicId)
      .lt('created_at', cutoffDate)
      .select('id');

    if (error) {
      logger.error('Failed to delete old digests', { error });
      throw new DatabaseError('Failed to delete old digests', { error });
    }

    const deleted = (data || []).length;
    logger.info('Old digests deleted', { deleted, daysOld });
    return deleted;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting old digests', { error });
    throw new DatabaseError('Failed to delete old digests', { error });
  }
}
