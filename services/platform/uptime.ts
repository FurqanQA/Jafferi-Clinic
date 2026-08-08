import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Uptime Manager
// Service uptime tracking and reporting
// ============================================================================

/**
 * Uptime record interface
 */
export interface UptimeRecord {
  id: string;
  service: string;
  status: 'up' | 'down';
  responseTime: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Uptime statistics
 */
export interface UptimeStatistics {
  service: string;
  totalChecks: number;
  upChecks: number;
  downChecks: number;
  uptimePercentage: number;
  averageResponseTime: number;
  lastCheck: string;
  lastStatus: 'up' | 'down';
  downtime: number;
}

/**
 * Record uptime check
 */
export async function recordUptimeCheck(data: {
  service: string;
  status: 'up' | 'down';
  responseTime: number;
  metadata?: Record<string, unknown>;
}): Promise<UptimeRecord> {
  try {
    const supabase = getSupabaseClient();

    const recordId = `uptime-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: record, error } = await supabase
      .from('uptime_records')
      .insert({
        id: recordId,
        service: data.service,
        status: data.status,
        response_time: data.responseTime,
        timestamp: now,
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to record uptime check', { error, data });
      throw new DatabaseError('Failed to record uptime check', { error });
    }

    logger.debug('Uptime check recorded', { recordId, service: data.service, status: data.status });

    // Invalidate cache
    cache.delete(`uptime:${data.service}`);
    cache.delete('uptime:all');

    return record as UptimeRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording uptime check', { error, data });
    throw new DatabaseError('Failed to record uptime check', { error });
  }
}

/**
 * Get uptime records for service
 */
export async function getUptimeRecords(service: string, options: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<UptimeRecord[]> {
  try {
    const { from, to, limit = 1000 } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('uptime_records')
      .select('*')
      .eq('service', service);

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    const { data: records, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch uptime records', { error, service });
      throw new DatabaseError('Failed to fetch uptime records', { error });
    }

    return (records || []) as UptimeRecord[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching uptime records', { error, service });
    throw new DatabaseError('Failed to fetch uptime records', { error });
  }
}

/**
 * Calculate uptime statistics for service
 */
export async function calculateUptimeStatistics(service: string, options: {
  from?: string;
  to?: string;
}): Promise<UptimeStatistics> {
  try {
    const records = await getUptimeRecords(service, options);

    if (records.length === 0) {
      return {
        service,
        totalChecks: 0,
        upChecks: 0,
        downChecks: 0,
        uptimePercentage: 0,
        averageResponseTime: 0,
        lastCheck: new Date().toISOString(),
        lastStatus: 'up',
        downtime: 0,
      };
    }

    const upChecks = records.filter(r => r.status === 'up').length;
    const downChecks = records.filter(r => r.status === 'down').length;
    const totalChecks = records.length;
    const uptimePercentage = (upChecks / totalChecks) * 100;

    const totalResponseTime = records.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalChecks;

    // Calculate downtime (assuming 1-minute intervals)
    const downtime = downChecks * 60; // in seconds

    const lastRecord = records[0];

    return {
      service,
      totalChecks,
      upChecks,
      downChecks,
      uptimePercentage,
      averageResponseTime,
      lastCheck: lastRecord.timestamp,
      lastStatus: lastRecord.status,
      downtime,
    };
  } catch (error) {
    logger.error('Failed to calculate uptime statistics', { error, service });
    throw new DatabaseError('Failed to calculate uptime statistics', { error });
  }
}

/**
 * Get all monitored services
 */
export async function getMonitoredServices(): Promise<string[]> {
  try {
    const cacheKey = 'uptime:services';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: records } = await supabase
      .from('uptime_records')
      .select('service');

    const services = new Set<string>();
    for (const record of records || []) {
      services.add(record.service);
    }

    const result = Array.from(services);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get monitored services', { error });
    throw new DatabaseError('Failed to get monitored services', { error });
  }
}

/**
 * Get overall uptime statistics
 */
export async function getOverallUptimeStatistics(): Promise<Record<string, UptimeStatistics>> {
  try {
    const services = await getMonitoredServices();
    const statistics: Record<string, UptimeStatistics> = {};

    for (const service of services) {
      statistics[service] = await calculateUptimeStatistics(service, {});
    }

    return statistics;
  } catch (error) {
    logger.error('Failed to get overall uptime statistics', { error });
    throw new DatabaseError('Failed to get overall uptime statistics', { error });
  }
}

/**
 * Get uptime percentage for time period
 */
export async function getUptimePercentage(service: string, hours: number = 24): Promise<number> {
  try {
    const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const stats = await calculateUptimeStatistics(service, { from, to });
    return stats.uptimePercentage;
  } catch (error) {
    logger.error('Failed to get uptime percentage', { error, service });
    throw new DatabaseError('Failed to get uptime percentage', { error });
  }
}

/**
 * Get downtime incidents
 */
export async function getDowntimeIncidents(service: string, options: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<UptimeRecord[]> {
  try {
    const records = await getUptimeRecords(service, options);
    return records.filter(r => r.status === 'down');
  } catch (error) {
    logger.error('Failed to get downtime incidents', { error, service });
    throw new DatabaseError('Failed to get downtime incidents', { error });
  }
}

/**
 * Delete old uptime records
 */
export async function deleteOldUptimeRecords(daysOld: number = 90): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.MONITORING);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('uptime_records')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to delete old uptime records', { error, daysOld });
      throw new DatabaseError('Failed to delete old uptime records', { error });
    }

    logger.info('Old uptime records deleted', { daysOld });

    // Invalidate cache
    cache.delete('uptime:all');
    cache.delete('uptime:services');

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old uptime records', { error, daysOld });
    throw new DatabaseError('Failed to delete old uptime records', { error });
  }
}

/**
 * Get uptime summary for dashboard
 */
export async function getUptimeSummary(): Promise<{
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  averageUptime: number;
}> {
  try {
    const statistics = await getOverallUptimeStatistics();
    const services = Object.values(statistics);

    const healthyServices = services.filter(s => s.uptimePercentage >= 99.9).length;
    const degradedServices = services.filter(s => s.uptimePercentage >= 95 && s.uptimePercentage < 99.9).length;
    const downServices = services.filter(s => s.uptimePercentage < 95).length;

    const totalUptime = services.reduce((sum, s) => sum + s.uptimePercentage, 0);
    const averageUptime = services.length > 0 ? totalUptime / services.length : 0;

    return {
      totalServices: services.length,
      healthyServices,
      degradedServices,
      downServices,
      averageUptime,
    };
  } catch (error) {
    logger.error('Failed to get uptime summary', { error });
    throw new DatabaseError('Failed to get uptime summary', { error });
  }
}

/**
 * Check service uptime
 */
export async function checkServiceUptime(service: string, checkFn: () => Promise<{ success: boolean; responseTime: number }>): Promise<UptimeRecord> {
  try {
    const result = await checkFn();
    
    return recordUptimeCheck({
      service,
      status: result.success ? 'up' : 'down',
      responseTime: result.responseTime,
    });
  } catch (error) {
    return recordUptimeCheck({
      service,
      status: 'down',
      responseTime: 0,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
  }
}

/**
 * Get uptime trends
 */
export async function getUptimeTrends(service: string, days: number = 30): Promise<Array<{
  date: string;
  uptimePercentage: number;
  checks: number;
}>> {
  try {
    const trends: Array<{ date: string; uptimePercentage: number; checks: number }> = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const from = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const to = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const stats = await calculateUptimeStatistics(service, { from, to });
      
      trends.push({
        date: from.split('T')[0],
        uptimePercentage: stats.uptimePercentage,
        checks: stats.totalChecks,
      });
    }

    return trends;
  } catch (error) {
    logger.error('Failed to get uptime trends', { error, service });
    throw new DatabaseError('Failed to get uptime trends', { error });
  }
}

/**
 * Get service health score
 */
export async function getServiceHealthScore(service: string): Promise<{
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  uptimePercentage: number;
  averageResponseTime: number;
}> {
  try {
    const stats = await calculateUptimeStatistics(service, {});
    
    let score = 0;
    
    // Uptime score (70% weight)
    if (stats.uptimePercentage >= 99.9) score += 70;
    else if (stats.uptimePercentage >= 99) score += 60;
    else if (stats.uptimePercentage >= 95) score += 50;
    else if (stats.uptimePercentage >= 90) score += 40;
    else score += 20;

    // Response time score (30% weight)
    if (stats.averageResponseTime < 100) score += 30;
    else if (stats.averageResponseTime < 200) score += 25;
    else if (stats.averageResponseTime < 500) score += 20;
    else if (stats.averageResponseTime < 1000) score += 15;
    else score += 10;

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      uptimePercentage: stats.uptimePercentage,
      averageResponseTime: stats.averageResponseTime,
    };
  } catch (error) {
    logger.error('Failed to get service health score', { error, service });
    throw new DatabaseError('Failed to get service health score', { error });
  }
}

/**
 * Get SLA compliance
 */
export async function getSLACompliance(service: string, slaUptime: number = 99.9): Promise<{
  isCompliant: boolean;
  currentUptime: number;
  slaUptime: number;
  gap: number;
}> {
  try {
    const stats = await calculateUptimeStatistics(service, {});
    const gap = stats.uptimePercentage - slaUptime;
    const isCompliant = stats.uptimePercentage >= slaUptime;

    return {
      isCompliant,
      currentUptime: stats.uptimePercentage,
      slaUptime,
      gap,
    };
  } catch (error) {
    logger.error('Failed to get SLA compliance', { error, service });
    throw new DatabaseError('Failed to get SLA compliance', { error });
  }
}
