import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Audit Manager
// Audit trail and compliance logging
// ============================================================================

/**
 * Audit entry interface
 */
export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Audit filter options
 */
export interface AuditFilter {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  tenantId?: string;
  from?: string;
  to?: string;
}

/**
 * Create audit entry
 */
export async function createAuditEntry(data: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuditEntry> {
  try {
    const supabase = getSupabaseClient();

    const auditId = `audit-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: entry, error } = await supabase
      .from('audit_logs')
      .insert({
        id: auditId,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        user_id: data.userId,
        tenant_id: data.tenantId,
        changes: data.changes,
        metadata: data.metadata || {},
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        timestamp: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create audit entry', { error, data });
      throw new DatabaseError('Failed to create audit entry', { error });
    }

    logger.info('Audit entry created', { auditId, action: data.action, entityType: data.entityType });

    // Invalidate cache
    cache.delete(`audit:${auditId}`);
    cache.delete('audit:all');

    return entry as AuditEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating audit entry', { error, data });
    throw new DatabaseError('Failed to create audit entry', { error });
  }
}

/**
 * Get audit entry by ID
 */
export async function getAuditEntry(auditId: string): Promise<AuditEntry> {
  try {
    const supabase = getSupabaseClient();

    const { data: entry, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', auditId)
      .single();

    if (error) {
      logger.error('Failed to fetch audit entry', { error, auditId });
      throw new DatabaseError('Failed to fetch audit entry', { error });
    }

    if (!entry) {
      throw new NotFoundError('Audit entry not found');
    }

    return entry as AuditEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching audit entry', { error, auditId });
    throw new DatabaseError('Failed to fetch audit entry', { error });
  }
}

/**
 * List audit entries
 */
export async function listAuditEntries(filter: AuditFilter, options: {
  page?: number;
  pageSize?: number;
}): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 50 } = options;
    const { action, entityType, entityId, userId, tenantId, from, to } = filter;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (action) {
      query = query.eq('action', action);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
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

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: entries, error, count } = await query
      .range(fromIndex, toIndex)
      .order('timestamp', { ascending: false });

    if (error) {
      logger.error('Failed to list audit entries', { error });
      throw new DatabaseError('Failed to list audit entries', { error });
    }

    return {
      entries: (entries || []) as AuditEntry[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing audit entries', { error });
    throw new DatabaseError('Failed to list audit entries', { error });
  }
}

/**
 * Get audit trail for entity
 */
export async function getEntityAuditTrail(entityType: string, entityId: string, options: {
  page?: number;
  pageSize?: number;
}): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  return listAuditEntries({ entityType, entityId }, options);
}

/**
 * Get audit trail for user
 */
export async function getUserAuditTrail(userId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  return listAuditEntries({ userId, from: options.from, to: options.to }, options);
}

/**
 * Get audit trail for tenant
 */
export async function getTenantAuditTrail(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  return listAuditEntries({ tenantId, from: options.from, to: options.to }, options);
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(options: {
  from?: string;
  to?: string;
  tenantId?: string;
}): Promise<{
  total: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byUser: Record<string, number>;
}> {
  try {
    const { from, to, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('audit_logs')
      .select('action, entity_type, user_id');

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: entries } = await query;

    if (!entries || entries.length === 0) {
      return {
        total: 0,
        byAction: {},
        byEntityType: {},
        byUser: {},
      };
    }

    const byAction: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    for (const entry of entries) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byEntityType[entry.entity_type] = (byEntityType[entry.entity_type] || 0) + 1;
      byUser[entry.user_id] = (byUser[entry.user_id] || 0) + 1;
    }

    return {
      total: entries.length,
      byAction,
      byEntityType,
      byUser,
    };
  } catch (error) {
    logger.error('Failed to get audit statistics', { error });
    throw new DatabaseError('Failed to get audit statistics', { error });
  }
}

/**
 * Delete old audit entries
 */
export async function deleteOldAuditEntries(daysOld: number = 90): Promise<number> {
  try {
    await validatePlatformDeletePermission(PlatformResource.AUDIT);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to delete old audit entries', { error, daysOld });
      throw new DatabaseError('Failed to delete old audit entries', { error });
    }

    logger.info('Old audit entries deleted', { daysOld });

    // Invalidate cache
    cache.delete('audit:all');

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old audit entries', { error, daysOld });
    throw new DatabaseError('Failed to delete old audit entries', { error });
  }
}

/**
 * Export audit trail
 */
export async function exportAuditTrail(filter: AuditFilter): Promise<string> {
  try {
    const { entries } = await listAuditEntries(filter, { pageSize: 10000 });
    return JSON.stringify(entries, null, 2);
  } catch (error) {
    logger.error('Failed to export audit trail', { error });
    throw new DatabaseError('Failed to export audit trail', { error });
  }
}

/**
 * Get compliance report
 */
export async function getComplianceReport(options: {
  from: string;
  to: string;
  tenantId?: string;
}): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  sensitiveActions: number;
  dataAccessEvents: number;
  modifications: number;
  deletions: number;
}> {
  try {
    const { from, to, tenantId } = options;

    const { entries } = await listAuditEntries({ from, to, tenantId }, { pageSize: 10000 });

    const sensitiveActions = ['delete', 'update', 'create', 'export'];
    const dataAccessActions = ['read', 'view', 'list', 'get'];

    const report = {
      totalActions: entries.length,
      actionsByType: {} as Record<string, number>,
      sensitiveActions: 0,
      dataAccessEvents: 0,
      modifications: 0,
      deletions: 0,
    };

    for (const entry of entries) {
      report.actionsByType[entry.action] = (report.actionsByType[entry.action] || 0) + 1;

      if (sensitiveActions.includes(entry.action.toLowerCase())) {
        report.sensitiveActions++;
      }

      if (dataAccessActions.includes(entry.action.toLowerCase())) {
        report.dataAccessEvents++;
      }

      if (entry.action.toLowerCase() === 'delete') {
        report.deletions++;
      }

      if (entry.action.toLowerCase() === 'update' || entry.action.toLowerCase() === 'create') {
        report.modifications++;
      }
    }

    return report;
  } catch (error) {
    logger.error('Failed to get compliance report', { error });
    throw new DatabaseError('Failed to get compliance report', { error });
  }
}

/**
 * Audit helper for common actions
 */
export const auditHelper = {
  /**
   * Log create action
   */
  async logCreate(data: {
    entityType: string;
    entityId: string;
    userId: string;
    tenantId: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    return createAuditEntry({
      action: 'create',
      ...data,
    });
  },

  /**
   * Log update action
   */
  async logUpdate(data: {
    entityType: string;
    entityId: string;
    userId: string;
    tenantId: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    return createAuditEntry({
      action: 'update',
      ...data,
    });
  },

  /**
   * Log delete action
   */
  async logDelete(data: {
    entityType: string;
    entityId: string;
    userId: string;
    tenantId: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    return createAuditEntry({
      action: 'delete',
      ...data,
    });
  },

  /**
   * Log read action
   */
  async logRead(data: {
    entityType: string;
    entityId: string;
    userId: string;
    tenantId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    return createAuditEntry({
      action: 'read',
      changes: {},
      ...data,
    });
  },

  /**
   * Log export action
   */
  async logExport(data: {
    entityType: string;
    entityId: string;
    userId: string;
    tenantId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    return createAuditEntry({
      action: 'export',
      changes: {},
      ...data,
    });
  },
};

/**
 * Get recent audit entries
 */
export async function getRecentAuditEntries(limit: number = 50): Promise<AuditEntry[]> {
  try {
    const { entries } = await listAuditEntries({}, { page: 1, pageSize: limit });
    return entries;
  } catch (error) {
    logger.error('Failed to get recent audit entries', { error });
    throw new DatabaseError('Failed to get recent audit entries', { error });
  }
}

/**
 * Search audit entries by action
 */
export async function searchByAction(action: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ entries: AuditEntry[]; total: number; page: number; pageSize: number }> {
  return listAuditEntries({ action, from: options.from, to: options.to }, options);
}

/**
 * Get audit summary for dashboard
 */
export async function getAuditSummary(): Promise<{
  totalEntries: number;
  todayEntries: number;
  weekEntries: number;
  monthEntries: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
}> {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const week = new Date(now.setDate(now.getDate() - 7)).toISOString();
    const month = new Date(now.setDate(now.getDate() - 23)).toISOString();

    const stats = await getAuditStatistics({});

    const { entries: todayEntries } = await listAuditEntries({ from: today }, { pageSize: 1 });
    const { entries: weekEntries } = await listAuditEntries({ from: week }, { pageSize: 1 });
    const { entries: monthEntries } = await listAuditEntries({ from: month }, { pageSize: 1 });

    const topActions = Object.entries(stats.byAction)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Object.entries(stats.byUser)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEntries: stats.total,
      todayEntries: todayEntries.length,
      weekEntries: weekEntries.length,
      monthEntries: monthEntries.length,
      topActions,
      topUsers,
    };
  } catch (error) {
    logger.error('Failed to get audit summary', { error });
    throw new DatabaseError('Failed to get audit summary', { error });
  }
}
