import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Feature Flags Manager
// Dynamic feature flag management for tenants
// ============================================================================

/**
 * Feature Flag interface
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'string' | 'number';
  defaultValue: boolean | string | number;
  isGlobal: boolean;
  tenantOverrides: Record<string, boolean | string | number>;
  conditions: FlagCondition[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Flag Condition
 */
export interface FlagCondition {
  type: 'user_id' | 'tenant_id' | 'email_domain' | 'custom';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  enabledValue: boolean | string | number;
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(data: {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'string' | 'number';
  defaultValue: boolean | string | number;
  isGlobal?: boolean;
  conditions?: FlagCondition[];
}): Promise<FeatureFlag> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    // Check if key is already taken
    const { data: existing } = await supabase
      .from('feature_flags')
      .select('id')
      .eq('key', data.key)
      .single();

    if (existing) {
      throw new DatabaseError('Feature flag key already exists', { key: data.key });
    }

    // Create feature flag
    const flagId = `flag-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .insert({
        id: flagId,
        key: data.key,
        name: data.name,
        description: data.description,
        type: data.type,
        default_value: data.defaultValue,
        is_global: data.isGlobal ?? true,
        tenant_overrides: {},
        conditions: data.conditions || [],
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create feature flag', { error, data });
      throw new DatabaseError('Failed to create feature flag', { error });
    }

    logger.info('Feature flag created successfully', { flagId, key: data.key });

    // Invalidate cache
    cache.delete(`feature-flag:${flagId}`);
    cache.delete(`feature-flag:key:${data.key}`);

    return flag as FeatureFlag;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating feature flag', { error, data });
    throw new DatabaseError('Failed to create feature flag', { error });
  }
}

/**
 * Update feature flag
 */
export async function updateFeatureFlag(flagId: string, data: {
  name?: string;
  description?: string;
  defaultValue?: boolean | string | number;
  conditions?: FlagCondition[];
  isActive?: boolean;
}): Promise<FeatureFlag> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    // Get current flag
    const { data: current } = await supabase
      .from('feature_flags')
      .select('key')
      .eq('id', flagId)
      .single();

    if (!current) {
      throw new NotFoundError('Feature flag not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.defaultValue !== undefined) updateData.default_value = data.defaultValue;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .update(updateData)
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update feature flag', { error, flagId });
      throw new DatabaseError('Failed to update feature flag', { error });
    }

    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    logger.info('Feature flag updated successfully', { flagId });

    // Invalidate cache
    cache.delete(`feature-flag:${flagId}`);
    cache.delete(`feature-flag:key:${current.key}`);

    return flag as FeatureFlag;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating feature flag', { error, flagId });
    throw new DatabaseError('Failed to update feature flag', { error });
  }
}

/**
 * Delete feature flag
 */
export async function deleteFeatureFlag(flagId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', flagId);

    if (error) {
      logger.error('Failed to delete feature flag', { error, flagId });
      throw new DatabaseError('Failed to delete feature flag', { error });
    }

    logger.info('Feature flag deleted successfully', { flagId });

    // Invalidate cache
    cache.delete(`feature-flag:${flagId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting feature flag', { error, flagId });
    throw new DatabaseError('Failed to delete feature flag', { error });
  }
}

/**
 * Get feature flag by ID
 */
export async function getFeatureFlag(flagId: string): Promise<FeatureFlag> {
  try {
    // Check cache first
    const cached = cache.get<FeatureFlag>(`feature-flag:${flagId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single();

    if (error) {
      logger.error('Failed to fetch feature flag', { error, flagId });
      throw new DatabaseError('Failed to fetch feature flag', { error });
    }

    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    // Cache result
    cache.set(`feature-flag:${flagId}`, flag, cacheHelpers.ttl.MEDIUM);

    return flag as FeatureFlag;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching feature flag', { error, flagId });
    throw new DatabaseError('Failed to fetch feature flag', { error });
  }
}

/**
 * Get feature flag by key
 */
export async function getFeatureFlagByKey(key: string): Promise<FeatureFlag> {
  try {
    // Check cache first
    const cacheKey = `feature-flag:key:${key}`;
    const cached = cache.get<FeatureFlag>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      logger.error('Failed to fetch feature flag by key', { error, key });
      throw new DatabaseError('Failed to fetch feature flag', { error });
    }

    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    // Cache result
    cache.set(cacheKey, flag, cacheHelpers.ttl.MEDIUM);
    cache.set(`feature-flag:${flag.id}`, flag, cacheHelpers.ttl.MEDIUM);

    return flag as FeatureFlag;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching feature flag by key', { error, key });
    throw new DatabaseError('Failed to fetch feature flag', { error });
  }
}

/**
 * Set tenant override for feature flag
 */
export async function setTenantOverride(flagId: string, tenantId: string, value: boolean | string | number): Promise<FeatureFlag> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    // Get current flag
    const { data: current } = await supabase
      .from('feature_flags')
      .select('key, tenant_overrides')
      .eq('id', flagId)
      .single();

    if (!current) {
      throw new NotFoundError('Feature flag not found');
    }

    const overrides = current.tenant_overrides as Record<string, unknown>;
    overrides[tenantId] = value;

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .update({
        tenant_overrides: overrides,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to set tenant override', { error, flagId, tenantId });
      throw new DatabaseError('Failed to set tenant override', { error });
    }

    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    logger.info('Tenant override set successfully', { flagId, tenantId });

    // Invalidate cache
    cache.delete(`feature-flag:${flagId}`);
    cache.delete(`feature-flag:key:${current.key}`);
    cache.delete(`feature-flag:value:${flagId}:${tenantId}`);

    return flag as FeatureFlag;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error setting tenant override', { error, flagId, tenantId });
    throw new DatabaseError('Failed to set tenant override', { error });
  }
}

/**
 * Remove tenant override for feature flag
 */
export async function removeTenantOverride(flagId: string, tenantId: string): Promise<FeatureFlag> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    // Get current flag
    const { data: current } = await supabase
      .from('feature_flags')
      .select('key, tenant_overrides')
      .eq('id', flagId)
      .single();

    if (!current) {
      throw new NotFoundError('Feature flag not found');
    }

    const overrides = current.tenant_overrides as Record<string, unknown>;
    delete overrides[tenantId];

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .update({
        tenant_overrides: overrides,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to remove tenant override', { error, flagId, tenantId });
      throw new DatabaseError('Failed to remove tenant override', { error });
    }

    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    logger.info('Tenant override removed successfully', { flagId, tenantId });

    // Invalidate cache
    cache.delete(`feature-flag:${flagId}`);
    cache.delete(`feature-flag:key:${current.key}`);
    cache.delete(`feature-flag:value:${flagId}:${tenantId}`);

    return flag as FeatureFlag;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error removing tenant override', { error, flagId, tenantId });
    throw new DatabaseError('Failed to remove tenant override', { error });
  }
}

/**
 * Check if feature flag is enabled for tenant
 */
export async function isFeatureEnabled(key: string, tenantId?: string, context?: Record<string, unknown>): Promise<boolean | string | number> {
  try {
    const flag = await getFeatureFlagByKey(key);

    // Check if flag is active
    if (!flag.isActive) {
      return flag.defaultValue as boolean | string | number;
    }

    // Check tenant override
    if (tenantId && flag.tenantOverrides[tenantId] !== undefined) {
      return flag.tenantOverrides[tenantId] as boolean | string | number;
    }

    // Check conditions
    if (context && flag.conditions.length > 0) {
      for (const condition of flag.conditions) {
        if (evaluateCondition(condition, context)) {
          return condition.enabledValue as boolean | string | number;
        }
      }
    }

    // Return default value
    return flag.defaultValue as boolean | string | number;
  } catch (error) {
    // If flag doesn't exist or error, return false for safety
    logger.warn('Failed to check feature flag, returning default', { key, error });
    return false;
  }
}

/**
 * Evaluate flag condition
 */
function evaluateCondition(condition: FlagCondition, context: Record<string, unknown>): boolean {
  switch (condition.type) {
    case 'user_id':
      return context.userId === condition.value;
    case 'tenant_id':
      return context.tenantId === condition.value;
    case 'email_domain':
      const email = context.email as string;
      return Boolean(email && email.endsWith(`@${condition.value}`));
    case 'custom':
      // Custom conditions would need more complex evaluation
      return false;
    default:
      return false;
  }
}

/**
 * List feature flags
 */
export async function listFeatureFlags(options: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  isGlobal?: boolean;
  search?: string;
}): Promise<{ flags: FeatureFlag[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isActive, isGlobal, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('feature_flags')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (isGlobal !== undefined) {
      query = query.eq('is_global', isGlobal);
    }

    if (search) {
      query = query.or(`key.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: flags, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list feature flags', { error });
      throw new DatabaseError('Failed to list feature flags', { error });
    }

    return {
      flags: (flags || []) as FeatureFlag[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing feature flags', { error });
    throw new DatabaseError('Failed to list feature flags', { error });
  }
}

/**
 * Get all feature flags for tenant
 */
export async function getTenantFeatureFlags(tenantId: string): Promise<Record<string, boolean | string | number>> {
  try {
    const cacheKey = `feature-flags:tenant:${tenantId}`;
    const cached = cache.get<Record<string, boolean | string | number>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { flags } = await listFeatureFlags({ isActive: true });
    const result: Record<string, boolean | string | number> = {};

    for (const flag of flags) {
      const value = await isFeatureEnabled(flag.key, tenantId);
      result[flag.key] = value;
    }

    cache.set(cacheKey, result, cacheHelpers.ttl.SHORT);
    return result;
  } catch (error) {
    logger.error('Failed to get tenant feature flags', { error, tenantId });
    throw new DatabaseError('Failed to get tenant feature flags', { error });
  }
}

/**
 * Activate feature flag
 */
export async function activateFeatureFlag(flagId: string): Promise<FeatureFlag> {
  return updateFeatureFlag(flagId, { isActive: true });
}

/**
 * Deactivate feature flag
 */
export async function deactivateFeatureFlag(flagId: string): Promise<FeatureFlag> {
  return updateFeatureFlag(flagId, { isActive: false });
}
