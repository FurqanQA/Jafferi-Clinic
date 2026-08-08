import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { isRedisInitialized, redisUtils } from './redis';

// ============================================================================
// Health Manager
// System health checks and status reporting
// ============================================================================

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthCheck>;
  timestamp: string;
  uptime: number;
}

/**
 * Individual health check
 */
export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * System information
 */
export interface SystemInfo {
  version: string;
  environment: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
}

/**
 * Perform health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, HealthCheck> = {};
  const startTime = Date.now();

  try {
    // Database health check
    checks.database = await checkDatabase();

    // Redis health check (if initialized)
    if (isRedisInitialized()) {
      checks.redis = await checkRedis();
    }

    // Cache health check
    checks.cache = await checkCache();

    // Memory health check
    checks.memory = await checkMemory();

    // CPU health check
    checks.cpu = await checkCPU();

    // Determine overall status
    const statuses = Object.values(checks).map(c => c.status);
    const hasFailures = statuses.includes('fail');
    const hasWarnings = statuses.includes('warn');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasFailures) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const responseTime = Date.now() - startTime;

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  } catch (error) {
    logger.error('Health check failed', { error });
    
    return {
      status: 'unhealthy',
      checks: {
        system: {
          status: 'fail',
          message: 'Health check execution failed',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        },
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = getSupabaseClient();
    
    // Simple query to test connection
    const { error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (error) {
      return {
        status: 'fail',
        message: 'Database connection failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error.message },
      };
    }

    const responseTime = Date.now() - startTime;

    // Warn if response time is slow
    if (responseTime > 1000) {
      return {
        status: 'warn',
        message: 'Database response time is slow',
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Database is healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Database check failed',
      responseTime: Date.now() - startTime,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const pong = await redisUtils.ping();
    const responseTime = Date.now() - startTime;

    if (!pong) {
      return {
        status: 'fail',
        message: 'Redis ping failed',
        responseTime,
      };
    }

    if (responseTime > 500) {
      return {
        status: 'warn',
        message: 'Redis response time is slow',
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Redis is healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Redis check failed',
      responseTime: Date.now() - startTime,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Check cache health
 */
async function checkCache(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Test cache operations
    const testKey = 'health-check-test';
    const testValue = 'test-value';
    
    cache.set(testKey, testValue, 1000);
    const retrieved = cache.get(testKey);
    cache.delete(testKey);

    const responseTime = Date.now() - startTime;

    if (retrieved !== testValue) {
      return {
        status: 'fail',
        message: 'Cache read/write failed',
        responseTime,
      };
    }

    if (responseTime > 100) {
      return {
        status: 'warn',
        message: 'Cache response time is slow',
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Cache is healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Cache check failed',
      responseTime: Date.now() - startTime,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Check memory health
 */
async function checkMemory(): Promise<HealthCheck> {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    if (percentage > 90) {
      return {
        status: 'fail',
        message: 'Memory usage is critical',
        metadata: {
          used: usedMemory,
          total: totalMemory,
          percentage,
        },
      };
    }

    if (percentage > 75) {
      return {
        status: 'warn',
        message: 'Memory usage is high',
        metadata: {
          used: usedMemory,
          total: totalMemory,
          percentage,
        },
      };
    }

    return {
      status: 'pass',
      message: 'Memory usage is normal',
      metadata: {
        used: usedMemory,
        total: totalMemory,
        percentage,
      },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Memory check failed',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Check CPU health
 */
async function checkCPU(): Promise<HealthCheck> {
  try {
    // Placeholder for CPU check
    // In production, use a library like systeminformation or os-utils
    return {
      status: 'pass',
      message: 'CPU check not implemented',
      metadata: {
        cores: require('os').cpus().length,
      },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'CPU check failed',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Get system information
 */
export function getSystemInfo(): SystemInfo {
  const os = require('os');
  const memoryUsage = process.memoryUsage();

  return {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    uptime: process.uptime(),
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    },
    cpu: {
      usage: 0, // Placeholder - requires external library
      cores: os.cpus().length,
    },
  };
}

/**
 * Quick health check (returns only status)
 */
export async function quickHealthCheck(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  const result = await performHealthCheck();
  return result.status;
}

/**
 * Check specific component
 */
export async function checkComponent(component: 'database' | 'redis' | 'cache' | 'memory' | 'cpu'): Promise<HealthCheck> {
  switch (component) {
    case 'database':
      return checkDatabase();
    case 'redis':
      return checkRedis();
    case 'cache':
      return checkCache();
    case 'memory':
      return checkMemory();
    case 'cpu':
      return checkCPU();
    default:
      return {
        status: 'fail',
        message: 'Unknown component',
      };
  }
}

/**
 * Get health check history
 */
export async function getHealthCheckHistory(limit: number = 100): Promise<HealthCheckResult[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: history, error } = await supabase
      .from('health_checks')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch health check history', { error });
      throw new DatabaseError('Failed to fetch health check history', { error });
    }

    return (history || []) as HealthCheckResult[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching health check history', { error });
    throw new DatabaseError('Failed to fetch health check history', { error });
  }
}

/**
 * Save health check result
 */
export async function saveHealthCheckResult(result: HealthCheckResult): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('health_checks')
      .insert({
        status: result.status,
        checks: result.checks,
        timestamp: result.timestamp,
        uptime: result.uptime,
      });

    if (error) {
      logger.error('Failed to save health check result', { error });
      throw new DatabaseError('Failed to save health check result', { error });
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error saving health check result', { error });
    throw new DatabaseError('Failed to save health check result', { error });
  }
}

/**
 * Get health statistics
 */
export async function getHealthStatistics(): Promise<{
  totalChecks: number;
  healthyChecks: number;
  degradedChecks: number;
  unhealthyChecks: number;
  averageUptime: number;
}> {
  try {
    const history = await getHealthCheckHistory(1000);

    if (history.length === 0) {
      return {
        totalChecks: 0,
        healthyChecks: 0,
        degradedChecks: 0,
        unhealthyChecks: 0,
        averageUptime: 0,
      };
    }

    const healthyChecks = history.filter(h => h.status === 'healthy').length;
    const degradedChecks = history.filter(h => h.status === 'degraded').length;
    const unhealthyChecks = history.filter(h => h.status === 'unhealthy').length;

    const totalUptime = history.reduce((sum, h) => sum + h.uptime, 0);
    const averageUptime = totalUptime / history.length;

    return {
      totalChecks: history.length,
      healthyChecks,
      degradedChecks,
      unhealthyChecks,
      averageUptime,
    };
  } catch (error) {
    logger.error('Failed to get health statistics', { error });
    throw new DatabaseError('Failed to get health statistics', { error });
  }
}

/**
 * Liveness probe
 */
export async function livenessProbe(): Promise<boolean> {
  try {
    // Simple check if the application is running
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Readiness probe
 */
export async function readinessProbe(): Promise<boolean> {
  try {
    // Check if application is ready to handle requests
    const dbCheck = await checkDatabase();
    return dbCheck.status === 'pass';
  } catch (error) {
    return false;
  }
}
