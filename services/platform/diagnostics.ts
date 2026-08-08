import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { isRedisInitialized, redisUtils } from './redis';
import { performHealthCheck } from './health';

// ============================================================================
// Diagnostics Manager
// System diagnostics and troubleshooting tools
// ============================================================================

/**
 * Diagnostic report interface
 */
export interface DiagnosticReport {
  timestamp: string;
  system: SystemDiagnostic;
  database: DatabaseDiagnostic;
  cache: CacheDiagnostic;
  redis: RedisDiagnostic | null;
  environment: EnvironmentDiagnostic;
  issues: DiagnosticIssue[];
  recommendations: string[];
}

/**
 * System diagnostic
 */
export interface SystemDiagnostic {
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  platform: string;
  arch: string;
  nodeVersion: string;
}

/**
 * Database diagnostic
 */
export interface DatabaseDiagnostic {
  status: 'connected' | 'disconnected' | 'slow';
  responseTime: number;
  connectionPool?: {
    active: number;
    idle: number;
    total: number;
  };
  lastQuery?: string;
  error?: string;
}

/**
 * Cache diagnostic
 */
export interface CacheDiagnostic {
  status: 'active' | 'inactive' | 'error';
  size: number;
  hitRate: number;
  missRate: number;
  keys: number;
}

/**
 * Redis diagnostic
 */
export interface RedisDiagnostic {
  status: 'connected' | 'disconnected' | 'slow';
  responseTime: number;
  memory: {
    used: number;
    peak: number;
  };
  keys: number;
  error?: string;
}

/**
 * Environment diagnostic
 */
export interface EnvironmentDiagnostic {
  nodeEnv: string;
  region?: string;
  environmentVariables: Record<string, boolean>;
  configErrors: string[];
}

/**
 * Diagnostic issue
 */
export interface DiagnosticIssue {
  severity: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Run full diagnostic
 */
export async function runDiagnostics(): Promise<DiagnosticReport> {
  const issues: DiagnosticIssue[] = [];
  const recommendations: string[] = [];

  try {
    // System diagnostics
    const system = await diagnoseSystem();
    
    // Check memory
    if (system.memoryUsage.percentage > 90) {
      issues.push({
        severity: 'critical',
        component: 'system',
        message: 'Memory usage is critical',
        details: { percentage: system.memoryUsage.percentage },
      });
      recommendations.push('Investigate memory leaks or increase available memory');
    } else if (system.memoryUsage.percentage > 75) {
      issues.push({
        severity: 'warning',
        component: 'system',
        message: 'Memory usage is high',
        details: { percentage: system.memoryUsage.percentage },
      });
    }

    // Database diagnostics
    const database = await diagnoseDatabase();
    
    if (database.status === 'disconnected') {
      issues.push({
        severity: 'critical',
        component: 'database',
        message: 'Database is disconnected',
        details: { error: database.error },
      });
      recommendations.push('Check database connection and credentials');
    } else if (database.status === 'slow') {
      issues.push({
        severity: 'warning',
        component: 'database',
        message: 'Database response time is slow',
        details: { responseTime: database.responseTime },
      });
      recommendations.push('Optimize database queries or check network latency');
    }

    // Cache diagnostics
    const cache = await diagnoseCache();
    
    if (cache.status === 'error') {
      issues.push({
        severity: 'warning',
        component: 'cache',
        message: 'Cache has errors',
      });
    }

    // Redis diagnostics (if initialized)
    const redis = isRedisInitialized() ? await diagnoseRedis() : null;
    
    if (redis && redis.status === 'disconnected') {
      issues.push({
        severity: 'warning',
        component: 'redis',
        message: 'Redis is disconnected',
        details: { error: redis.error },
      });
      recommendations.push('Check Redis connection and configuration');
    }

    // Environment diagnostics
    const environment = await diagnoseEnvironment();
    
    if (environment.configErrors.length > 0) {
      issues.push({
        severity: 'warning',
        component: 'environment',
        message: 'Configuration errors detected',
        details: { errors: environment.configErrors },
      });
    }

    // Run health check
    const healthCheck = await performHealthCheck();
    
    if (healthCheck.status === 'unhealthy') {
      issues.push({
        severity: 'critical',
        component: 'health',
        message: 'System health check failed',
        details: { status: healthCheck.status },
      });
    } else if (healthCheck.status === 'degraded') {
      issues.push({
        severity: 'warning',
        component: 'health',
        message: 'System health is degraded',
        details: { status: healthCheck.status },
      });
    }

    return {
      timestamp: new Date().toISOString(),
      system,
      database,
      cache,
      redis,
      environment,
      issues,
      recommendations,
    };
  } catch (error) {
    logger.error('Diagnostics failed', { error });
    
    return {
      timestamp: new Date().toISOString(),
      system: await diagnoseSystem(),
      database: { status: 'disconnected', responseTime: 0 },
      cache: { status: 'error', size: 0, hitRate: 0, missRate: 0, keys: 0 },
      redis: null,
      environment: await diagnoseEnvironment(),
      issues: [{
        severity: 'critical',
        component: 'diagnostics',
        message: 'Diagnostic execution failed',
        details: { error: error instanceof Error ? error.message : String(error) },
      }],
      recommendations: ['Review system logs for detailed error information'],
    };
  }
}

/**
 * Diagnose system
 */
async function diagnoseSystem(): Promise<SystemDiagnostic> {
  const os = require('os');
  const memoryUsage = process.memoryUsage();

  return {
    uptime: process.uptime(),
    memoryUsage: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    },
    cpuUsage: 0, // Placeholder - requires external library
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
  };
}

/**
 * Diagnose database
 */
async function diagnoseDatabase(): Promise<DatabaseDiagnostic> {
  const startTime = Date.now();
  
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'disconnected',
        responseTime,
        error: error.message,
      };
    }

    const status = responseTime > 1000 ? 'slow' : 'connected';

    return {
      status,
      responseTime,
    };
  } catch (error) {
    return {
      status: 'disconnected',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Diagnose cache
 */
async function diagnoseCache(): Promise<CacheDiagnostic> {
  try {
    // Test cache operations
    const testKey = 'diagnostic-test';
    const testValue = 'test-value';
    
    cache.set(testKey, testValue, 1000);
    const retrieved = cache.get(testKey);
    cache.delete(testKey);

    const status = retrieved === testValue ? 'active' : 'error';

    return {
      status,
      size: 0, // In-memory cache size tracking not implemented
      hitRate: 0,
      missRate: 0,
      keys: 0,
    };
  } catch (error) {
    return {
      status: 'error',
      size: 0,
      hitRate: 0,
      missRate: 0,
      keys: 0,
    };
  }
}

/**
 * Diagnose Redis
 */
async function diagnoseRedis(): Promise<RedisDiagnostic> {
  const startTime = Date.now();
  
  try {
    const pong = await redisUtils.ping();
    const responseTime = Date.now() - startTime;

    if (!pong) {
      return {
        status: 'disconnected',
        responseTime,
        memory: { used: 0, peak: 0 },
        keys: 0,
        error: 'Ping failed',
      };
    }

    const status = responseTime > 500 ? 'slow' : 'connected';

    return {
      status,
      responseTime,
      memory: { used: 0, peak: 0 },
      keys: 0,
    };
  } catch (error) {
    return {
      status: 'disconnected',
      responseTime: Date.now() - startTime,
      memory: { used: 0, peak: 0 },
      keys: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Diagnose environment
 */
async function diagnoseEnvironment(): Promise<EnvironmentDiagnostic> {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const environmentVariables: Record<string, boolean> = {};
  const configErrors: string[] = [];

  for (const envVar of requiredEnvVars) {
    const isSet = process.env[envVar] !== undefined;
    environmentVariables[envVar] = isSet;
    
    if (!isSet) {
      configErrors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    region: process.env.REGION,
    environmentVariables,
    configErrors,
  };
}

/**
 * Get diagnostic history
 */
export async function getDiagnosticHistory(limit: number = 50): Promise<DiagnosticReport[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: history, error } = await supabase
      .from('diagnostic_reports')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch diagnostic history', { error });
      throw new DatabaseError('Failed to fetch diagnostic history', { error });
    }

    return (history || []) as DiagnosticReport[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching diagnostic history', { error });
    throw new DatabaseError('Failed to fetch diagnostic history', { error });
  }
}

/**
 * Save diagnostic report
 */
export async function saveDiagnosticReport(report: DiagnosticReport): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('diagnostic_reports')
      .insert({
        timestamp: report.timestamp,
        system: report.system,
        database: report.database,
        cache: report.cache,
        redis: report.redis,
        environment: report.environment,
        issues: report.issues,
        recommendations: report.recommendations,
      });

    if (error) {
      logger.error('Failed to save diagnostic report', { error });
      throw new DatabaseError('Failed to save diagnostic report', { error });
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error saving diagnostic report', { error });
    throw new DatabaseError('Failed to save diagnostic report', { error });
  }
}

/**
 * Get system logs
 */
export async function getSystemLogs(options: {
  level?: 'debug' | 'info' | 'warn' | 'error';
  limit?: number;
  from?: string;
  to?: string;
}): Promise<Array<{ timestamp: string; level: string; message: string; context?: Record<string, unknown> }>> {
  try {
    // Placeholder for log retrieval
    // In production, this would query a logs table or log aggregation service
    return [];
  } catch (error) {
    logger.error('Failed to get system logs', { error });
    throw new DatabaseError('Failed to get system logs', { error });
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrors(limit: number = 50): Promise<Array<{
  timestamp: string;
  error: string;
  stack?: string;
  context?: Record<string, unknown>;
}>> {
  try {
    // Placeholder for error retrieval
    // In production, this would query an errors table or error tracking service
    return [];
  } catch (error) {
    logger.error('Failed to get recent errors', { error });
    throw new DatabaseError('Failed to get recent errors', { error });
  }
}

/**
 * Run specific diagnostic
 */
export async function runSpecificDiagnostic(component: 'system' | 'database' | 'cache' | 'redis' | 'environment'): Promise<unknown> {
  switch (component) {
    case 'system':
      return diagnoseSystem();
    case 'database':
      return diagnoseDatabase();
    case 'cache':
      return diagnoseCache();
    case 'redis':
      return diagnoseRedis();
    case 'environment':
      return diagnoseEnvironment();
    default:
      throw new Error(`Unknown diagnostic component: ${component}`);
  }
}

/**
 * Get diagnostic summary
 */
export async function getDiagnosticSummary(): Promise<{
  totalReports: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  mostCommonIssues: Array<{ component: string; message: string; count: number }>;
}> {
  try {
    const history = await getDiagnosticHistory(1000);

    if (history.length === 0) {
      return {
        totalReports: 0,
        criticalIssues: 0,
        warningIssues: 0,
        infoIssues: 0,
        mostCommonIssues: [],
      };
    }

    let criticalIssues = 0;
    let warningIssues = 0;
    let infoIssues = 0;
    const issueCounts = new Map<string, number>();

    for (const report of history) {
      for (const issue of report.issues) {
        switch (issue.severity) {
          case 'critical':
            criticalIssues++;
            break;
          case 'warning':
            warningIssues++;
            break;
          case 'info':
            infoIssues++;
            break;
        }

        const key = `${issue.component}:${issue.message}`;
        issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
      }
    }

    const mostCommonIssues = Array.from(issueCounts.entries())
      .map(([key, count]) => {
        const [component, message] = key.split(':');
        return { component, message, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalReports: history.length,
      criticalIssues,
      warningIssues,
      infoIssues,
      mostCommonIssues,
    };
  } catch (error) {
    logger.error('Failed to get diagnostic summary', { error });
    throw new DatabaseError('Failed to get diagnostic summary', { error });
  }
}

/**
 * Export diagnostic report
 */
export function exportDiagnosticReport(report: DiagnosticReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Clear old diagnostic reports
 */
export async function clearOldDiagnosticReports(daysOld: number = 30): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('diagnostic_reports')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to clear old diagnostic reports', { error, daysOld });
      throw new DatabaseError('Failed to clear old diagnostic reports', { error });
    }

    logger.info('Old diagnostic reports cleared', { daysOld });

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error clearing old diagnostic reports', { error, daysOld });
    throw new DatabaseError('Failed to clear old diagnostic reports', { error });
  }
}
