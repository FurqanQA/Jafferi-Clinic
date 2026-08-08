import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Analytics Manager
// Platform analytics and reporting
// ============================================================================

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventData: Record<string, unknown>;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Track analytics event
 */
export async function trackEvent(data: {
  eventType: string;
  eventData: Record<string, unknown>;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AnalyticsEvent> {
  try {
    const supabase = getSupabaseClient();

    const eventId = `event-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: event, error } = await supabase
      .from('analytics_events')
      .insert({
        id: eventId,
        event_type: data.eventType,
        event_data: data.eventData,
        user_id: data.userId || null,
        tenant_id: data.tenantId || null,
        session_id: data.sessionId || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        timestamp: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to track analytics event', { error, data });
      throw new DatabaseError('Failed to track analytics event', { error });
    }

    return event as AnalyticsEvent;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error tracking analytics event', { error, data });
    throw new DatabaseError('Failed to track analytics event', { error });
  }
}

/**
 * Get analytics events
 */
export async function getAnalyticsEvents(options: {
  page?: number;
  pageSize?: number;
  eventType?: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  from?: string;
  to?: string;
}): Promise<{ events: AnalyticsEvent[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, eventType, userId, tenantId, sessionId, from, to } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact' });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: events, error, count } = await query
      .range(fromIndex, toIndex)
      .order('timestamp', { ascending: false });

    if (error) {
      logger.error('Failed to get analytics events', { error });
      throw new DatabaseError('Failed to get analytics events', { error });
    }

    return {
      events: (events || []) as AnalyticsEvent[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error getting analytics events', { error });
    throw new DatabaseError('Failed to get analytics events', { error });
  }
}

/**
 * Get event statistics
 */
export async function getEventStatistics(options: {
  from?: string;
  to?: string;
  tenantId?: string;
}): Promise<{
  totalEvents: number;
  byEventType: Record<string, number>;
  uniqueUsers: number;
  uniqueTenants: number;
}> {
  try {
    const { from, to, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('analytics_events')
      .select('event_type, user_id, tenant_id');

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: events } = await query;

    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        byEventType: {},
        uniqueUsers: 0,
        uniqueTenants: 0,
      };
    }

    const byEventType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueTenants = new Set<string>();

    for (const event of events) {
      byEventType[event.event_type] = (byEventType[event.event_type] || 0) + 1;
      if (event.user_id) uniqueUsers.add(event.user_id);
      if (event.tenant_id) uniqueTenants.add(event.tenant_id);
    }

    return {
      totalEvents: events.length,
      byEventType,
      uniqueUsers: uniqueUsers.size,
      uniqueTenants: uniqueTenants.size,
    };
  } catch (error) {
    logger.error('Failed to get event statistics', { error });
    throw new DatabaseError('Failed to get event statistics', { error });
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string, days: number = 30): Promise<{
  totalEvents: number;
  byEventType: Record<string, number>;
  lastActivity: string | null;
}> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { events } = await getAnalyticsEvents({ userId, from, pageSize: 10000 });

    const byEventType: Record<string, number> = {};
    let lastActivity: string | null = null;

    for (const event of events) {
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
      if (!lastActivity || event.timestamp > lastActivity) {
        lastActivity = event.timestamp;
      }
    }

    return {
      totalEvents: events.length,
      byEventType,
      lastActivity,
    };
  } catch (error) {
    logger.error('Failed to get user activity summary', { error, userId });
    throw new DatabaseError('Failed to get user activity summary', { error });
  }
}

/**
 * Get tenant activity summary
 */
export async function getTenantActivitySummary(tenantId: string, days: number = 30): Promise<{
  totalEvents: number;
  byEventType: Record<string, number>;
  uniqueUsers: number;
}> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { events } = await getAnalyticsEvents({ tenantId, from, pageSize: 10000 });

    const byEventType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const event of events) {
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
      if (event.userId) uniqueUsers.add(event.userId);
    }

    return {
      totalEvents: events.length,
      byEventType,
      uniqueUsers: uniqueUsers.size,
    };
  } catch (error) {
    logger.error('Failed to get tenant activity summary', { error, tenantId });
    throw new DatabaseError('Failed to get tenant activity summary', { error });
  }
}

/**
 * Get daily event counts
 */
export async function getDailyEventCounts(days: number = 30): Promise<Array<{
  date: string;
  count: number;
}>> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getSupabaseClient();

    const { data: events } = await supabase
      .from('analytics_events')
      .select('timestamp')
      .gte('timestamp', from);

    if (!events || events.length === 0) {
      return [];
    }

    const dailyCounts: Record<string, number> = {};

    for (const event of events) {
      const date = event.timestamp.split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    logger.error('Failed to get daily event counts', { error });
    throw new DatabaseError('Failed to get daily event counts', { error });
  }
}

/**
 * Get top event types
 */
export async function getTopEventTypes(limit: number = 10): Promise<Array<{
  eventType: string;
  count: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type');

    if (!events || events.length === 0) {
      return [];
    }

    const eventTypeCounts: Record<string, number> = {};

    for (const event of events) {
      eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
    }

    return Object.entries(eventTypeCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    logger.error('Failed to get top event types', { error });
    throw new DatabaseError('Failed to get top event types', { error });
  }
}

/**
 * Get real-time analytics
 */
export async function getRealTimeAnalytics(minutes: number = 5): Promise<{
  eventsInPeriod: number;
  uniqueUsers: number;
  averageEventsPerMinute: number;
}> {
  try {
    const from = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const { events } = await getAnalyticsEvents({ from, pageSize: 10000 });

    const uniqueUsers = new Set<string>();

    for (const event of events) {
      if (event.userId) uniqueUsers.add(event.userId);
    }

    return {
      eventsInPeriod: events.length,
      uniqueUsers: uniqueUsers.size,
      averageEventsPerMinute: events.length / minutes,
    };
  } catch (error) {
    logger.error('Failed to get real-time analytics', { error });
    throw new DatabaseError('Failed to get real-time analytics', { error });
  }
}

/**
 * Delete old analytics events
 */
export async function deleteOldEvents(daysToKeep: number = 90): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.ANALYTICS);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('analytics_events')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to delete old analytics events', { error });
      throw new DatabaseError('Failed to delete old analytics events', { error });
    }

    logger.info('Old analytics events deleted', { daysToKeep });

    return 0;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old analytics events', { error });
    throw new DatabaseError('Failed to delete old analytics events', { error });
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboardData(): Promise<{
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  uniqueUsersToday: number;
  uniqueUsersThisWeek: number;
  uniqueUsersThisMonth: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
}> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
      getEventStatistics({}),
      getEventStatistics({ from: todayStart }),
      getEventStatistics({ from: weekStart }),
      getEventStatistics({ from: monthStart }),
    ]);

    const topEventTypes = await getTopEventTypes(5);

    return {
      totalEvents: totalStats.totalEvents,
      eventsToday: todayStats.totalEvents,
      eventsThisWeek: weekStats.totalEvents,
      eventsThisMonth: monthStats.totalEvents,
      uniqueUsersToday: todayStats.uniqueUsers,
      uniqueUsersThisWeek: weekStats.uniqueUsers,
      uniqueUsersThisMonth: monthStats.uniqueUsers,
      topEventTypes,
    };
  } catch (error) {
    logger.error('Failed to get analytics dashboard data', { error });
    throw new DatabaseError('Failed to get analytics dashboard data', { error });
  }
}
