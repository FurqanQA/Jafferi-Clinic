import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { Tenant, TenantStatus } from './platform-types';

// ============================================================================
// Get Tenants
// Tenant listing and filtering operations
// ============================================================================

/**
 * List tenants options
 */
export interface ListTenantsOptions {
  page?: number;
  pageSize?: number;
  status?: TenantStatus;
  planId?: string;
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * List tenants result
 */
export interface ListTenantsResult {
  tenants: Tenant[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List tenants
 */
export async function listTenants(options: ListTenantsOptions = {}): Promise<ListTenantsResult> {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      planId,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('tenants')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: tenants, error, count } = await query
      .range(fromIndex, toIndex)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (error) {
      logger.error('Failed to list tenants', { error });
      throw new DatabaseError('Failed to list tenants', { error });
    }

    return {
      tenants: (tenants || []) as Tenant[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing tenants', { error });
    throw new DatabaseError('Failed to list tenants', { error });
  }
}

/**
 * Get all tenants (without pagination)
 */
export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get all tenants', { error });
      throw new DatabaseError('Failed to get all tenants', { error });
    }

    return (tenants || []) as Tenant[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error getting all tenants', { error });
    throw new DatabaseError('Failed to get all tenants', { error });
  }
}

/**
 * Get active tenants
 */
export async function getActiveTenants(): Promise<Tenant[]> {
  try {
    const { tenants } = await listTenants({ 
      status: TenantStatus.ACTIVE, 
      pageSize: 1000 
    });
    return tenants;
  } catch (error) {
    logger.error('Failed to get active tenants', { error });
    throw new DatabaseError('Failed to get active tenants', { error });
  }
}

/**
 * Get suspended tenants
 */
export async function getSuspendedTenants(): Promise<Tenant[]> {
  try {
    const { tenants } = await listTenants({ 
      status: TenantStatus.SUSPENDED, 
      pageSize: 1000 
    });
    return tenants;
  } catch (error) {
    logger.error('Failed to get suspended tenants', { error });
    throw new DatabaseError('Failed to get suspended tenants', { error });
  }
}

/**
 * Get cancelled tenants
 */
export async function getCancelledTenants(): Promise<Tenant[]> {
  try {
    const { tenants } = await listTenants({ 
      status: TenantStatus.CANCELLED, 
      pageSize: 1000 
    });
    return tenants;
  } catch (error) {
    logger.error('Failed to get cancelled tenants', { error });
    throw new DatabaseError('Failed to get cancelled tenants', { error });
  }
}

/**
 * Get trial tenants
 */
export async function getTrialTenants(): Promise<Tenant[]> {
  try {
    const { tenants } = await listTenants({ 
      status: TenantStatus.TRIAL, 
      pageSize: 1000 
    });
    return tenants;
  } catch (error) {
    logger.error('Failed to get trial tenants', { error });
    throw new DatabaseError('Failed to get trial tenants', { error });
  }
}

/**
 * Get tenants by plan
 */
export async function getTenantsByPlan(planId: string): Promise<Tenant[]> {
  try {
    const { tenants } = await listTenants({ 
      planId, 
      pageSize: 1000 
    });
    return tenants;
  } catch (error) {
    logger.error('Failed to get tenants by plan', { error, planId });
    throw new DatabaseError('Failed to get tenants by plan', { error });
  }
}

/**
 * Get tenant count by status
 */
export async function getTenantCountByStatus(): Promise<Record<string, number>> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenants } = await supabase
      .from('tenants')
      .select('status');

    if (!tenants || tenants.length === 0) {
      return {};
    }

    const statusCount: Record<string, number> = {};

    for (const tenant of tenants) {
      statusCount[tenant.status] = (statusCount[tenant.status] || 0) + 1;
    }

    return statusCount;
  } catch (error) {
    logger.error('Failed to get tenant count by status', { error });
    throw new DatabaseError('Failed to get tenant count by status', { error });
  }
}

/**
 * Get tenant count by plan
 */
export async function getTenantCountByPlan(): Promise<Record<string, number>> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenants } = await supabase
      .from('tenants')
      .select('plan_id');

    if (!tenants || tenants.length === 0) {
      return {};
    }

    const planCount: Record<string, number> = {};

    for (const tenant of tenants) {
      if (tenant.plan_id) {
        planCount[tenant.plan_id] = (planCount[tenant.plan_id] || 0) + 1;
      }
    }

    return planCount;
  } catch (error) {
    logger.error('Failed to get tenant count by plan', { error });
    throw new DatabaseError('Failed to get tenant count by plan', { error });
  }
}

/**
 * Get recent tenants
 */
export async function getRecentTenants(days: number = 30): Promise<Tenant[]> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get recent tenants', { error });
      throw new DatabaseError('Failed to get recent tenants', { error });
    }

    return (tenants || []) as Tenant[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error getting recent tenants', { error });
    throw new DatabaseError('Failed to get recent tenants', { error });
  }
}

/**
 * Get tenant statistics
 */
export async function getTenantStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPlan: Record<string, number>;
  createdThisMonth: number;
  createdThisYear: number;
}> {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString();

    const [allTenants, byStatus, byPlan, recentTenants] = await Promise.all([
      getAllTenants(),
      getTenantCountByStatus(),
      getTenantCountByPlan(),
      getRecentTenants(365),
    ]);

    const createdThisMonth = recentTenants.filter(
      t => t.createdAt >= thisMonthStart
    ).length;

    const createdThisYear = recentTenants.filter(
      t => t.createdAt >= thisYearStart
    ).length;

    return {
      total: allTenants.length,
      byStatus,
      byPlan,
      createdThisMonth,
      createdThisYear,
    };
  } catch (error) {
    logger.error('Failed to get tenant statistics', { error });
    throw new DatabaseError('Failed to get tenant statistics', { error });
  }
}
