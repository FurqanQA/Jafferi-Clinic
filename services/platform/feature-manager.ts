import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';
import { isFeatureEnabled, getFeatureFlagByKey, setTenantOverride as setFlagTenantOverride } from './feature-flags';

// ============================================================================
// Feature Manager
// High-level feature management and orchestration
// ============================================================================

/**
 * Feature interface
 */
export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  dependencies: string[];
  isEnabled: boolean;
  isBeta: boolean;
  isDeprecated: boolean;
  deprecationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature dependency check result
 */
export interface DependencyCheckResult {
  satisfied: boolean;
  missing: string[];
  circular: boolean;
}

/**
 * Create a new feature
 */
export async function createFeature(data: {
  key: string;
  name: string;
  description: string;
  category: string;
  dependencies?: string[];
  isBeta?: boolean;
}): Promise<Feature> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    // Check if key is already taken
    const { data: existing } = await supabase
      .from('features')
      .select('id')
      .eq('key', data.key)
      .single();

    if (existing) {
      throw new DatabaseError('Feature key already exists', { key: data.key });
    }

    // Create feature
    const featureId = `feature-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: feature, error } = await supabase
      .from('features')
      .insert({
        id: featureId,
        key: data.key,
        name: data.name,
        description: data.description,
        category: data.category,
        dependencies: data.dependencies || [],
        is_enabled: false,
        is_beta: data.isBeta ?? false,
        is_deprecated: false,
        deprecation_date: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create feature', { error, data });
      throw new DatabaseError('Failed to create feature', { error });
    }

    logger.info('Feature created successfully', { featureId, key: data.key });

    // Invalidate cache
    cache.delete(`feature:${featureId}`);
    cache.delete(`feature:key:${data.key}`);

    return feature as Feature;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating feature', { error, data });
    throw new DatabaseError('Failed to create feature', { error });
  }
}

/**
 * Update feature
 */
export async function updateFeature(featureId: string, data: {
  name?: string;
  description?: string;
  category?: string;
  dependencies?: string[];
  isBeta?: boolean;
  isDeprecated?: boolean;
  deprecationDate?: string | null;
}): Promise<Feature> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    // Get current feature
    const { data: current } = await supabase
      .from('features')
      .select('key')
      .eq('id', featureId)
      .single();

    if (!current) {
      throw new NotFoundError('Feature not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.dependencies !== undefined) updateData.dependencies = data.dependencies;
    if (data.isBeta !== undefined) updateData.is_beta = data.isBeta;
    if (data.isDeprecated !== undefined) updateData.is_deprecated = data.isDeprecated;
    if (data.deprecationDate !== undefined) updateData.deprecation_date = data.deprecationDate;

    const { data: feature, error } = await supabase
      .from('features')
      .update(updateData)
      .eq('id', featureId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update feature', { error, featureId });
      throw new DatabaseError('Failed to update feature', { error });
    }

    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    logger.info('Feature updated successfully', { featureId });

    // Invalidate cache
    cache.delete(`feature:${featureId}`);
    cache.delete(`feature:key:${current.key}`);

    return feature as Feature;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating feature', { error, featureId });
    throw new DatabaseError('Failed to update feature', { error });
  }
}

/**
 * Delete feature
 */
export async function deleteFeature(featureId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.FEATURE_FLAGS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', featureId);

    if (error) {
      logger.error('Failed to delete feature', { error, featureId });
      throw new DatabaseError('Failed to delete feature', { error });
    }

    logger.info('Feature deleted successfully', { featureId });

    // Invalidate cache
    cache.delete(`feature:${featureId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting feature', { error, featureId });
    throw new DatabaseError('Failed to delete feature', { error });
  }
}

/**
 * Get feature by ID
 */
export async function getFeature(featureId: string): Promise<Feature> {
  try {
    // Check cache first
    const cached = cache.get<Feature>(`feature:${featureId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: feature, error } = await supabase
      .from('features')
      .select('*')
      .eq('id', featureId)
      .single();

    if (error) {
      logger.error('Failed to fetch feature', { error, featureId });
      throw new DatabaseError('Failed to fetch feature', { error });
    }

    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Cache result
    cache.set(`feature:${featureId}`, feature, cacheHelpers.ttl.MEDIUM);

    return feature as Feature;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching feature', { error, featureId });
    throw new DatabaseError('Failed to fetch feature', { error });
  }
}

/**
 * Get feature by key
 */
export async function getFeatureByKey(key: string): Promise<Feature> {
  try {
    // Check cache first
    const cacheKey = `feature:key:${key}`;
    const cached = cache.get<Feature>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: feature, error } = await supabase
      .from('features')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      logger.error('Failed to fetch feature by key', { error, key });
      throw new DatabaseError('Failed to fetch feature', { error });
    }

    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Cache result
    cache.set(cacheKey, feature, cacheHelpers.ttl.MEDIUM);
    cache.set(`feature:${feature.id}`, feature, cacheHelpers.ttl.MEDIUM);

    return feature as Feature;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching feature by key', { error, key });
    throw new DatabaseError('Failed to fetch feature', { error });
  }
}

/**
 * Enable feature for tenant
 */
export async function enableFeature(featureKey: string, tenantId: string): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    // Enable the feature flag
    await setFeatureFlagValue(featureKey, tenantId, true);

    logger.info('Feature enabled for tenant', { featureKey, tenantId });

    // Invalidate cache
    cache.delete(`features:tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error enabling feature', { error, featureKey, tenantId });
    throw new DatabaseError('Failed to enable feature', { error });
  }
}

/**
 * Disable feature for tenant
 */
export async function disableFeature(featureKey: string, tenantId: string): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.FEATURE_FLAGS);

    // Disable the feature flag
    await setFeatureFlagValue(featureKey, tenantId, false);

    logger.info('Feature disabled for tenant', { featureKey, tenantId });

    // Invalidate cache
    cache.delete(`features:tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error disabling feature', { error, featureKey, tenantId });
    throw new DatabaseError('Failed to disable feature', { error });
  }
}

/**
 * Set feature flag value
 */
async function setFeatureFlagValue(featureKey: string, tenantId: string, value: boolean | string | number): Promise<void> {
  try {
    const flag = await getFeatureFlagByKey(featureKey);
    await setFlagTenantOverride(flag.id, tenantId, value);
  } catch (error) {
    // If flag doesn't exist, create it
    if (error instanceof NotFoundError) {
      const { createFeatureFlag } = await import('./feature-flags');
      const flag = await createFeatureFlag({
        key: featureKey,
        name: featureKey,
        description: `Auto-generated flag for feature ${featureKey}`,
        type: 'boolean',
        defaultValue: false,
      });
      await setFlagTenantOverride(flag.id, tenantId, value);
    } else {
      throw error;
    }
  }
}

/**
 * Check feature dependencies
 */
export async function checkFeatureDependencies(featureKey: string, tenantId: string): Promise<DependencyCheckResult> {
  try {
    const feature = await getFeatureByKey(featureKey);
    const missing: string[] = [];
    const visited = new Set<string>();

    // Check for circular dependencies
    function hasCircular(key: string, path: Set<string>): boolean {
      if (path.has(key)) return true;
      path.add(key);
      
      const deps = feature.dependencies;
      for (const dep of deps) {
        if (hasCircular(dep, new Set(path))) return true;
      }
      return false;
    }

    if (hasCircular(featureKey, new Set())) {
      return { satisfied: false, missing, circular: true };
    }

    // Check if all dependencies are enabled
    for (const depKey of feature.dependencies) {
      try {
        const enabled = await isFeatureEnabled(depKey, tenantId);
        if (!enabled) {
          missing.push(depKey);
        }
      } catch (error) {
        missing.push(depKey);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
      circular: false,
    };
  } catch (error) {
    logger.error('Failed to check feature dependencies', { error, featureKey });
    throw new DatabaseError('Failed to check feature dependencies', { error });
  }
}

/**
 * List features
 */
export async function listFeatures(options: {
  page?: number;
  pageSize?: number;
  category?: string;
  isBeta?: boolean;
  isDeprecated?: boolean;
  search?: string;
}): Promise<{ features: Feature[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, category, isBeta, isDeprecated, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('features')
      .select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (isBeta !== undefined) {
      query = query.eq('is_beta', isBeta);
    }

    if (isDeprecated !== undefined) {
      query = query.eq('is_deprecated', isDeprecated);
    }

    if (search) {
      query = query.or(`key.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: features, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list features', { error });
      throw new DatabaseError('Failed to list features', { error });
    }

    return {
      features: (features || []) as Feature[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing features', { error });
    throw new DatabaseError('Failed to list features', { error });
  }
}

/**
 * Get enabled features for tenant
 */
export async function getTenantEnabledFeatures(tenantId: string): Promise<Feature[]> {
  try {
    const cacheKey = `features:tenant:${tenantId}`;
    const cached = cache.get<Feature[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    // Get all features
    const { data: features } = await supabase
      .from('features')
      .select('*')
      .eq('is_enabled', true);

    const enabledFeatures: Feature[] = [];

    for (const feature of features || []) {
      try {
        const enabled = await isFeatureEnabled(feature.key, tenantId);
        if (enabled) {
          enabledFeatures.push(feature as Feature);
        }
      } catch (error) {
        // Skip features that can't be checked
        continue;
      }
    }

    cache.set(cacheKey, enabledFeatures, cacheHelpers.ttl.SHORT);
    return enabledFeatures;
  } catch (error) {
    logger.error('Failed to get tenant enabled features', { error, tenantId });
    throw new DatabaseError('Failed to get tenant enabled features', { error });
  }
}

/**
 * Get feature categories
 */
export async function getFeatureCategories(): Promise<string[]> {
  try {
    const cacheKey = 'feature:categories';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: features } = await supabase
      .from('features')
      .select('category');

    const categories = new Set<string>();
    for (const feature of features || []) {
      categories.add(feature.category);
    }

    const result = Array.from(categories);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get feature categories', { error });
    throw new DatabaseError('Failed to get feature categories', { error });
  }
}

/**
 * Get deprecated features
 */
export async function getDeprecatedFeatures(): Promise<Feature[]> {
  try {
    const { features } = await listFeatures({ isDeprecated: true, pageSize: 100 });
    return features;
  } catch (error) {
    logger.error('Failed to get deprecated features', { error });
    throw new DatabaseError('Failed to get deprecated features', { error });
  }
}

/**
 * Get beta features
 */
export async function getBetaFeatures(): Promise<Feature[]> {
  try {
    const { features } = await listFeatures({ isBeta: true, pageSize: 100 });
    return features;
  } catch (error) {
    logger.error('Failed to get beta features', { error });
    throw new DatabaseError('Failed to get beta features', { error });
  }
}
