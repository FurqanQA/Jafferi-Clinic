import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { TenantUsage, TenantLimits } from './platform-types';

// ============================================================================
// Usage Manager
// Usage tracking and management for tenants
// ============================================================================

/**
 * Usage Record interface
 */
export interface UsageRecord {
  id: string;
  tenantId: string;
  metric: string;
  value: number;
  periodStart: string;
  periodEnd: string;
  recordedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Record usage for a tenant
 */
export async function recordUsage(data: {
  tenantId: string;
  metric: 'users' | 'patients' | 'appointments' | 'storage' | 'apiCalls' | 'aiTokens';
  value: number;
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, unknown>;
}): Promise<UsageRecord> {
  try {
    const supabase = getSupabaseClient();

    const recordId = `usage-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: record, error } = await supabase
      .from('usage_records')
      .insert({
        id: recordId,
        tenant_id: data.tenantId,
        metric: data.metric,
        value: data.value,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        recorded_at: now,
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to record usage', { error, data });
      throw new DatabaseError('Failed to record usage', { error });
    }

    logger.info('Usage recorded successfully', { recordId, tenantId: data.tenantId, metric: data.metric });

    // Invalidate cache
    cache.delete(`usage:${data.tenantId}:${data.metric}`);

    return record as UsageRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording usage', { error, data });
    throw new DatabaseError('Failed to record usage', { error });
  }
}

/**
 * Get usage for a tenant
 */
export async function getTenantUsage(tenantId: string, options: {
  metric?: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<UsageRecord[]> {
  try {
    const cacheKey = `usage:${tenantId}:${options.metric || 'all'}`;
    const cached = cache.get<UsageRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();
    let query = supabase
      .from('usage_records')
      .select('*')
      .eq('tenant_id', tenantId);

    if (options.metric) {
      query = query.eq('metric', options.metric);
    }

    if (options.periodStart) {
      query = query.gte('period_start', options.periodStart);
    }

    if (options.periodEnd) {
      query = query.lte('period_end', options.periodEnd);
    }

    const { data: records, error } = await query
      .order('recorded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch tenant usage', { error, tenantId });
      throw new DatabaseError('Failed to fetch tenant usage', { error });
    }

    const result = (records || []) as UsageRecord[];
    cache.set(cacheKey, result, cacheHelpers.ttl.SHORT);

    return result;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching tenant usage', { error, tenantId });
    throw new DatabaseError('Failed to fetch tenant usage', { error });
  }
}

/**
 * Get aggregated usage for a tenant
 */
export async function getAggregatedUsage(tenantId: string, options: {
  periodStart: string;
  periodEnd: string;
}): Promise<Record<string, number>> {
  try {
    const records = await getTenantUsage(tenantId, options);

    const aggregated: Record<string, number> = {};

    for (const record of records) {
      aggregated[record.metric] = (aggregated[record.metric] || 0) + record.value;
    }

    return aggregated;
  } catch (error) {
    logger.error('Failed to get aggregated usage', { error, tenantId });
    throw error;
  }
}

/**
 * Update tenant usage in tenant record
 */
export async function updateTenantUsage(tenantId: string, usage: Partial<TenantUsage>): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Get current usage
    const { data: tenant } = await supabase
      .from('tenants')
      .select('usage')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const currentUsage = tenant.usage as TenantUsage;
    const updatedUsage = { ...currentUsage, ...usage };

    const { error } = await supabase
      .from('tenants')
      .update({
        usage: updatedUsage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to update tenant usage', { error, tenantId });
      throw new DatabaseError('Failed to update tenant usage', { error });
    }

    logger.info('Tenant usage updated successfully', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating tenant usage', { error, tenantId });
    throw new DatabaseError('Failed to update tenant usage', { error });
  }
}

/**
 * Check if tenant is within limits
 */
export async function checkUsageLimits(tenantId: string): Promise<{
  withinLimits: boolean;
  exceeded: string[];
  usage: TenantUsage;
  limits: TenantLimits;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('usage, limits')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const usage = tenant.usage as TenantUsage;
    const limits = tenant.limits as TenantLimits;

    const exceeded: string[] = [];

    if (usage.users > limits.users) exceeded.push('users');
    if (usage.patients > limits.patients) exceeded.push('patients');
    if (usage.appointments > limits.appointments) exceeded.push('appointments');
    if (usage.storage > limits.storage) exceeded.push('storage');
    if (usage.apiCalls > limits.apiCalls) exceeded.push('apiCalls');
    if (usage.aiTokens > limits.aiTokens) exceeded.push('aiTokens');

    return {
      withinLimits: exceeded.length === 0,
      exceeded,
      usage,
      limits,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error checking usage limits', { error, tenantId });
    throw new DatabaseError('Failed to check usage limits', { error });
  }
}

/**
 * Get usage percentage for a metric
 */
export function getUsagePercentage(usage: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((usage / limit) * 100);
}

/**
 * Get usage statistics across all tenants
 */
export async function getUsageStatistics(): Promise<{
  totalTenants: number;
  totalUsage: Record<string, number>;
  averageUsage: Record<string, number>;
  topConsumers: Array<{
    tenantId: string;
    metric: string;
    value: number;
  }>;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, usage');

    if (!tenants || tenants.length === 0) {
      return {
        totalTenants: 0,
        totalUsage: {},
        averageUsage: {},
        topConsumers: [],
      };
    }

    const totalUsage: Record<string, number> = {
      users: 0,
      patients: 0,
      appointments: 0,
      storage: 0,
      apiCalls: 0,
      aiTokens: 0,
    };

    const topConsumers: Array<{ tenantId: string; metric: string; value: number }> = [];

    for (const tenant of tenants) {
      const usage = tenant.usage as TenantUsage;
      totalUsage.users += usage.users;
      totalUsage.patients += usage.patients;
      totalUsage.appointments += usage.appointments;
      totalUsage.storage += usage.storage;
      totalUsage.apiCalls += usage.apiCalls;
      totalUsage.aiTokens += usage.aiTokens;

      // Track top consumers
      const metrics = ['users', 'patients', 'appointments', 'storage', 'apiCalls', 'aiTokens'] as const;
      for (const metric of metrics) {
        topConsumers.push({
          tenantId: tenant.id,
          metric,
          value: usage[metric],
        });
      }
    }

    // Sort top consumers
    topConsumers.sort((a, b) => b.value - a.value);
    topConsumers.splice(10); // Keep top 10

    const averageUsage: Record<string, number> = {};
    for (const [key, value] of Object.entries(totalUsage)) {
      averageUsage[key] = value / tenants.length;
    }

    return {
      totalTenants: tenants.length,
      totalUsage,
      averageUsage,
      topConsumers,
    };
  } catch (error) {
    logger.error('Failed to get usage statistics', { error });
    throw new DatabaseError('Failed to get usage statistics', { error });
  }
}

/**
 * Reset usage for a new billing period
 */
export async function resetUsageForPeriod(tenantId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const newUsage: TenantUsage = {
      users: 0,
      patients: 0,
      appointments: 0,
      storage: 0,
      apiCalls: 0,
      aiTokens: 0,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { error } = await supabase
      .from('tenants')
      .update({
        usage: newUsage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to reset usage for period', { error, tenantId });
      throw new DatabaseError('Failed to reset usage for period', { error });
    }

    logger.info('Usage reset for new period', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resetting usage for period', { error, tenantId });
    throw new DatabaseError('Failed to reset usage for period', { error });
  }
}

/**
 * Increment usage metric
 */
export async function incrementUsage(tenantId: string, metric: keyof TenantUsage, amount: number = 1): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Get current usage
    const { data: tenant } = await supabase
      .from('tenants')
      .select('usage')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const usage = { ...(tenant.usage as TenantUsage) };
    
    // Type-safe increment
    switch (metric) {
      case 'users':
        usage.users = (usage.users || 0) + amount;
        break;
      case 'patients':
        usage.patients = (usage.patients || 0) + amount;
        break;
      case 'appointments':
        usage.appointments = (usage.appointments || 0) + amount;
        break;
      case 'storage':
        usage.storage = (usage.storage || 0) + amount;
        break;
      case 'apiCalls':
        usage.apiCalls = (usage.apiCalls || 0) + amount;
        break;
      case 'aiTokens':
        usage.aiTokens = (usage.aiTokens || 0) + amount;
        break;
      case 'periodStart':
      case 'periodEnd':
        // These are dates, not numbers - skip
        break;
    }

    const { error } = await supabase
      .from('tenants')
      .update({
        usage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to increment usage', { error, tenantId, metric });
      throw new DatabaseError('Failed to increment usage', { error });
    }

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error incrementing usage', { error, tenantId, metric });
    throw new DatabaseError('Failed to increment usage', { error });
  }
}

/**
 * Get usage trends for a tenant
 */
export async function getUsageTrends(tenantId: string, days: number = 30): Promise<Array<{
  date: string;
  metric: string;
  value: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: records, error } = await supabase
      .from('usage_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('recorded_at', startDate)
      .order('recorded_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch usage trends', { error, tenantId });
      throw new DatabaseError('Failed to fetch usage trends', { error });
    }

    return (records || []).map(record => ({
      date: record.recorded_at.split('T')[0],
      metric: record.metric,
      value: record.value,
    }));
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching usage trends', { error, tenantId });
    throw new DatabaseError('Failed to fetch usage trends', { error });
  }
}
