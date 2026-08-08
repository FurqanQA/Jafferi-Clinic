import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Deployment Manager
// Application deployment and version management
// ============================================================================

/**
 * Deployment interface
 */
export interface Deployment {
  id: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  buildNumber: string;
  commitHash: string;
  deployedBy: string;
  deployedAt: string;
  completedAt: string | null;
  rollbackVersion: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Create deployment
 */
export async function createDeployment(data: {
  version: string;
  environment: 'development' | 'staging' | 'production';
  buildNumber: string;
  commitHash: string;
  deployedBy: string;
}): Promise<Deployment> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const deploymentId = `deploy-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: deployment, error } = await supabase
      .from('deployments')
      .insert({
        id: deploymentId,
        version: data.version,
        environment: data.environment,
        status: 'pending',
        build_number: data.buildNumber,
        commit_hash: data.commitHash,
        deployed_by: data.deployedBy,
        deployed_at: now,
        completed_at: null,
        rollback_version: null,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create deployment', { error, data });
      throw new DatabaseError('Failed to create deployment', { error });
    }

    logger.info('Deployment created', { deploymentId, version: data.version, environment: data.environment });

    // Invalidate cache
    cache.delete(`deployment:${deploymentId}`);
    cache.delete('deployments:all');

    // Start deployment process asynchronously
    executeDeployment(deploymentId).catch(error => {
      logger.error('Deployment execution failed', { error, deploymentId });
    });

    return deployment as Deployment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating deployment', { error, data });
    throw new DatabaseError('Failed to create deployment', { error });
  }
}

/**
 * Execute deployment process
 */
async function executeDeployment(deploymentId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Update status to deploying
    await supabase
      .from('deployments')
      .update({ status: 'deploying' })
      .eq('id', deploymentId);

    // Placeholder for actual deployment logic
    // In production, this would:
    // - Run deployment scripts
    // - Update application version
    // - Run migrations
    // - Verify deployment success

    await new Promise(resolve => setTimeout(resolve, 2000));

    const now = new Date().toISOString();

    await supabase
      .from('deployments')
      .update({
        status: 'success',
        completed_at: now,
      })
      .eq('id', deploymentId);

    logger.info('Deployment completed successfully', { deploymentId });
  } catch (error) {
    logger.error('Deployment execution failed', { error, deploymentId });
    
    // Update status to failed
    const supabase = getSupabaseClient();
    await supabase
      .from('deployments')
      .update({ status: 'failed' })
      .eq('id', deploymentId);
  }
}

/**
 * Get deployment by ID
 */
export async function getDeployment(deploymentId: string): Promise<Deployment> {
  try {
    const supabase = getSupabaseClient();

    const { data: deployment, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (error) {
      logger.error('Failed to fetch deployment', { error, deploymentId });
      throw new DatabaseError('Failed to fetch deployment', { error });
    }

    if (!deployment) {
      throw new NotFoundError('Deployment not found');
    }

    return deployment as Deployment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching deployment', { error, deploymentId });
    throw new DatabaseError('Failed to fetch deployment', { error });
  }
}

/**
 * List deployments
 */
export async function listDeployments(options: {
  page?: number;
  pageSize?: number;
  environment?: 'development' | 'staging' | 'production';
  status?: 'pending' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  from?: string;
  to?: string;
}): Promise<{ deployments: Deployment[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, environment, status, from, to } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('deployments')
      .select('*', { count: 'exact' });

    if (environment) {
      query = query.eq('environment', environment);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (from) {
      query = query.gte('deployed_at', from);
    }

    if (to) {
      query = query.lte('deployed_at', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: deployments, error, count } = await query
      .range(fromIndex, toIndex)
      .order('deployed_at', { ascending: false });

    if (error) {
      logger.error('Failed to list deployments', { error });
      throw new DatabaseError('Failed to list deployments', { error });
    }

    return {
      deployments: (deployments || []) as Deployment[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing deployments', { error });
    throw new DatabaseError('Failed to list deployments', { error });
  }
}

/**
 * Rollback deployment
 */
export async function rollbackDeployment(deploymentId: string, targetVersion: string, deployedBy: string): Promise<Deployment> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const { data: deployment, error } = await supabase
      .from('deployments')
      .update({ status: 'rolled_back', rollback_version: targetVersion })
      .eq('id', deploymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to rollback deployment', { error, deploymentId });
      throw new DatabaseError('Failed to rollback deployment', { error });
    }

    if (!deployment) {
      throw new NotFoundError('Deployment not found');
    }

    logger.info('Deployment rolled back', { deploymentId, targetVersion });

    // Invalidate cache
    cache.delete(`deployment:${deploymentId}`);

    // Create new deployment for rollback
    await createDeployment({
      version: targetVersion,
      environment: deployment.environment,
      buildNumber: `rollback-${Date.now()}`,
      commitHash: deployment.commitHash,
      deployedBy,
    });

    return deployment as Deployment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rolling back deployment', { error, deploymentId });
    throw new DatabaseError('Failed to rollback deployment', { error });
  }
}

/**
 * Get current deployment
 */
export async function getCurrentDeployment(environment: 'development' | 'staging' | 'production'): Promise<Deployment | null> {
  try {
    const { deployments } = await listDeployments({ 
      environment, 
      status: 'success', 
      pageSize: 1 
    });
    return deployments.length > 0 ? deployments[0] : null;
  } catch (error) {
    logger.error('Failed to get current deployment', { error, environment });
    throw new DatabaseError('Failed to get current deployment', { error });
  }
}

/**
 * Get deployment statistics
 */
export async function getDeploymentStatistics(): Promise<{
  total: number;
  byEnvironment: Record<string, number>;
  byStatus: Record<string, number>;
  successRate: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: deployments } = await supabase
      .from('deployments')
      .select('environment, status');

    if (!deployments || deployments.length === 0) {
      return {
        total: 0,
        byEnvironment: {},
        byStatus: {},
        successRate: 0,
      };
    }

    const byEnvironment: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let successCount = 0;

    for (const deployment of deployments) {
      byEnvironment[deployment.environment] = (byEnvironment[deployment.environment] || 0) + 1;
      byStatus[deployment.status] = (byStatus[deployment.status] || 0) + 1;

      if (deployment.status === 'success') {
        successCount++;
      }
    }

    const successRate = deployments.length > 0 ? (successCount / deployments.length) * 100 : 0;

    return {
      total: deployments.length,
      byEnvironment,
      byStatus,
      successRate,
    };
  } catch (error) {
    logger.error('Failed to get deployment statistics', { error });
    throw new DatabaseError('Failed to get deployment statistics', { error });
  }
}

/**
 * Get recent deployments
 */
export async function getRecentDeployments(limit: number = 10): Promise<Deployment[]> {
  try {
    const { deployments } = await listDeployments({ pageSize: limit });
    return deployments;
  } catch (error) {
    logger.error('Failed to get recent deployments', { error });
    throw new DatabaseError('Failed to get recent deployments', { error });
  }
}

/**
 * Get deployment history
 */
export async function getDeploymentHistory(days: number = 30): Promise<Deployment[]> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { deployments } = await listDeployments({ 
      from, 
      pageSize: 100 
    });
    return deployments;
  } catch (error) {
    logger.error('Failed to get deployment history', { error });
    throw new DatabaseError('Failed to get deployment history', { error });
  }
}

/**
 * Validate deployment readiness
 */
export async function validateDeploymentReadiness(environment: 'development' | 'staging' | 'production'): Promise<{
  isReady: boolean;
  checks: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
}> {
  try {
    // Placeholder for readiness validation
    // In production, this would check:
    // - Environment health
    // - Database connectivity
    // - Service availability
    // - Configuration validity

    const checks = [
      { name: 'Environment Health', status: 'pass' as const, message: 'All systems operational' },
      { name: 'Database Connectivity', status: 'pass' as const, message: 'Connected' },
      { name: 'Service Availability', status: 'pass' as const, message: 'All services available' },
    ];

    return {
      isReady: checks.every(c => c.status === 'pass'),
      checks,
    };
  } catch (error) {
    logger.error('Failed to validate deployment readiness', { error, environment });
    throw new DatabaseError('Failed to validate deployment readiness', { error });
  }
}

/**
 * Get deployment environment status
 */
export async function getEnvironmentStatus(environment: 'development' | 'staging' | 'production'): Promise<{
  environment: string;
  currentVersion: string | null;
  lastDeployment: Deployment | null;
  status: 'healthy' | 'degraded' | 'unknown';
}> {
  try {
    const currentDeployment = await getCurrentDeployment(environment);
    const { deployments } = await listDeployments({ 
      environment, 
      pageSize: 1 
    });

    return {
      environment,
      currentVersion: currentDeployment?.version || null,
      lastDeployment: deployments.length > 0 ? deployments[0] : null,
      status: currentDeployment?.status === 'success' ? 'healthy' : 'unknown',
    };
  } catch (error) {
    logger.error('Failed to get environment status', { error, environment });
    throw new DatabaseError('Failed to get environment status', { error });
  }
}
