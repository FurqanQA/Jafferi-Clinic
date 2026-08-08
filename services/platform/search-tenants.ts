import { logger } from '../shared/logger';
import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { Tenant, TenantStatus } from './platform-types';

// ============================================================================
// Search Tenants
// Advanced tenant search and filtering
// ============================================================================

/**
 * Search filters
 */
export interface TenantSearchFilters {
  query?: string;
  status?: TenantStatus;
  planId?: string;
  createdAfter?: string;
  createdBefore?: string;
  minUsers?: number;
  maxUsers?: number;
  hasSubscription?: boolean;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'user_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Search result
 */
export interface TenantSearchResult {
  tenants: Tenant[];
  total: number;
  page: number;
  pageSize: number;
  filters: TenantSearchFilters;
}

/**
 * Search tenants
 */
export async function searchTenants(filters: TenantSearchFilters = {}): Promise<TenantSearchResult> {
  try {
    const {
      query,
      status,
      planId,
      createdAfter,
      createdBefore,
      hasSubscription,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = filters;

    const supabase = getSupabaseClient();
    let supabaseQuery = supabase
      .from('tenants')
      .select('*', { count: 'exact' });

    if (query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,slug.ilike.%${query}%,domain.ilike.%${query}%`);
    }

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    if (planId) {
      supabaseQuery = supabaseQuery.eq('plan_id', planId);
    }

    if (createdAfter) {
      supabaseQuery = supabaseQuery.gte('created_at', createdAfter);
    }

    if (createdBefore) {
      supabaseQuery = supabaseQuery.lte('created_at', createdBefore);
    }

    if (hasSubscription !== undefined) {
      if (hasSubscription) {
        supabaseQuery = supabaseQuery.not('subscription_id', 'is', null);
      } else {
        supabaseQuery = supabaseQuery.is('subscription_id', null);
      }
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: tenants, error, count } = await supabaseQuery
      .range(fromIndex, toIndex)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (error) {
      logger.error('Failed to search tenants', { error, filters });
      throw new DatabaseError('Failed to search tenants', { error });
    }

    return {
      tenants: (tenants || []) as Tenant[],
      total: count || 0,
      page,
      pageSize,
      filters,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching tenants', { error, filters });
    throw new DatabaseError('Failed to search tenants', { error });
  }
}

/**
 * Advanced search with multiple criteria
 */
export async function advancedSearchTenants(criteria: {
  name?: string;
  slug?: string;
  domain?: string;
  status?: TenantStatus[];
  planIds?: string[];
  dateRange?: { from: string; to: string };
  hasActiveSubscription?: boolean;
  userCountRange?: { min: number; max: number };
}): Promise<Tenant[]> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('tenants')
      .select('*');

    if (criteria.name) {
      query = query.ilike('name', `%${criteria.name}%`);
    }

    if (criteria.slug) {
      query = query.ilike('slug', `%${criteria.slug}%`);
    }

    if (criteria.domain) {
      query = query.ilike('domain', `%${criteria.domain}%`);
    }

    if (criteria.status && criteria.status.length > 0) {
      query = query.in('status', criteria.status);
    }

    if (criteria.planIds && criteria.planIds.length > 0) {
      query = query.in('plan_id', criteria.planIds);
    }

    if (criteria.dateRange) {
      query = query
        .gte('created_at', criteria.dateRange.from)
        .lte('created_at', criteria.dateRange.to);
    }

    if (criteria.hasActiveSubscription !== undefined) {
      if (criteria.hasActiveSubscription) {
        query = query.not('subscription_id', 'is', null);
      } else {
        query = query.is('subscription_id', null);
      }
    }

    const { data: tenants, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to perform advanced tenant search', { error, criteria });
      throw new DatabaseError('Failed to perform advanced tenant search', { error });
    }

    // Filter by user count range if specified (placeholder)
    let filteredTenants = tenants || [];
    if (criteria.userCountRange) {
      // Placeholder for user count filtering
      // In production, this would join with users table and filter
    }

    return filteredTenants as Tenant[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error performing advanced tenant search', { error, criteria });
    throw new DatabaseError('Failed to perform advanced tenant search', { error });
  }
}

/**
 * Full-text search on tenants
 */
export async function fullTextSearchTenants(searchTerm: string, options: {
  page?: number;
  pageSize?: number;
  status?: TenantStatus;
} = {}): Promise<TenantSearchResult> {
  try {
    const { page = 1, pageSize = 20, status } = options;

    // Placeholder for full-text search
    // In production, this would use a full-text search engine like PostgreSQL tsvector
    return searchTenants({
      query: searchTerm,
      status,
      page,
      pageSize,
    });
  } catch (error) {
    logger.error('Failed to perform full-text search on tenants', { error, searchTerm });
    throw new DatabaseError('Failed to perform full-text search on tenants', { error });
  }
}

/**
 * Get tenant suggestions (autocomplete)
 */
export async function getTenantSuggestions(query: string, limit: number = 5): Promise<Array<{
  id: string;
  name: string;
  slug: string;
}>> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const supabase = getSupabaseClient();

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      logger.error('Failed to get tenant suggestions', { error, query });
      throw new DatabaseError('Failed to get tenant suggestions', { error });
    }

    return (tenants || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
    }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error getting tenant suggestions', { error, query });
    throw new DatabaseError('Failed to get tenant suggestions', { error });
  }
}

/**
 * Filter tenants by custom criteria
 */
export async function filterTenantsByCustomCriteria(criteria: {
  [key: string]: unknown;
}): Promise<Tenant[]> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('tenants')
      .select('*');

    // Apply custom filters
    for (const [key, value] of Object.entries(criteria)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          query = query.ilike(key, `%${value}%`);
        } else {
          query = query.eq(key, value);
        }
      }
    }

    const { data: tenants, error } = await query;

    if (error) {
      logger.error('Failed to filter tenants by custom criteria', { error, criteria });
      throw new DatabaseError('Failed to filter tenants by custom criteria', { error });
    }

    return (tenants || []) as Tenant[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error filtering tenants by custom criteria', { error, criteria });
    throw new DatabaseError('Failed to filter tenants by custom criteria', { error });
  }
}

/**
 * Get search facets
 */
export async function getSearchFacets(): Promise<{
  statuses: Array<{ value: string; count: number }>;
  plans: Array<{ value: string; count: number }>;
}> {
  try {
    const supabase = getSupabaseClient();

    const [statusResult, planResult] = await Promise.all([
      supabase.from('tenants').select('status'),
      supabase.from('tenants').select('plan_id'),
    ]);

    const statusCount: Record<string, number> = {};
    const planCount: Record<string, number> = {};

    for (const tenant of statusResult.data || []) {
      statusCount[tenant.status] = (statusCount[tenant.status] || 0) + 1;
    }

    for (const tenant of planResult.data || []) {
      if (tenant.plan_id) {
        planCount[tenant.plan_id] = (planCount[tenant.plan_id] || 0) + 1;
      }
    }

    return {
      statuses: Object.entries(statusCount).map(([value, count]) => ({ value, count })),
      plans: Object.entries(planCount).map(([value, count]) => ({ value, count })),
    };
  } catch (error) {
    logger.error('Failed to get search facets', { error });
    throw new DatabaseError('Failed to get search facets', { error });
  }
}
