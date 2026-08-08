import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Logging Manager
// Platform-level logging and log management
// ============================================================================

/**
 * Log entry interface
 */
export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  tenantId?: string;
  service: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Log filter options
 */
export interface LogFilter {
  level?: 'debug' | 'info' | 'warn' | 'error';
  service?: string;
  userId?: string;
  tenantId?: string;
  from?: string;
  to?: string;
  search?: string;
}

/**
 * Log statistics
 */
export interface LogStatistics {
  total: number;
  byLevel: Record<string, number>;
  byService: Record<string, number>;
  timeRange: { from: string; to: string };
}

/**
 * Write a log entry
 */
export async function writeLog(data: {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  service?: string;
  userId?: string;
  tenantId?: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const logId = `log-${Date.now()}`;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('platform_logs')
      .insert({
        id: logId,
        level: data.level,
        message: data.message,
        context: data.context || {},
        user_id: data.userId || null,
        tenant_id: data.tenantId || null,
        service: data.service || 'platform',
        timestamp: now,
        metadata: {},
      });

    if (error) {
      // Log to console if database write fails
      console.error(`[LOG WRITE FAILED] ${data.level.toUpperCase()}: ${data.message}`, { error });
    }
  } catch (error) {
    console.error('Failed to write log', { error, data });
  }
}

/**
 * Get log entries
 */
export async function getLogs(filter: LogFilter, options: {
  page?: number;
  pageSize?: number;
}): Promise<{ logs: LogEntry[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 100 } = options;
    const { level, service, userId, tenantId, from, to, search } = filter;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('platform_logs')
      .select('*', { count: 'exact' });

    if (level) {
      query = query.eq('level', level);
    }

    if (service) {
      query = query.eq('service', service);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: logs, error, count } = await query
      .range(fromIndex, toIndex)
      .order('timestamp', { ascending: false });

    if (error) {
      logger.error('Failed to fetch logs', { error });
      throw new DatabaseError('Failed to fetch logs', { error });
    }

    return {
      logs: (logs || []) as LogEntry[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching logs', { error });
    throw new DatabaseError('Failed to fetch logs', { error });
  }
}

/**
 * Get log by ID
 */
export async function getLog(logId: string): Promise<LogEntry> {
  try {
    const supabase = getSupabaseClient();

    const { data: log, error } = await supabase
      .from('platform_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (error) {
      logger.error('Failed to fetch log', { error, logId });
      throw new DatabaseError('Failed to fetch log', { error });
    }

    if (!log) {
      throw new NotFoundError('Log not found');
    }

    return log as LogEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching log', { error, logId });
    throw new DatabaseError('Failed to fetch log', { error });
  }
}

/**
 * Delete log
 */
export async function deleteLog(logId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.LOGS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('platform_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      logger.error('Failed to delete log', { error, logId });
      throw new DatabaseError('Failed to delete log', { error });
    }

    logger.info('Log deleted', { logId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting log', { error, logId });
    throw new DatabaseError('Failed to delete log', { error });
  }
}

/**
 * Delete old logs
 */
export async function deleteOldLogs(daysOld: number = 30): Promise<number> {
  try {
    await validatePlatformDeletePermission(PlatformResource.LOGS);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('platform_logs')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to delete old logs', { error, daysOld });
      throw new DatabaseError('Failed to delete old logs', { error });
    }

    logger.info('Old logs deleted', { daysOld });

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old logs', { error, daysOld });
    throw new DatabaseError('Failed to delete old logs', { error });
  }
}

/**
 * Get log statistics
 */
export async function getLogStatistics(options: {
  from?: string;
  to?: string;
  service?: string;
}): Promise<LogStatistics> {
  try {
    const { from, to, service } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('platform_logs')
      .select('level, service, timestamp');

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    if (service) {
      query = query.eq('service', service);
    }

    const { data: logs } = await query;

    if (!logs || logs.length === 0) {
      return {
        total: 0,
        byLevel: {},
        byService: {},
        timeRange: { from: from || new Date().toISOString(), to: to || new Date().toISOString() },
      };
    }

    const byLevel: Record<string, number> = {};
    const byService: Record<string, number> = {};

    for (const log of logs) {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byService[log.service] = (byService[log.service] || 0) + 1;
    }

    return {
      total: logs.length,
      byLevel,
      byService,
      timeRange: {
        from: from || new Date().toISOString(),
        to: to || new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Failed to get log statistics', { error });
    throw new DatabaseError('Failed to get log statistics', { error });
  }
}

/**
 * Get error logs
 */
export async function getErrorLogs(options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: LogEntry[]; total: number; page: number; pageSize: number }> {
  return getLogs({ level: 'error', from: options.from, to: options.to }, options);
}

/**
 * Get logs by service
 */
export async function getLogsByService(service: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: LogEntry[]; total: number; page: number; pageSize: number }> {
  return getLogs({ service, from: options.from, to: options.to }, options);
}

/**
 * Get logs by user
 */
export async function getLogsByUser(userId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: LogEntry[]; total: number; page: number; pageSize: number }> {
  return getLogs({ userId, from: options.from, to: options.to }, options);
}

/**
 * Get logs by tenant
 */
export async function getLogsByTenant(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: LogEntry[]; total: number; page: number; pageSize: number }> {
  return getLogs({ tenantId, from: options.from, to: options.to }, options);
}

/**
 * Search logs
 */
export async function searchLogs(searchTerm: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: LogEntry[]; total: number; page: number; pageSize: number }> {
  return getLogs({ search: searchTerm, from: options.from, to: options.to }, options);
}

/**
 * Export logs
 */
export async function exportLogs(filter: LogFilter): Promise<string> {
  try {
    const { logs } = await getLogs(filter, { pageSize: 10000 });
    return JSON.stringify(logs, null, 2);
  } catch (error) {
    logger.error('Failed to export logs', { error });
    throw new DatabaseError('Failed to export logs', { error });
  }
}

/**
 * Get log levels
 */
export function getLogLevels(): Array<{ value: string; label: string; color: string }> {
  return [
    { value: 'debug', label: 'Debug', color: 'gray' },
    { value: 'info', label: 'Info', color: 'blue' },
    { value: 'warn', label: 'Warning', color: 'yellow' },
    { value: 'error', label: 'Error', color: 'red' },
  ];
}

/**
 * Get recent logs
 */
export async function getRecentLogs(limit: number = 50): Promise<LogEntry[]> {
  try {
    const { logs } = await getLogs({}, { page: 1, pageSize: limit });
    return logs;
  } catch (error) {
    logger.error('Failed to get recent logs', { error });
    throw new DatabaseError('Failed to get recent logs', { error });
  }
}

/**
 * Platform logger wrapper
 */
export const platformLogger = {
  debug: (message: string, context?: Record<string, unknown>, service?: string) => {
    logger.debug(message, context);
    writeLog({ level: 'debug', message, context, service });
  },
  info: (message: string, context?: Record<string, unknown>, service?: string) => {
    logger.info(message, context);
    writeLog({ level: 'info', message, context, service });
  },
  warn: (message: string, context?: Record<string, unknown>, service?: string) => {
    logger.warn(message, context);
    writeLog({ level: 'warn', message, context, service });
  },
  error: (message: string, context?: Record<string, unknown>, service?: string) => {
    logger.error(message, context);
    writeLog({ level: 'error', message, context, service });
  },
};

/**
 * Create a service-specific logger
 */
export function createServiceLogger(serviceName: string): typeof platformLogger {
  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      platformLogger.debug(message, { ...context, service: serviceName }, serviceName);
    },
    info: (message: string, context?: Record<string, unknown>) => {
      platformLogger.info(message, { ...context, service: serviceName }, serviceName);
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      platformLogger.warn(message, { ...context, service: serviceName }, serviceName);
    },
    error: (message: string, context?: Record<string, unknown>) => {
      platformLogger.error(message, { ...context, service: serviceName }, serviceName);
    },
  };
}

/**
 * Get log aggregation
 */
export async function getLogAggregation(options: {
  from?: string;
  to?: string;
  groupBy?: 'level' | 'service' | 'hour' | 'day';
}): Promise<Record<string, number>> {
  try {
    const { from, to, groupBy = 'level' } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('platform_logs')
      .select('*');

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    const { data: logs } = await query;

    if (!logs || logs.length === 0) {
      return {};
    }

    const aggregation: Record<string, number> = {};

    for (const log of logs) {
      let key: string;
      
      switch (groupBy) {
        case 'level':
          key = log.level;
          break;
        case 'service':
          key = log.service;
          break;
        case 'hour':
          key = new Date(log.timestamp).toISOString().slice(0, 13);
          break;
        case 'day':
          key = new Date(log.timestamp).toISOString().slice(0, 10);
          break;
        default:
          key = log.level;
      }

      aggregation[key] = (aggregation[key] || 0) + 1;
    }

    return aggregation;
  } catch (error) {
    logger.error('Failed to get log aggregation', { error });
    throw new DatabaseError('Failed to get log aggregation', { error });
  }
}
