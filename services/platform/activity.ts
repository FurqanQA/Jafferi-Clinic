import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Activity Manager
// User activity tracking and analytics
// ============================================================================

/**
 * Activity entry interface
 */
export interface ActivityEntry {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Activity filter options
 */
export interface ActivityFilter {
  userId?: string;
  tenantId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

/**
 * Record user activity
 */
export async function recordActivity(data: {
  userId: string;
  tenantId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ActivityEntry> {
  try {
    const supabase = getSupabaseClient();

    const activityId = `activity-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: entry, error } = await supabase
      .from('user_activities')
      .insert({
        id: activityId,
        user_id: data.userId,
        tenant_id: data.tenantId,
        action: data.action,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
        metadata: data.metadata || {},
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        timestamp: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to record activity', { error, data });
      throw new DatabaseError('Failed to record activity', { error });
    }

    logger.debug('Activity recorded', { activityId, action: data.action });

    // Invalidate cache
    cache.delete(`activity:${activityId}`);
    cache.delete(`activity:user:${data.userId}`);
    cache.delete(`activity:tenant:${data.tenantId}`);

    return entry as ActivityEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording activity', { error, data });
    throw new DatabaseError('Failed to record activity', { error });
  }
}

/**
 * Get activity entry by ID
 */
export async function getActivityEntry(activityId: string): Promise<ActivityEntry> {
  try {
    const supabase = getSupabaseClient();

    const { data: entry, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      logger.error('Failed to fetch activity entry', { error, activityId });
      throw new DatabaseError('Failed to fetch activity entry', { error });
    }

    if (!entry) {
      throw new NotFoundError('Activity entry not found');
    }

    return entry as ActivityEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching activity entry', { error, activityId });
    throw new DatabaseError('Failed to fetch activity entry', { error });
  }
}

/**
 * List activity entries
 */
export async function listActivities(filter: ActivityFilter, options: {
  page?: number;
  pageSize?: number;
}): Promise<{ activities: ActivityEntry[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 50 } = options;
    const { userId, tenantId, action, entityType, entityId, from, to } = filter;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('user_activities')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: activities, error, count } = await query
      .range(fromIndex, toIndex)
      .order('timestamp', { ascending: false });

    if (error) {
      logger.error('Failed to list activities', { error });
      throw new DatabaseError('Failed to list activities', { error });
    }

    return {
      activities: (activities || []) as ActivityEntry[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing activities', { error });
    throw new DatabaseError('Failed to list activities', { error });
  }
}

/**
 * Get user activities
 */
export async function getUserActivities(userId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ activities: ActivityEntry[]; total: number; page: number; pageSize: number }> {
  return listActivities({ userId, from: options.from, to: options.to }, options);
}

/**
 * Get tenant activities
 */
export async function getTenantActivities(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ activities: ActivityEntry[]; total: number; page: number; pageSize: number }> {
  return listActivities({ tenantId, from: options.from, to: options.to }, options);
}

/**
 * Get activity statistics
 */
export async function getActivityStatistics(options: {
  from?: string;
  to?: string;
  tenantId?: string;
  userId?: string;
}): Promise<{
  total: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  uniqueUsers: number;
  uniqueTenants: number;
}> {
  try {
    const { from, to, tenantId, userId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('user_activities')
      .select('action, entity_type, user_id, tenant_id');

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: activities } = await query;

    if (!activities || activities.length === 0) {
      return {
        total: 0,
        byAction: {},
        byEntityType: {},
        uniqueUsers: 0,
        uniqueTenants: 0,
      };
    }

    const byAction: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueTenants = new Set<string>();

    for (const activity of activities) {
      byAction[activity.action] = (byAction[activity.action] || 0) + 1;
      if (activity.entity_type) {
        byEntityType[activity.entity_type] = (byEntityType[activity.entity_type] || 0) + 1;
      }
      uniqueUsers.add(activity.user_id);
      uniqueTenants.add(activity.tenant_id);
    }

    return {
      total: activities.length,
      byAction,
      byEntityType,
      uniqueUsers: uniqueUsers.size,
      uniqueTenants: uniqueTenants.size,
    };
  } catch (error) {
    logger.error('Failed to get activity statistics', { error });
    throw new DatabaseError('Failed to get activity statistics', { error });
  }
}

/**
 * Delete old activities
 */
export async function deleteOldActivities(daysOld: number = 90): Promise<number> {
  try {
    await validatePlatformDeletePermission(PlatformResource.LOGS);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('user_activities')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to delete old activities', { error, daysOld });
      throw new DatabaseError('Failed to delete old activities', { error });
    }

    logger.info('Old activities deleted', { daysOld });

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old activities', { error, daysOld });
    throw new DatabaseError('Failed to delete old activities', { error });
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit: number = 50): Promise<ActivityEntry[]> {
  try {
    const { activities } = await listActivities({}, { page: 1, pageSize: limit });
    return activities;
  } catch (error) {
    logger.error('Failed to get recent activities', { error });
    throw new DatabaseError('Failed to get recent activities', { error });
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string, days: number = 30): Promise<{
  totalActivities: number;
  actionsByType: Record<string, number>;
  mostActiveDay: string;
  averageActivitiesPerDay: number;
}> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { activities } = await listActivities({ userId, from }, { pageSize: 10000 });

    const actionsByType: Record<string, number> = {};
    const activitiesByDay: Record<string, number> = {};

    for (const activity of activities) {
      actionsByType[activity.action] = (actionsByType[activity.action] || 0) + 1;
      const day = activity.timestamp.split('T')[0];
      activitiesByDay[day] = (activitiesByDay[day] || 0) + 1;
    }

    let mostActiveDay = '';
    let maxActivities = 0;
    for (const [day, count] of Object.entries(activitiesByDay)) {
      if (count > maxActivities) {
        maxActivities = count;
        mostActiveDay = day;
      }
    }

    const averageActivitiesPerDay = activities.length / days;

    return {
      totalActivities: activities.length,
      actionsByType,
      mostActiveDay,
      averageActivitiesPerDay,
    };
  } catch (error) {
    logger.error('Failed to get user activity summary', { error });
    throw new DatabaseError('Failed to get user activity summary', { error });
  }
}

/**
 * Get tenant activity summary
 */
export async function getTenantActivitySummary(tenantId: string, days: number = 30): Promise<{
  totalActivities: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  averageActivitiesPerDay: number;
}> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { activities } = await listActivities({ tenantId, from }, { pageSize: 10000 });

    const actionsByType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const activity of activities) {
      actionsByType[activity.action] = (actionsByType[activity.action] || 0) + 1;
      uniqueUsers.add(activity.userId);
    }

    const topActions = Object.entries(actionsByType)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averageActivitiesPerDay = activities.length / days;

    return {
      totalActivities: activities.length,
      uniqueUsers: uniqueUsers.size,
      topActions,
      averageActivitiesPerDay,
    };
  } catch (error) {
    logger.error('Failed to get tenant activity summary', { error });
    throw new DatabaseError('Failed to get tenant activity summary', { error });
  }
}

/**
 * Activity helper for common actions
 */
export const activityHelper = {
  async logLogin(data: {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'login',
      ...data,
    });
  },

  async logLogout(data: {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'logout',
      ...data,
    });
  },

  async logView(data: {
    userId: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'view',
      ...data,
    });
  },

  async logCreate(data: {
    userId: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'create',
      ...data,
    });
  },

  async logUpdate(data: {
    userId: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'update',
      ...data,
    });
  },

  async logDelete(data: {
    userId: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'delete',
      ...data,
    });
  },

  async logExport(data: {
    userId: string;
    tenantId: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityEntry> {
    return recordActivity({
      action: 'export',
      ...data,
    });
  },
};

/**
 * Get activity trends
 */
export async function getActivityTrends(days: number = 30): Promise<Array<{
  date: string;
  count: number;
  uniqueUsers: number;
}>> {
  try {
    const trends: Array<{ date: string; count: number; uniqueUsers: number }> = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const from = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const to = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const { activities } = await listActivities({ from, to }, { pageSize: 10000 });
      const uniqueUsers = new Set(activities.map(a => a.userId));

      trends.push({
        date: from.split('T')[0],
        count: activities.length,
        uniqueUsers: uniqueUsers.size,
      });
    }

    return trends;
  } catch (error) {
    logger.error('Failed to get activity trends', { error });
    throw new DatabaseError('Failed to get activity trends', { error });
  }
}

/**
 * Get most active users
 */
export async function getMostActiveUsers(limit: number = 10, days: number = 30): Promise<Array<{
  userId: string;
  activityCount: number;
}>> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { activities } = await listActivities({ from }, { pageSize: 10000 });

    const userActivityCounts: Record<string, number> = {};
    for (const activity of activities) {
      userActivityCounts[activity.userId] = (userActivityCounts[activity.userId] || 0) + 1;
    }

    return Object.entries(userActivityCounts)
      .map(([userId, activityCount]) => ({ userId, activityCount }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, limit);
  } catch (error) {
    logger.error('Failed to get most active users', { error });
    throw new DatabaseError('Failed to get most active users', { error });
  }
}

/**
 * Get most active tenants
 */
export async function getMostActiveTenants(limit: number = 10, days: number = 30): Promise<Array<{
  tenantId: string;
  activityCount: number;
}>> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { activities } = await listActivities({ from }, { pageSize: 10000 });

    const tenantActivityCounts: Record<string, number> = {};
    for (const activity of activities) {
      tenantActivityCounts[activity.tenantId] = (tenantActivityCounts[activity.tenantId] || 0) + 1;
    }

    return Object.entries(tenantActivityCounts)
      .map(([tenantId, activityCount]) => ({ tenantId, activityCount }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, limit);
  } catch (error) {
    logger.error('Failed to get most active tenants', { error });
    throw new DatabaseError('Failed to get most active tenants', { error });
  }
}
