import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Environment Manager
// Environment configuration and management
// ============================================================================

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  region: string;
  status: 'active' | 'inactive' | 'maintenance';
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get environment configuration
 */
export async function getEnvironmentConfig(environment: 'development' | 'staging' | 'production'): Promise<EnvironmentConfig | null> {
  try {
    const cacheKey = `environment:${environment}`;
    const cached = cache.get<EnvironmentConfig>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: config, error } = await supabase
      .from('environment_configs')
      .select('*')
      .eq('type', environment)
      .single();

    if (error) {
      logger.error('Failed to fetch environment config', { error, environment });
      throw new DatabaseError('Failed to fetch environment config', { error });
    }

    if (!config) {
      return null;
    }

    const environmentConfig = config as EnvironmentConfig;
    cache.set(cacheKey, environmentConfig, 300000); // 5 minutes

    return environmentConfig;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching environment config', { error, environment });
    throw new DatabaseError('Failed to fetch environment config', { error });
  }
}

/**
 * List environment configurations
 */
export async function listEnvironmentConfigs(): Promise<EnvironmentConfig[]> {
  try {
    const cacheKey = 'environments:all';
    const cached = cache.get<EnvironmentConfig[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: configs, error } = await supabase
      .from('environment_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list environment configs', { error });
      throw new DatabaseError('Failed to list environment configs', { error });
    }

    const environmentConfigs = (configs || []) as EnvironmentConfig[];
    cache.set(cacheKey, environmentConfigs, 300000); // 5 minutes

    return environmentConfigs;
  } catch (error) {
    logger.error('Unexpected error listing environment configs', { error });
    throw new DatabaseError('Failed to list environment configs', { error });
  }
}

/**
 * Update environment configuration
 */
export async function updateEnvironmentConfig(
  environment: 'development' | 'staging' | 'production',
  config: Record<string, unknown>,
  updatedBy: string
): Promise<EnvironmentConfig> {
  try {
    await validatePlatformWritePermission(PlatformResource.ENVIRONMENT);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: environmentConfig, error } = await supabase
      .from('environment_configs')
      .update({
        config,
        updated_at: now,
      })
      .eq('type', environment)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update environment config', { error, environment });
      throw new DatabaseError('Failed to update environment config', { error });
    }

    if (!environmentConfig) {
      throw new NotFoundError('Environment configuration not found');
    }

    logger.info('Environment configuration updated', { environment, updatedBy });

    // Invalidate cache
    cache.delete(`environment:${environment}`);
    cache.delete('environments:all');

    return environmentConfig as EnvironmentConfig;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating environment config', { error, environment });
    throw new DatabaseError('Failed to update environment config', { error });
  }
}

/**
 * Set environment status
 */
export async function setEnvironmentStatus(
  environment: 'development' | 'staging' | 'production',
  status: 'active' | 'inactive' | 'maintenance',
  updatedBy: string
): Promise<EnvironmentConfig> {
  try {
    await validatePlatformWritePermission(PlatformResource.ENVIRONMENT);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: environmentConfig, error } = await supabase
      .from('environment_configs')
      .update({
        status,
        updated_at: now,
      })
      .eq('type', environment)
      .select()
      .single();

    if (error) {
      logger.error('Failed to set environment status', { error, environment, status });
      throw new DatabaseError('Failed to set environment status', { error });
    }

    if (!environmentConfig) {
      throw new NotFoundError('Environment configuration not found');
    }

    logger.info('Environment status updated', { environment, status, updatedBy });

    // Invalidate cache
    cache.delete(`environment:${environment}`);
    cache.delete('environments:all');

    return environmentConfig as EnvironmentConfig;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error setting environment status', { error, environment });
    throw new DatabaseError('Failed to set environment status', { error });
  }
}

/**
 * Get environment variable
 */
export async function getEnvironmentVariable(
  environment: 'development' | 'staging' | 'production',
  key: string
): Promise<string | null> {
  try {
    const config = await getEnvironmentConfig(environment);
    if (!config) {
      return null;
    }

    const value = config.config[key];
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch (error) {
    logger.error('Failed to get environment variable', { error, environment, key });
    throw new DatabaseError('Failed to get environment variable', { error });
  }
}

/**
 * Set environment variable
 */
export async function setEnvironmentVariable(
  environment: 'development' | 'staging' | 'production',
  key: string,
  value: unknown,
  updatedBy: string
): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.ENVIRONMENT);

    const config = await getEnvironmentConfig(environment);
    if (!config) {
      throw new NotFoundError('Environment configuration not found');
    }

    const updatedConfig = { ...config.config, [key]: value };
    await updateEnvironmentConfig(environment, updatedConfig, updatedBy);

    logger.debug('Environment variable set', { environment, key });
  } catch (error) {
    logger.error('Failed to set environment variable', { error, environment, key });
    throw new DatabaseError('Failed to set environment variable', { error });
  }
}

/**
 * Delete environment variable
 */
export async function deleteEnvironmentVariable(
  environment: 'development' | 'staging' | 'production',
  key: string,
  updatedBy: string
): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.ENVIRONMENT);

    const config = await getEnvironmentConfig(environment);
    if (!config) {
      throw new NotFoundError('Environment configuration not found');
    }

    const updatedConfig = { ...config.config };
    delete updatedConfig[key];
    await updateEnvironmentConfig(environment, updatedConfig, updatedBy);

    logger.debug('Environment variable deleted', { environment, key });
  } catch (error) {
    logger.error('Failed to delete environment variable', { error, environment, key });
    throw new DatabaseError('Failed to delete environment variable', { error });
  }
}

/**
 * Get environment health
 */
export async function getEnvironmentHealth(environment: 'development' | 'staging' | 'production'): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
}> {
  try {
    const config = await getEnvironmentConfig(environment);
    
    if (!config) {
      return {
        status: 'unhealthy',
        checks: [{ name: 'Configuration', status: 'fail', message: 'Configuration not found' }],
      };
    }

    if (config.status === 'maintenance') {
      return {
        status: 'degraded',
        checks: [{ name: 'Status', status: 'fail', message: 'Environment in maintenance' }],
      };
    }

    // Placeholder for health checks
    // In production, this would check:
    // - Database connectivity
    // - Service availability
    // - Resource utilization

    return {
      status: 'healthy',
      checks: [
        { name: 'Configuration', status: 'pass', message: 'Valid' },
        { name: 'Status', status: 'pass', message: 'Active' },
      ],
    };
  } catch (error) {
    logger.error('Failed to get environment health', { error, environment });
    throw new DatabaseError('Failed to get environment health', { error });
  }
}

/**
 * Get all environments status
 */
export async function getAllEnvironmentsStatus(): Promise<Array<{
  environment: string;
  status: 'active' | 'inactive' | 'maintenance';
  health: 'healthy' | 'degraded' | 'unhealthy';
}>> {
  try {
    const configs = await listEnvironmentConfigs();

    return configs.map(config => ({
      environment: config.type,
      status: config.status,
      health: config.status === 'active' ? 'healthy' : 'degraded',
    }));
  } catch (error) {
    logger.error('Failed to get all environments status', { error });
    throw new DatabaseError('Failed to get all environments status', { error });
  }
}

/**
 * Promote configuration between environments
 */
export async function promoteConfiguration(
  fromEnvironment: 'development' | 'staging' | 'production',
  toEnvironment: 'development' | 'staging' | 'production',
  promotedBy: string
): Promise<EnvironmentConfig> {
  try {
    await validatePlatformWritePermission(PlatformResource.ENVIRONMENT);

    const sourceConfig = await getEnvironmentConfig(fromEnvironment);
    if (!sourceConfig) {
      throw new NotFoundError('Source environment configuration not found');
    }

    await updateEnvironmentConfig(toEnvironment, sourceConfig.config, promotedBy);

    logger.info('Configuration promoted', { from: fromEnvironment, to: toEnvironment, promotedBy });

    const targetConfig = await getEnvironmentConfig(toEnvironment);
    return targetConfig as EnvironmentConfig;
  } catch (error) {
    logger.error('Failed to promote configuration', { error, fromEnvironment, toEnvironment });
    throw new DatabaseError('Failed to promote configuration', { error });
  }
}

/**
 * Get environment statistics
 */
export async function getEnvironmentStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}> {
  try {
    const configs = await listEnvironmentConfigs();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const config of configs) {
      byStatus[config.status] = (byStatus[config.status] || 0) + 1;
      byType[config.type] = (byType[config.type] || 0) + 1;
    }

    return {
      total: configs.length,
      byStatus,
      byType,
    };
  } catch (error) {
    logger.error('Failed to get environment statistics', { error });
    throw new DatabaseError('Failed to get environment statistics', { error });
  }
}

/**
 * Validate environment configuration
 */
export async function validateEnvironmentConfig(
  environment: 'development' | 'staging' | 'production'
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  try {
    const config = await getEnvironmentConfig(environment);

    if (!config) {
      return {
        isValid: false,
        errors: ['Configuration not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Placeholder for validation logic
    // In production, this would validate:
    // - Required configuration keys
    // - Data types
    // - Value ranges

    if (!config.region) {
      errors.push('Region is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    logger.error('Failed to validate environment config', { error, environment });
    throw new DatabaseError('Failed to validate environment config', { error });
  }
}
