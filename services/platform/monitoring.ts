import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Monitoring Manager
// System monitoring and alerting
// ============================================================================

/**
 * Monitor interface
 */
export interface Monitor {
  id: string;
  name: string;
  description: string;
  type: 'http' | 'tcp' | 'icmp' | 'custom';
  target: string;
  interval: number;
  timeout: number;
  threshold: number;
  isActive: boolean;
  lastCheck: string | null;
  status: 'up' | 'down' | 'degraded';
  uptime: number;
  downtime: number;
  responseTime: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Monitor Check interface
 */
export interface MonitorCheck {
  id: string;
  monitorId: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode: number | null;
  message: string | null;
  checkedAt: string;
}

/**
 * Create a monitor
 */
export async function createMonitor(data: {
  name: string;
  description: string;
  type: 'http' | 'tcp' | 'icmp' | 'custom';
  target: string;
  interval?: number;
  timeout?: number;
  threshold?: number;
  metadata?: Record<string, unknown>;
}): Promise<Monitor> {
  try {
    await validatePlatformWritePermission(PlatformResource.MONITORING);

    const supabase = getSupabaseClient();

    const monitorId = `monitor-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: monitor, error } = await supabase
      .from('monitors')
      .insert({
        id: monitorId,
        name: data.name,
        description: data.description,
        type: data.type,
        target: data.target,
        interval: data.interval || 60000,
        timeout: data.timeout || 10000,
        threshold: data.threshold || 3,
        is_active: true,
        last_check: null,
        status: 'up',
        uptime: 0,
        downtime: 0,
        response_time: null,
        metadata: data.metadata || {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create monitor', { error, data });
      throw new DatabaseError('Failed to create monitor', { error });
    }

    logger.info('Monitor created successfully', { monitorId, name: data.name });

    // Invalidate cache
    cache.delete(`monitor:${monitorId}`);
    cache.delete('monitors:all');

    return monitor as Monitor;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating monitor', { error, data });
    throw new DatabaseError('Failed to create monitor', { error });
  }
}

/**
 * Update monitor
 */
export async function updateMonitor(monitorId: string, data: {
  name?: string;
  description?: string;
  target?: string;
  interval?: number;
  timeout?: number;
  threshold?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<Monitor> {
  try {
    await validatePlatformWritePermission(PlatformResource.MONITORING);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target !== undefined) updateData.target = data.target;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.timeout !== undefined) updateData.timeout = data.timeout;
    if (data.threshold !== undefined) updateData.threshold = data.threshold;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: monitor, error } = await supabase
      .from('monitors')
      .update(updateData)
      .eq('id', monitorId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update monitor', { error, monitorId });
      throw new DatabaseError('Failed to update monitor', { error });
    }

    if (!monitor) {
      throw new NotFoundError('Monitor not found');
    }

    logger.info('Monitor updated successfully', { monitorId });

    // Invalidate cache
    cache.delete(`monitor:${monitorId}`);
    cache.delete('monitors:all');

    return monitor as Monitor;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating monitor', { error, monitorId });
    throw new DatabaseError('Failed to update monitor', { error });
  }
}

/**
 * Delete monitor
 */
export async function deleteMonitor(monitorId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.MONITORING);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('monitors')
      .delete()
      .eq('id', monitorId);

    if (error) {
      logger.error('Failed to delete monitor', { error, monitorId });
      throw new DatabaseError('Failed to delete monitor', { error });
    }

    logger.info('Monitor deleted successfully', { monitorId });

    // Invalidate cache
    cache.delete(`monitor:${monitorId}`);
    cache.delete('monitors:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting monitor', { error, monitorId });
    throw new DatabaseError('Failed to delete monitor', { error });
  }
}

/**
 * Get monitor by ID
 */
export async function getMonitor(monitorId: string): Promise<Monitor> {
  try {
    const cached = cache.get<Monitor>(`monitor:${monitorId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: monitor, error } = await supabase
      .from('monitors')
      .select('*')
      .eq('id', monitorId)
      .single();

    if (error) {
      logger.error('Failed to fetch monitor', { error, monitorId });
      throw new DatabaseError('Failed to fetch monitor', { error });
    }

    if (!monitor) {
      throw new NotFoundError('Monitor not found');
    }

    cache.set(`monitor:${monitorId}`, monitor, cacheHelpers.ttl.SHORT);

    return monitor as Monitor;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching monitor', { error, monitorId });
    throw new DatabaseError('Failed to fetch monitor', { error });
  }
}

/**
 * List monitors
 */
export async function listMonitors(options: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  type?: 'http' | 'tcp' | 'icmp' | 'custom';
  status?: 'up' | 'down' | 'degraded';
}): Promise<{ monitors: Monitor[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isActive, type, status } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('monitors')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: monitors, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list monitors', { error });
      throw new DatabaseError('Failed to list monitors', { error });
    }

    return {
      monitors: (monitors || []) as Monitor[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing monitors', { error });
    throw new DatabaseError('Failed to list monitors', { error });
  }
}

/**
 * Perform monitor check
 */
export async function performMonitorCheck(monitorId: string): Promise<MonitorCheck> {
  try {
    const monitor = await getMonitor(monitorId);

    // Placeholder for actual check implementation
    // In production, this would perform actual HTTP/TCP/ICMP checks
    const checkId = `check-${Date.now()}`;
    const now = new Date().toISOString();

    const supabase = getSupabaseClient();

    const { data: check, error } = await supabase
      .from('monitor_checks')
      .insert({
        id: checkId,
        monitor_id: monitorId,
        status: 'up',
        response_time: Math.random() * 1000,
        status_code: 200,
        message: 'Check successful',
        checked_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create monitor check', { error, monitorId });
      throw new DatabaseError('Failed to create monitor check', { error });
    }

    // Update monitor status
    await updateMonitorStatus(monitorId, {
      status: 'up',
      lastCheck: now,
      responseTime: check.response_time,
    });

    logger.info('Monitor check performed', { checkId, monitorId });

    return check as MonitorCheck;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error performing monitor check', { error, monitorId });
    throw new DatabaseError('Failed to perform monitor check', { error });
  }
}

/**
 * Update monitor status
 */
async function updateMonitorStatus(monitorId: string, data: {
  status: 'up' | 'down' | 'degraded';
  lastCheck: string;
  responseTime: number;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const monitor = await getMonitor(monitorId);

    const updateData: Record<string, unknown> = {
      status: data.status,
      last_check: data.lastCheck,
      response_time: data.responseTime,
      updated_at: new Date().toISOString(),
    };

    if (data.status === 'up') {
      updateData.uptime = monitor.uptime + 1;
    } else {
      updateData.downtime = monitor.downtime + 1;
    }

    const { error } = await supabase
      .from('monitors')
      .update(updateData)
      .eq('id', monitorId);

    if (error) {
      logger.error('Failed to update monitor status', { error, monitorId });
      throw new DatabaseError('Failed to update monitor status', { error });
    }

    cache.delete(`monitor:${monitorId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating monitor status', { error, monitorId });
    throw new DatabaseError('Failed to update monitor status', { error });
  }
}

/**
 * Get monitor checks
 */
export async function getMonitorChecks(monitorId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'up' | 'down' | 'degraded';
  from?: string;
  to?: string;
}): Promise<{ checks: MonitorCheck[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, from, to } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('monitor_checks')
      .select('*', { count: 'exact' })
      .eq('monitor_id', monitorId);

    if (status) {
      query = query.eq('status', status);
    }

    if (from) {
      query = query.gte('checked_at', from);
    }

    if (to) {
      query = query.lte('checked_at', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: checks, error, count } = await query
      .range(fromIndex, toIndex)
      .order('checked_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch monitor checks', { error, monitorId });
      throw new DatabaseError('Failed to fetch monitor checks', { error });
    }

    return {
      checks: (checks || []) as MonitorCheck[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching monitor checks', { error, monitorId });
    throw new DatabaseError('Failed to fetch monitor checks', { error });
  }
}

/**
 * Get active monitors
 */
export async function getActiveMonitors(): Promise<Monitor[]> {
  try {
    const { monitors } = await listMonitors({ isActive: true, pageSize: 100 });
    return monitors;
  } catch (error) {
    logger.error('Failed to get active monitors', { error });
    throw new DatabaseError('Failed to get active monitors', { error });
  }
}

/**
 * Get monitors by status
 */
export async function getMonitorsByStatus(status: 'up' | 'down' | 'degraded'): Promise<Monitor[]> {
  try {
    const { monitors } = await listMonitors({ status, pageSize: 100 });
    return monitors;
  } catch (error) {
    logger.error('Failed to get monitors by status', { error });
    throw new DatabaseError('Failed to get monitors by status', { error });
  }
}

/**
 * Get monitor statistics
 */
export async function getMonitorStatistics(monitorId: string): Promise<{
  totalChecks: number;
  upChecks: number;
  downChecks: number;
  degradedChecks: number;
  averageResponseTime: number;
  uptime: number;
  downtime: number;
  uptimePercentage: number;
}> {
  try {
    const monitor = await getMonitor(monitorId);
    const { checks } = await getMonitorChecks(monitorId, { pageSize: 1000 });

    const upChecks = checks.filter(c => c.status === 'up').length;
    const downChecks = checks.filter(c => c.status === 'down').length;
    const degradedChecks = checks.filter(c => c.status === 'degraded').length;

    const totalResponseTime = checks.reduce((sum, c) => sum + c.responseTime, 0);
    const averageResponseTime = checks.length > 0 ? totalResponseTime / checks.length : 0;

    const totalChecks = checks.length;
    const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;

    return {
      totalChecks,
      upChecks,
      downChecks,
      degradedChecks,
      averageResponseTime,
      uptime: monitor.uptime,
      downtime: monitor.downtime,
      uptimePercentage,
    };
  } catch (error) {
    logger.error('Failed to get monitor statistics', { error, monitorId });
    throw new DatabaseError('Failed to get monitor statistics', { error });
  }
}

/**
 * Get overall monitoring statistics
 */
export async function getOverallStatistics(): Promise<{
  totalMonitors: number;
  activeMonitors: number;
  upMonitors: number;
  downMonitors: number;
  degradedMonitors: number;
  averageResponseTime: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: monitors } = await supabase
      .from('monitors')
      .select('is_active, status, response_time');

    if (!monitors || monitors.length === 0) {
      return {
        totalMonitors: 0,
        activeMonitors: 0,
        upMonitors: 0,
        downMonitors: 0,
        degradedMonitors: 0,
        averageResponseTime: 0,
      };
    }

    const stats = {
      totalMonitors: monitors.length,
      activeMonitors: 0,
      upMonitors: 0,
      downMonitors: 0,
      degradedMonitors: 0,
      averageResponseTime: 0,
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const monitor of monitors) {
      if (monitor.is_active) stats.activeMonitors++;
      
      switch (monitor.status) {
        case 'up':
          stats.upMonitors++;
          break;
        case 'down':
          stats.downMonitors++;
          break;
        case 'degraded':
          stats.degradedMonitors++;
          break;
      }

      if (monitor.response_time) {
        totalResponseTime += monitor.response_time;
        responseTimeCount++;
      }
    }

    stats.averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

    return stats;
  } catch (error) {
    logger.error('Failed to get overall statistics', { error });
    throw new DatabaseError('Failed to get overall statistics', { error });
  }
}

/**
 * Activate monitor
 */
export async function activateMonitor(monitorId: string): Promise<Monitor> {
  return updateMonitor(monitorId, { isActive: true });
}

/**
 * Deactivate monitor
 */
export async function deactivateMonitor(monitorId: string): Promise<Monitor> {
  return updateMonitor(monitorId, { isActive: false });
}

/**
 * Get monitors needing attention
 */
export async function getMonitorsNeedingAttention(): Promise<Monitor[]> {
  try {
    const { monitors } = await listMonitors({ 
      status: 'down', 
      pageSize: 100 
    });
    return monitors;
  } catch (error) {
    logger.error('Failed to get monitors needing attention', { error });
    throw new DatabaseError('Failed to get monitors needing attention', { error });
  }
}
