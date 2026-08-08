import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Revenue Manager
// Revenue tracking and financial reporting
// ============================================================================

/**
 * Revenue record interface
 */
export interface RevenueRecord {
  id: string;
  type: 'subscription' | 'one_time' | 'usage' | 'refund';
  amount: number;
  currency: string;
  tenantId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  period: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Record revenue
 */
export async function recordRevenue(data: {
  type: 'subscription' | 'one_time' | 'usage' | 'refund';
  amount: number;
  currency: string;
  tenantId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  period: string;
  metadata?: Record<string, unknown>;
}): Promise<RevenueRecord> {
  try {
    await validatePlatformWritePermission(PlatformResource.REVENUE);

    const supabase = getSupabaseClient();

    const revenueId = `revenue-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: revenue, error } = await supabase
      .from('revenue_records')
      .insert({
        id: revenueId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        tenant_id: data.tenantId || null,
        subscription_id: data.subscriptionId || null,
        invoice_id: data.invoiceId || null,
        period: data.period,
        status: 'confirmed',
        metadata: data.metadata || {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to record revenue', { error, data });
      throw new DatabaseError('Failed to record revenue', { error });
    }

    logger.info('Revenue recorded', { revenueId, amount: data.amount, type: data.type });

    // Invalidate cache
    cache.delete(`revenue:${revenueId}`);
    cache.delete('revenue:all');

    return revenue as RevenueRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording revenue', { error, data });
    throw new DatabaseError('Failed to record revenue', { error });
  }
}

/**
 * Get revenue record by ID
 */
export async function getRevenueRecord(revenueId: string): Promise<RevenueRecord> {
  try {
    const supabase = getSupabaseClient();

    const { data: revenue, error } = await supabase
      .from('revenue_records')
      .select('*')
      .eq('id', revenueId)
      .single();

    if (error) {
      logger.error('Failed to fetch revenue record', { error, revenueId });
      throw new DatabaseError('Failed to fetch revenue record', { error });
    }

    if (!revenue) {
      throw new NotFoundError('Revenue record not found');
    }

    return revenue as RevenueRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching revenue record', { error, revenueId });
    throw new DatabaseError('Failed to fetch revenue record', { error });
  }
}

/**
 * List revenue records
 */
export async function listRevenueRecords(options: {
  page?: number;
  pageSize?: number;
  type?: 'subscription' | 'one_time' | 'usage' | 'refund';
  status?: 'pending' | 'confirmed' | 'failed' | 'refunded';
  tenantId?: string;
  subscriptionId?: string;
  from?: string;
  to?: string;
}): Promise<{ records: RevenueRecord[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, type, status, tenantId, subscriptionId, from, to } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('revenue_records')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: records, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list revenue records', { error });
      throw new DatabaseError('Failed to list revenue records', { error });
    }

    return {
      records: (records || []) as RevenueRecord[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing revenue records', { error });
    throw new DatabaseError('Failed to list revenue records', { error });
  }
}

/**
 * Get revenue summary
 */
export async function getRevenueSummary(options: {
  from?: string;
  to?: string;
  tenantId?: string;
}): Promise<{
  totalRevenue: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recordCount: number;
}> {
  try {
    const { from, to, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('revenue_records')
      .select('type, status, amount');

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: records } = await query;

    if (!records || records.length === 0) {
      return {
        totalRevenue: 0,
        byType: {},
        byStatus: {},
        recordCount: 0,
      };
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalRevenue = 0;

    for (const record of records) {
      byType[record.type] = (byType[record.type] || 0) + record.amount;
      byStatus[record.status] = (byStatus[record.status] || 0) + 1;
      totalRevenue += record.amount;
    }

    return {
      totalRevenue,
      byType,
      byStatus,
      recordCount: records.length,
    };
  } catch (error) {
    logger.error('Failed to get revenue summary', { error });
    throw new DatabaseError('Failed to get revenue summary', { error });
  }
}

/**
 * Get monthly revenue
 */
export async function getMonthlyRevenue(months: number = 12): Promise<Array<{
  month: string;
  revenue: number;
  count: number;
}>> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: records } = await supabase
      .from('revenue_records')
      .select('amount, created_at')
      .gte('created_at', cutoffDate)
      .eq('status', 'confirmed');

    if (!records || records.length === 0) {
      return [];
    }

    const monthlyRevenue: Record<string, { revenue: number; count: number }> = {};

    for (const record of records) {
      const month = record.created_at.substring(0, 7); // YYYY-MM
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = { revenue: 0, count: 0 };
      }
      monthlyRevenue[month].revenue += record.amount;
      monthlyRevenue[month].count += 1;
    }

    return Object.entries(monthlyRevenue)
      .map(([month, data]) => ({ month, revenue: data.revenue, count: data.count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    logger.error('Failed to get monthly revenue', { error });
    throw new DatabaseError('Failed to get monthly revenue', { error });
  }
}

/**
 * Get revenue by tenant
 */
export async function getRevenueByTenant(tenantId: string, options: {
  from?: string;
  to?: string;
}): Promise<{
  totalRevenue: number;
  byType: Record<string, number>;
  recordCount: number;
}> {
  try {
    return getRevenueSummary({ tenantId, ...options });
  } catch (error) {
    logger.error('Failed to get revenue by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get revenue by tenant', { error });
  }
}

/**
 * Get top revenue tenants
 */
export async function getTopRevenueTenants(limit: number = 10): Promise<Array<{
  tenantId: string;
  totalRevenue: number;
  recordCount: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    const { data: records } = await supabase
      .from('revenue_records')
      .select('tenant_id, amount')
      .eq('status', 'confirmed');

    if (!records || records.length === 0) {
      return [];
    }

    const tenantRevenue: Record<string, { revenue: number; count: number }> = {};

    for (const record of records) {
      if (!record.tenant_id) continue;
      if (!tenantRevenue[record.tenant_id]) {
        tenantRevenue[record.tenant_id] = { revenue: 0, count: 0 };
      }
      tenantRevenue[record.tenant_id].revenue += record.amount;
      tenantRevenue[record.tenant_id].count += 1;
    }

    return Object.entries(tenantRevenue)
      .map(([tenantId, data]) => ({ tenantId, totalRevenue: data.revenue, recordCount: data.count }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  } catch (error) {
    logger.error('Failed to get top revenue tenants', { error });
    throw new DatabaseError('Failed to get top revenue tenants', { error });
  }
}

/**
 * Get revenue trends
 */
export async function getRevenueTrends(days: number = 30): Promise<{
  current: number;
  previous: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
}> {
  try {
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
    const previousEnd = currentStart;

    const [currentSummary, previousSummary] = await Promise.all([
      getRevenueSummary({ from: currentStart }),
      getRevenueSummary({ from: previousStart, to: previousEnd }),
    ]);

    const current = currentSummary.totalRevenue;
    const previous = previousSummary.totalRevenue;
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const trend = growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable';

    return {
      current,
      previous,
      growth,
      trend,
    };
  } catch (error) {
    logger.error('Failed to get revenue trends', { error });
    throw new DatabaseError('Failed to get revenue trends', { error });
  }
}

/**
 * Get revenue dashboard data
 */
export async function getRevenueDashboardData(): Promise<{
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  monthlyGrowth: number;
  topTenants: Array<{ tenantId: string; totalRevenue: number; recordCount: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
}> {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = thisMonthStart;

    const [totalSummary, thisMonthSummary, lastMonthSummary, topTenants, monthlyRevenue] = await Promise.all([
      getRevenueSummary({}),
      getRevenueSummary({ from: thisMonthStart }),
      getRevenueSummary({ from: lastMonthStart, to: lastMonthEnd }),
      getTopRevenueTenants(5),
      getMonthlyRevenue(6),
    ]);

    const monthlyGrowth = lastMonthSummary.totalRevenue > 0 
      ? ((thisMonthSummary.totalRevenue - lastMonthSummary.totalRevenue) / lastMonthSummary.totalRevenue) * 100 
      : 0;

    return {
      totalRevenue: totalSummary.totalRevenue,
      revenueThisMonth: thisMonthSummary.totalRevenue,
      revenueLastMonth: lastMonthSummary.totalRevenue,
      monthlyGrowth,
      topTenants,
      monthlyRevenue,
    };
  } catch (error) {
    logger.error('Failed to get revenue dashboard data', { error });
    throw new DatabaseError('Failed to get revenue dashboard data', { error });
  }
}

/**
 * Update revenue status
 */
export async function updateRevenueStatus(revenueId: string, status: 'pending' | 'confirmed' | 'failed' | 'refunded'): Promise<RevenueRecord> {
  try {
    await validatePlatformWritePermission(PlatformResource.REVENUE);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: revenue, error } = await supabase
      .from('revenue_records')
      .update({ status, updated_at: now })
      .eq('id', revenueId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update revenue status', { error, revenueId });
      throw new DatabaseError('Failed to update revenue status', { error });
    }

    if (!revenue) {
      throw new NotFoundError('Revenue record not found');
    }

    logger.info('Revenue status updated', { revenueId, status });

    // Invalidate cache
    cache.delete(`revenue:${revenueId}`);
    cache.delete('revenue:all');

    return revenue as RevenueRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating revenue status', { error, revenueId });
    throw new DatabaseError('Failed to update revenue status', { error });
  }
}
