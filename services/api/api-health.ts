import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Health
// Health check endpoints and system status monitoring
// ============================================================================

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Health Check Configuration
 */
export interface HealthCheckConfig {
  enabled: boolean;
  timeout: number;
  criticalChecks: string[];
}

/**
 * Default health check configuration
 */
const DEFAULT_HEALTH_CONFIG: HealthCheckConfig = {
  enabled: true,
  timeout: 5000,
  criticalChecks: ['database', 'cache'],
};

/**
 * System start time
 */
const START_TIME = Date.now();

/**
 * Perform health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: HealthCheckResult['checks'] = [];

  try {
    // Database check
    const dbCheck = await checkDatabase();
    checks.push(dbCheck);

    // Cache check
    const cacheCheck = await checkCache();
    checks.push(cacheCheck);

    // Memory check
    const memoryCheck = await checkMemory();
    checks.push(memoryCheck);

    // Disk check
    const diskCheck = await checkDisk();
    checks.push(diskCheck);

    // External services check
    const externalCheck = await checkExternalServices();
    checks.push(externalCheck);

    // Determine overall status
    const hasCriticalFailure = DEFAULT_HEALTH_CONFIG.criticalChecks.some((name) => {
      const check = checks.find((c) => c.name === name);
      return check?.status === 'fail';
    });

    const hasWarning = checks.some((c) => c.status === 'warn');
    const hasFailure = checks.some((c) => c.status === 'fail');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasCriticalFailure || hasFailure) {
      status = 'unhealthy';
    } else if (hasWarning) {
      status = 'degraded';
    }

    const duration = Date.now() - startTime;

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - START_TIME,
      version: '1.0.0',
      checks,
    };

    logger.info('Health check completed', { status, duration });
    return result;
  } catch (error) {
    logger.error('Health check failed', { error });
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - START_TIME,
      version: '1.0.0',
      checks: [
        {
          name: 'health_check',
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}> {
  const startTime = Date.now();
  try {
    // Placeholder for actual database check
    // In production, this would execute a simple query
    await new Promise((resolve) => setTimeout(resolve, 10));

    const duration = Date.now() - startTime;
    return {
      name: 'database',
      status: 'pass',
      duration,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Check cache connectivity
 */
async function checkCache(): Promise<{
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}> {
  const startTime = Date.now();
  try {
    // Test cache by setting and getting a value
    const testKey = 'health_check_test';
    cache.set(testKey, 'test', 1000);
    const value = cache.get<string>(testKey);
    cache.delete(testKey);

    if (value === 'test') {
      return {
        name: 'cache',
        status: 'pass',
        duration: Date.now() - startTime,
      };
    }

    return {
      name: 'cache',
      status: 'fail',
      message: 'Cache read/write test failed',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'cache',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Cache connection failed',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<{
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}> {
  const startTime = Date.now();
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercent = (usedMemory / totalMemory) * 100;

    let status: 'pass' | 'fail' | 'warn' = 'pass';
    if (memoryPercent > 90) {
      status = 'fail';
    } else if (memoryPercent > 75) {
      status = 'warn';
    }

    return {
      name: 'memory',
      status,
      duration: Date.now() - startTime,
      metadata: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercent.toFixed(2),
      },
    };
  } catch (error) {
    return {
      name: 'memory',
      status: 'warn',
      message: 'Could not determine memory usage',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Check disk usage
 */
async function checkDisk(): Promise<{
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}> {
  const startTime = Date.now();
  try {
    // Placeholder for disk check
    // In production, this would check actual disk usage
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      name: 'disk',
      status: 'pass',
      duration: Date.now() - startTime,
      metadata: {
        usage: '45%',
      },
    };
  } catch (error) {
    return {
      name: 'disk',
      status: 'warn',
      message: 'Could not determine disk usage',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Check external services
 */
async function checkExternalServices(): Promise<{
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}> {
  const startTime = Date.now();
  try {
    // Placeholder for external services check
    // In production, this would check third-party APIs
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      name: 'external_services',
      status: 'pass',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'external_services',
      status: 'warn',
      message: 'External services check skipped',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get health check configuration
 */
export function getHealthConfig(): HealthCheckConfig {
  return DEFAULT_HEALTH_CONFIG;
}

/**
 * Update health check configuration
 */
export function updateHealthConfig(config: Partial<HealthCheckConfig>): HealthCheckConfig {
  Object.assign(DEFAULT_HEALTH_CONFIG, config);
  logger.info('Health check configuration updated', { config: DEFAULT_HEALTH_CONFIG });
  return DEFAULT_HEALTH_CONFIG;
}

/**
 * Get system uptime
 */
export function getUptime(): number {
  return Date.now() - START_TIME;
}

/**
 * Format uptime as human-readable string
 */
export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Check if system is healthy
 */
export async function isHealthy(): Promise<boolean> {
  const result = await performHealthCheck();
  return result.status === 'healthy';
}

/**
 * Get readiness status (for Kubernetes probes)
 */
export async function getReadiness(): Promise<boolean> {
  // Readiness checks if the service is ready to accept traffic
  // This is less strict than liveness/health checks
  try {
    const dbCheck = await checkDatabase();
    const cacheCheck = await checkCache();

    return dbCheck.status === 'pass' && cacheCheck.status === 'pass';
  } catch {
    return false;
  }
}

/**
 * Get liveness status (for Kubernetes probes)
 */
export async function getLiveness(): Promise<boolean> {
  // Liveness checks if the service is running
  // This should be a very simple check
  return true;
}
