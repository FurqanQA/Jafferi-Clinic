import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Alerts Manager
// Alert management and notification system
// ============================================================================

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  metadata: Record<string, unknown>;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Alert rule interface
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: string;
  condition: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  isEnabled: boolean;
  channels: string[];
  cooldown: number;
  lastTriggered: string | null;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create an alert
 */
export async function createAlert(data: {
  type: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  metadata?: Record<string, unknown>;
}): Promise<Alert> {
  try {
    const supabase = getSupabaseClient();

    const alertId = `alert-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        id: alertId,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        severity: data.severity || 'medium',
        source: data.source,
        metadata: data.metadata || {},
        is_resolved: false,
        resolved_at: null,
        resolved_by: null,
        acknowledged_at: null,
        acknowledged_by: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create alert', { error, data });
      throw new DatabaseError('Failed to create alert', { error });
    }

    logger.info('Alert created', { alertId, type: data.type, title: data.title });

    // Invalidate cache
    cache.delete(`alert:${alertId}`);
    cache.delete('alerts:all');

    return alert as Alert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating alert', { error, data });
    throw new DatabaseError('Failed to create alert', { error });
  }
}

/**
 * Update alert
 */
export async function updateAlert(alertId: string, data: {
  type?: 'info' | 'warning' | 'error' | 'critical';
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}): Promise<Alert> {
  try {
    await validatePlatformWritePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.type !== undefined) updateData.type = data.type;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: alert, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update alert', { error, alertId });
      throw new DatabaseError('Failed to update alert', { error });
    }

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    logger.info('Alert updated', { alertId });

    // Invalidate cache
    cache.delete(`alert:${alertId}`);

    return alert as Alert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating alert', { error, alertId });
    throw new DatabaseError('Failed to update alert', { error });
  }
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string, resolvedBy: string): Promise<Alert> {
  try {
    await validatePlatformWritePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();

    const { data: alert, error } = await supabase
      .from('alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to resolve alert', { error, alertId });
      throw new DatabaseError('Failed to resolve alert', { error });
    }

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    logger.info('Alert resolved', { alertId, resolvedBy });

    // Invalidate cache
    cache.delete(`alert:${alertId}`);
    cache.delete('alerts:unresolved');

    return alert as Alert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resolving alert', { error, alertId });
    throw new DatabaseError('Failed to resolve alert', { error });
  }
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
  try {
    await validatePlatformWritePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();

    const { data: alert, error } = await supabase
      .from('alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to acknowledge alert', { error, alertId });
      throw new DatabaseError('Failed to acknowledge alert', { error });
    }

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    logger.info('Alert acknowledged', { alertId, acknowledgedBy });

    // Invalidate cache
    cache.delete(`alert:${alertId}`);

    return alert as Alert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error acknowledging alert', { error, alertId });
    throw new DatabaseError('Failed to acknowledge alert', { error });
  }
}

/**
 * Delete alert
 */
export async function deleteAlert(alertId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      logger.error('Failed to delete alert', { error, alertId });
      throw new DatabaseError('Failed to delete alert', { error });
    }

    logger.info('Alert deleted', { alertId });

    // Invalidate cache
    cache.delete(`alert:${alertId}`);
    cache.delete('alerts:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting alert', { error, alertId });
    throw new DatabaseError('Failed to delete alert', { error });
  }
}

/**
 * Get alert by ID
 */
export async function getAlert(alertId: string): Promise<Alert> {
  try {
    const cached = cache.get<Alert>(`alert:${alertId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: alert, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (error) {
      logger.error('Failed to fetch alert', { error, alertId });
      throw new DatabaseError('Failed to fetch alert', { error });
    }

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    cache.set(`alert:${alertId}`, alert, cacheHelpers.ttl.MEDIUM);

    return alert as Alert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching alert', { error, alertId });
    throw new DatabaseError('Failed to fetch alert', { error });
  }
}

/**
 * List alerts
 */
export async function listAlerts(options: {
  page?: number;
  pageSize?: number;
  type?: 'info' | 'warning' | 'error' | 'critical';
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  isResolved?: boolean;
  source?: string;
  from?: string;
  to?: string;
}): Promise<{ alerts: Alert[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, type, severity, category, isResolved, source, from, to } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('alerts')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (isResolved !== undefined) {
      query = query.eq('is_resolved', isResolved);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: alerts, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list alerts', { error });
      throw new DatabaseError('Failed to list alerts', { error });
    }

    return {
      alerts: (alerts || []) as Alert[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing alerts', { error });
    throw new DatabaseError('Failed to list alerts', { error });
  }
}

/**
 * Get unresolved alerts
 */
export async function getUnresolvedAlerts(options: {
  page?: number;
  pageSize?: number;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
}): Promise<{ alerts: Alert[]; total: number; page: number; pageSize: number }> {
  return listAlerts({ ...options, isResolved: false });
}

/**
 * Get alerts by category
 */
export async function getAlertsByCategory(category: string, options: {
  page?: number;
  pageSize?: number;
  isResolved?: boolean;
}): Promise<{ alerts: Alert[]; total: number; page: number; pageSize: number }> {
  return listAlerts({ ...options, category });
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(): Promise<{
  total: number;
  unresolved: number;
  resolved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: alerts } = await supabase
      .from('alerts')
      .select('type, severity, category, is_resolved');

    if (!alerts || alerts.length === 0) {
      return {
        total: 0,
        unresolved: 0,
        resolved: 0,
        byType: {},
        bySeverity: {},
        byCategory: {},
      };
    }

    const stats = {
      total: alerts.length,
      unresolved: 0,
      resolved: 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    for (const alert of alerts) {
      if (alert.is_resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }

      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.byCategory[alert.category] = (stats.byCategory[alert.category] || 0) + 1;
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get alert statistics', { error });
    throw new DatabaseError('Failed to get alert statistics', { error });
  }
}

/**
 * Create alert rule
 */
export async function createAlertRule(data: {
  name: string;
  description: string;
  type: string;
  condition: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: string[];
  cooldown?: number;
}): Promise<AlertRule> {
  try {
    await validatePlatformWritePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();

    const ruleId = `rule-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: rule, error } = await supabase
      .from('alert_rules')
      .insert({
        id: ruleId,
        name: data.name,
        description: data.description,
        type: data.type,
        condition: data.condition,
        severity: data.severity || 'medium',
        is_enabled: true,
        channels: data.channels || [],
        cooldown: data.cooldown || 300000,
        last_triggered: null,
        trigger_count: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create alert rule', { error, data });
      throw new DatabaseError('Failed to create alert rule', { error });
    }

    logger.info('Alert rule created', { ruleId, name: data.name });

    // Invalidate cache
    cache.delete(`alert-rule:${ruleId}`);
    cache.delete('alert-rules:all');

    return rule as AlertRule;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating alert rule', { error, data });
    throw new DatabaseError('Failed to create alert rule', { error });
  }
}

/**
 * Get alert rule by ID
 */
export async function getAlertRule(ruleId: string): Promise<AlertRule> {
  try {
    const supabase = getSupabaseClient();

    const { data: rule, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error) {
      logger.error('Failed to fetch alert rule', { error, ruleId });
      throw new DatabaseError('Failed to fetch alert rule', { error });
    }

    if (!rule) {
      throw new NotFoundError('Alert rule not found');
    }

    return rule as AlertRule;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching alert rule', { error, ruleId });
    throw new DatabaseError('Failed to fetch alert rule', { error });
  }
}

/**
 * List alert rules
 */
export async function listAlertRules(options: {
  page?: number;
  pageSize?: number;
  isEnabled?: boolean;
  type?: string;
}): Promise<{ rules: AlertRule[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isEnabled, type } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('alert_rules')
      .select('*', { count: 'exact' });

    if (isEnabled !== undefined) {
      query = query.eq('is_enabled', isEnabled);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: rules, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list alert rules', { error });
      throw new DatabaseError('Failed to list alert rules', { error });
    }

    return {
      rules: (rules || []) as AlertRule[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing alert rules', { error });
    throw new DatabaseError('Failed to list alert rules', { error });
  }
}

/**
 * Delete old alerts
 */
export async function deleteOldAlerts(daysOld: number = 30): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('is_resolved', true)
      .lt('resolved_at', cutoffDate);

    if (error) {
      logger.error('Failed to delete old alerts', { error, daysOld });
      throw new DatabaseError('Failed to delete old alerts', { error });
    }

    logger.info('Old alerts deleted', { daysOld });

    // Invalidate cache
    cache.delete('alerts:all');

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old alerts', { error, daysOld });
    throw new DatabaseError('Failed to delete old alerts', { error });
  }
}

/**
 * Get critical alerts
 */
export async function getCriticalAlerts(): Promise<Alert[]> {
  try {
    const { alerts } = await listAlerts({ 
      severity: 'urgent', 
      isResolved: false, 
      pageSize: 50 
    });
    return alerts;
  } catch (error) {
    logger.error('Failed to get critical alerts', { error });
    throw new DatabaseError('Failed to get critical alerts', { error });
  }
}

/**
 * Bulk resolve alerts
 */
export async function bulkResolveAlerts(alertIds: string[], resolvedBy: string): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.ALERTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        updated_at: new Date().toISOString(),
      })
      .in('id', alertIds);

    if (error) {
      logger.error('Failed to bulk resolve alerts', { error });
      throw new DatabaseError('Failed to bulk resolve alerts', { error });
    }

    logger.info('Bulk resolved alerts', { count: alertIds.length });

    // Invalidate cache
    cache.delete('alerts:all');
    cache.delete('alerts:unresolved');

    return alertIds.length;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error bulk resolving alerts', { error });
    throw new DatabaseError('Failed to bulk resolve alerts', { error });
  }
}
