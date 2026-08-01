import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateAnalyticsPermission } from './notification-permissions';
import { Notification, NotificationChannel, NotificationStatus, NotificationType, NotificationPriority } from './notification-types';

// ============================================================================
// Analytics
// Provides analytics and reporting for notifications
// ============================================================================

/**
 * Notification analytics interface
 */
export interface NotificationAnalytics {
  totalNotifications: number;
  byStatus: Record<NotificationStatus, number>;
  byChannel: Record<NotificationChannel, number>;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate: number;
}

/**
 * Get notification analytics
 */
export async function getNotificationAnalytics(startDate?: string, endDate?: string): Promise<NotificationAnalytics> {
  await validateAnalyticsPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate || monthStart)
      .lte('created_at', endDate || now.toISOString());

    if (error) {
      logger.error('Failed to fetch notification analytics', { error });
      throw new DatabaseError('Failed to fetch notification analytics', { error });
    }

    const notifications = data || [];

    // Calculate analytics
    const byStatus: Record<NotificationStatus, number> = {
      draft: 0,
      queued: 0,
      scheduled: 0,
      sending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      cancelled: 0,
      expired: 0,
      archived: 0,
      deleted: 0,
    };

    const byChannel: Record<NotificationChannel, number> = {
      email: 0,
      sms: 0,
      whatsapp: 0,
      push: 0,
      browser: 0,
      in_app: 0,
      webhook: 0,
      slack: 0,
      teams: 0,
      discord: 0,
    };

    const byType: Record<string, number> = {};

    const byPriority: Record<string, number> = {};

    let sentToday = 0;
    let sentThisWeek = 0;
    let sentThisMonth = 0;

    notifications.forEach((n: any) => {
      // Count by status
      if (byStatus[n.status as NotificationStatus] !== undefined) {
        byStatus[n.status as NotificationStatus]++;
      }

      // Count by channel
      if (n.channels && Array.isArray(n.channels)) {
        n.channels.forEach((channel: NotificationChannel) => {
          if (byChannel[channel] !== undefined) {
            byChannel[channel]++;
          }
        });
      }

      // Count by type
      if (byType[n.type] !== undefined) {
        byType[n.type]++;
      } else {
        byType[n.type] = 1;
      }

      // Count by priority
      if (byPriority[n.priority] !== undefined) {
        byPriority[n.priority]++;
      } else {
        byPriority[n.priority] = 1;
      }

      // Count by time period
      if (n.sent_at) {
        if (n.sent_at >= todayStart) sentToday++;
        if (n.sent_at >= weekStart) sentThisWeek++;
        if (n.sent_at >= monthStart) sentThisMonth++;
      }
    });

    // Calculate rates (placeholder - would need delivery tracking data)
    const totalSent = notifications.filter((n: any) => ['sent', 'delivered', 'read'].includes(n.status)).length;
    const totalDelivered = notifications.filter((n: any) => n.status === 'delivered').length;
    const totalRead = notifications.filter((n: any) => n.status === 'read').length;
    const totalFailed = notifications.filter((n: any) => n.status === 'failed').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
    const failureRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
    const clickRate = 0; // Placeholder - would need click tracking data

    return {
      totalNotifications: notifications.length,
      byStatus,
      byChannel,
      byType,
      byPriority,
      sentToday,
      sentThisWeek,
      sentThisMonth,
      deliveryRate,
      openRate,
      clickRate,
      failureRate,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification analytics', { error });
    throw new DatabaseError('Failed to fetch notification analytics', { error });
  }
}

/**
 * Get notification trends over time
 */
export async function getNotificationTrends(days: number = 30): Promise<Array<{
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}>> {
  await validateAnalyticsPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('created_at, sent_at, status')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch notification trends', { error });
      throw new DatabaseError('Failed to fetch notification trends', { error });
    }

    const notifications = data || [];

    // Group by date
    const trends: Record<string, { sent: number; delivered: number; failed: number }> = {};

    notifications.forEach((n: any) => {
      const date = n.created_at.split('T')[0];
      if (!trends[date]) {
        trends[date] = { sent: 0, delivered: 0, failed: 0 };
      }

      if (n.status === 'sent' || n.status === 'delivered' || n.status === 'read') {
        trends[date].sent++;
      }
      if (n.status === 'delivered' || n.status === 'read') {
        trends[date].delivered++;
      }
      if (n.status === 'failed') {
        trends[date].failed++;
      }
    });

    // Convert to array and fill missing dates
    const result: Array<{ date: string; sent: number; delivered: number; failed: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      result.push({
        date,
        sent: trends[date]?.sent || 0,
        delivered: trends[date]?.delivered || 0,
        failed: trends[date]?.failed || 0,
      });
    }

    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification trends', { error });
    throw new DatabaseError('Failed to fetch notification trends', { error });
  }
}

/**
 * Get top performing notification types
 */
export async function getTopNotificationTypes(limit: number = 10): Promise<Array<{
  type: NotificationType;
  sent: number;
  delivered: number;
  deliveryRate: number;
}>> {
  await validateAnalyticsPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, status')
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to fetch top notification types', { error });
      throw new DatabaseError('Failed to fetch top notification types', { error });
    }

    const notifications = data || [];

    // Group by type
    const byType: Record<string, { sent: number; delivered: number }> = {};

    notifications.forEach((n: any) => {
      if (!byType[n.type]) {
        byType[n.type] = { sent: 0, delivered: 0 };
      }

      if (n.status === 'sent' || n.status === 'delivered' || n.status === 'read') {
        byType[n.type].sent++;
      }
      if (n.status === 'delivered' || n.status === 'read') {
        byType[n.type].delivered++;
      }
    });

    // Calculate delivery rates and sort
    const result = Object.entries(byType).map(([type, stats]) => ({
      type: type as NotificationType,
      sent: stats.sent,
      delivered: stats.delivered,
      deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
    }));

    result.sort((a, b) => b.sent - a.sent);

    return result.slice(0, limit);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching top notification types', { error });
    throw new DatabaseError('Failed to fetch top notification types', { error });
  }
}

/**
 * Get channel performance
 */
export async function getChannelPerformance(): Promise<Array<{
  channel: NotificationChannel;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}>> {
  await validateAnalyticsPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('channel, status')
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to fetch channel performance', { error });
      throw new DatabaseError('Failed to fetch channel performance', { error });
    }

    const deliveries = data || [];

    // Group by channel
    const byChannel: Record<string, { sent: number; delivered: number; failed: number }> = {};

    deliveries.forEach((d: any) => {
      if (!byChannel[d.channel]) {
        byChannel[d.channel] = { sent: 0, delivered: 0, failed: 0 };
      }

      byChannel[d.channel].sent++;
      if (d.status === 'delivered' || d.status === 'read') {
        byChannel[d.channel].delivered++;
      }
      if (d.status === 'failed' || d.status === 'bounced') {
        byChannel[d.channel].failed++;
      }
    });

    // Calculate delivery rates
    return Object.entries(byChannel).map(([channel, stats]) => ({
      channel: channel as NotificationChannel,
      sent: stats.sent,
      delivered: stats.delivered,
      failed: stats.failed,
      deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
    }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching channel performance', { error });
    throw new DatabaseError('Failed to fetch channel performance', { error });
  }
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagementMetrics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  averageNotificationsPerUser: number;
  mostEngagedUsers: Array<{
    userId: string;
    notificationCount: number;
    readRate: number;
  }>;
}> {
  await validateAnalyticsPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get total notifications per user
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('user_id, status')
      .eq('clinic_id', clinicId)
      .not('user_id', 'is', null);

    if (notifError) {
      logger.error('Failed to fetch user engagement metrics', { error: notifError });
      throw new DatabaseError('Failed to fetch user engagement metrics', { error: notifError });
    }

    const byUser: Record<string, { total: number; read: number }> = {};

    (notifications || []).forEach((n: any) => {
      if (!byUser[n.user_id]) {
        byUser[n.user_id] = { total: 0, read: 0 };
      }
      byUser[n.user_id].total++;
      if (n.status === 'read') {
        byUser[n.user_id].read++;
      }
    });

    const totalUsers = Object.keys(byUser).length;
    const activeUsers = Object.values(byUser).filter(u => u.total > 0).length;
    const totalNotifications = Object.values(byUser).reduce((sum, u) => sum + u.total, 0);
    const averageNotificationsPerUser = totalUsers > 0 ? totalNotifications / totalUsers : 0;

    // Get most engaged users
    const mostEngagedUsers = Object.entries(byUser)
      .map(([userId, stats]) => ({
        userId,
        notificationCount: stats.total,
        readRate: stats.total > 0 ? (stats.read / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.notificationCount - a.notificationCount)
      .slice(0, 10);

    return {
      totalUsers,
      activeUsers,
      averageNotificationsPerUser,
      mostEngagedUsers,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching user engagement metrics', { error });
    throw new DatabaseError('Failed to fetch user engagement metrics', { error });
  }
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(startDate?: string, endDate?: string): Promise<{
  summary: NotificationAnalytics;
  trends: Array<{ date: string; sent: number; delivered: number; failed: number }>;
  topTypes: Array<{ type: NotificationType; sent: number; delivered: number; deliveryRate: number }>;
  channelPerformance: Array<{ channel: NotificationChannel; sent: number; delivered: number; failed: number; deliveryRate: number }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageNotificationsPerUser: number;
    mostEngagedUsers: Array<{ userId: string; notificationCount: number; readRate: number }>;
  };
  generatedAt: string;
}> {
  const [summary, trends, topTypes, channelPerformance, userEngagement] = await Promise.all([
    getNotificationAnalytics(startDate, endDate),
    getNotificationTrends(30),
    getTopNotificationTypes(10),
    getChannelPerformance(),
    getUserEngagementMetrics(),
  ]);

  return {
    summary,
    trends,
    topTypes,
    channelPerformance,
    userEngagement,
    generatedAt: new Date().toISOString(),
  };
}
