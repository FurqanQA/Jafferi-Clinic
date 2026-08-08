import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Analytics
// Advanced analytics and reporting for API usage
// ============================================================================

/**
 * Monitoring event type
 */
export type MonitoringEventType = 'request' | 'response' | 'error';

/**
 * Monitoring event structure
 */
export interface MonitoringEvent {
  type: MonitoringEventType;
  timestamp: string;
  clinicId?: string;
  userId?: string;
  apiKeyId?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  duration?: number;
  errorMessage?: string;
  level?: string;
  message?: string;
}

/**
 * Analytics Report
 */
export interface AnalyticsReport {
  id: string;
  clinicId?: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  metrics: {
    totalRequests: number;
    uniqueUsers: number;
    uniqueApiKeys: number;
    averageLatency: number;
    errorRate: number;
    throughput: number;
  };
  endpoints: Array<{
    path: string;
    method: string;
    requests: number;
    averageLatency: number;
    errorRate: number;
  }>;
  errors: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  topUsers: Array<{
    userId?: string;
    apiKeyId?: string;
    requests: number;
  }>;
}

/**
 * Analytics Query Options
 */
export interface AnalyticsQueryOptions {
  clinicId?: string;
  startDate: string;
  endDate: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  includeEndpoints?: boolean;
  includeErrors?: boolean;
  includeUsers?: boolean;
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  options: AnalyticsQueryOptions
): Promise<AnalyticsReport> {
  try {
    const report: AnalyticsReport = {
      id: crypto.randomUUID(),
      clinicId: options.clinicId,
      startDate: options.startDate,
      endDate: options.endDate,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalRequests: 0,
        uniqueUsers: 0,
        uniqueApiKeys: 0,
        averageLatency: 0,
        errorRate: 0,
        throughput: 0,
      },
      endpoints: [],
      errors: [],
      topUsers: [],
    };

    // Collect data from monitoring buckets
    const requests: number[] = [];
    const latencies: number[] = [];
    let errorCount = 0;
    const endpointStats: Map<string, { count: number; latencySum: number; errors: number }> = new Map();
    const userStats: Map<string, number> = new Map();
    const apiKeyStats: Map<string, number> = new Map();
    const errorStats: Map<string, number> = new Map();

    const start = new Date(options.startDate);
    const end = new Date(options.endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().slice(0, 10);
      const bucketKey = `monitoring:bucket:${dateStr}`;
      const bucketData = cache.get<string>(bucketKey);

      if (bucketData) {
        const events = JSON.parse(bucketData) as MonitoringEvent[];
        const filtered = options.clinicId
          ? events.filter((e: MonitoringEvent) => e.clinicId === options.clinicId)
          : events;

        for (const event of filtered) {
          if (event.type === 'response') {
            report.metrics.totalRequests++;
            requests.push(1);

            if (event.duration) {
              latencies.push(event.duration);
            }

            if (event.statusCode && event.statusCode >= 400) {
              errorCount++;
            }

            // Endpoint stats
            const endpointKey = `${event.method}:${event.endpoint}`;
            const endpointStat = endpointStats.get(endpointKey) || {
              count: 0,
              latencySum: 0,
              errors: 0,
            };
            endpointStat.count++;
            if (event.duration) {
              endpointStat.latencySum += event.duration;
            }
            if (event.statusCode && event.statusCode >= 400) {
              endpointStat.errors++;
            }
            endpointStats.set(endpointKey, endpointStat);

            // User stats
            if (event.userId) {
              userStats.set(event.userId, (userStats.get(event.userId) || 0) + 1);
            }

            // API key stats
            if (event.apiKeyId) {
              apiKeyStats.set(event.apiKeyId, (apiKeyStats.get(event.apiKeyId) || 0) + 1);
            }

            // Error stats
            if (event.level === 'error') {
              const errorType = event.message || 'unknown';
              errorStats.set(errorType, (errorStats.get(errorType) || 0) + 1);
            }
          }
        }
      }
    }

    // Calculate metrics
    report.metrics.uniqueUsers = userStats.size;
    report.metrics.uniqueApiKeys = apiKeyStats.size;
    report.metrics.averageLatency = latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0;
    report.metrics.errorRate = report.metrics.totalRequests > 0
      ? errorCount / report.metrics.totalRequests
      : 0;

    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) || 1;
    report.metrics.throughput = report.metrics.totalRequests / (days * 86400); // per second

    // Build endpoint stats
    if (options.includeEndpoints !== false) {
      for (const [key, stat] of endpointStats.entries()) {
        const [method, path] = key.split(':');
        report.endpoints.push({
          path,
          method,
          requests: stat.count,
          averageLatency: stat.count > 0 ? stat.latencySum / stat.count : 0,
          errorRate: stat.count > 0 ? stat.errors / stat.count : 0,
        });
      }

      // Sort by request count
      report.endpoints.sort((a, b) => b.requests - a.requests);
      report.endpoints = report.endpoints.slice(0, 20); // Top 20
    }

    // Build error stats
    if (options.includeErrors !== false) {
      for (const [type, count] of errorStats.entries()) {
        report.errors.push({
          type,
          count,
          percentage: report.metrics.totalRequests > 0 ? count / report.metrics.totalRequests : 0,
        });
      }

      report.errors.sort((a, b) => b.count - a.count);
      report.errors = report.errors.slice(0, 10); // Top 10
    }

    // Build top users
    if (options.includeUsers !== false) {
      for (const [userId, count] of userStats.entries()) {
        report.topUsers.push({ userId, requests: count });
      }

      for (const [apiKeyId, count] of apiKeyStats.entries()) {
        report.topUsers.push({ apiKeyId, requests: count });
      }

      report.topUsers.sort((a, b) => b.requests - a.requests);
      report.topUsers = report.topUsers.slice(0, 10); // Top 10
    }

    // Cache the report
    const reportKey = `analytics:report:${report.id}`;
    cache.set(reportKey, JSON.stringify(report), 86400000); // 24 hours

    logger.info('Analytics report generated', { reportId: report.id, clinicId: options.clinicId });
    return report;
  } catch (error) {
    logger.error('Failed to generate analytics report', { error });
    throw error;
  }
}

/**
 * Get cached report
 */
export async function getCachedReport(reportId: string): Promise<AnalyticsReport | null> {
  const reportKey = `analytics:report:${reportId}`;
  const reportData = cache.get<string>(reportKey);

  if (reportData) {
    return JSON.parse(reportData);
  }

  return null;
}

/**
 * Get usage trends
 */
export async function getUsageTrends(
  clinicId?: string,
  days: number = 30
): Promise<Array<{
  date: string;
  requests: number;
  errors: number;
  averageLatency: number;
}>> {
  const trends: Array<{
    date: string;
    requests: number;
    errors: number;
    averageLatency: number;
  }> = [];

  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().slice(0, 10);
    const bucketKey = `monitoring:bucket:${dateStr}`;
    const bucketData = cache.get<string>(bucketKey);

    let requests = 0;
    let errors = 0;
    const latencies: number[] = [];

    if (bucketData) {
      const events = JSON.parse(bucketData) as MonitoringEvent[];
      const filtered = clinicId
        ? events.filter((e: MonitoringEvent) => e.clinicId === clinicId)
        : events;

      for (const event of filtered) {
        if (event.type === 'response') {
          requests++;
          if (event.statusCode && event.statusCode >= 400) {
            errors++;
          }
          if (event.duration) {
            latencies.push(event.duration);
          }
        }
      }
    }

    trends.push({
      date: dateStr,
      requests,
      errors,
      averageLatency: latencies.length > 0
        ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
        : 0,
    });
  }

  return trends;
}

/**
 * Get endpoint popularity
 */
export async function getEndpointPopularity(
  clinicId?: string,
  days: number = 7
): Promise<Array<{
  endpoint: string;
  method: string;
  requests: number;
  percentage: number;
}>> {
  const stats: Map<string, number> = new Map();
  let totalRequests = 0;

  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().slice(0, 10);
    const bucketKey = `monitoring:bucket:${dateStr}`;
    const bucketData = cache.get<string>(bucketKey);

    if (bucketData) {
      const events = JSON.parse(bucketData) as MonitoringEvent[];
      const filtered = clinicId
        ? events.filter((e: MonitoringEvent) => e.clinicId === clinicId)
        : events;

      for (const event of filtered) {
        if (event.type === 'response') {
          totalRequests++;
          const key = `${event.method}:${event.endpoint}`;
          stats.set(key, (stats.get(key) || 0) + 1);
        }
      }
    }
  }

  const popularity = Array.from(stats.entries())
    .map(([key, count]) => {
      const [method, endpoint] = key.split(':');
      return {
        endpoint,
        method,
        requests: count,
        percentage: totalRequests > 0 ? count / totalRequests : 0,
      };
    })
    .sort((a, b) => b.requests - a.requests);

  return popularity.slice(0, 20);
}

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCsv(
  report: AnalyticsReport
): Promise<string> {
  const lines: string[] = [];

  // Header
  lines.push('Metric,Value');
  lines.push(`Report ID,${report.id}`);
  lines.push(`Clinic ID,${report.clinicId || 'N/A'}`);
  lines.push(`Start Date,${report.startDate}`);
  lines.push(`End Date,${report.endDate}`);
  lines.push(`Generated At,${report.generatedAt}`);
  lines.push('');

  // Metrics
  lines.push('Total Requests,' + report.metrics.totalRequests);
  lines.push('Unique Users,' + report.metrics.uniqueUsers);
  lines.push('Unique API Keys,' + report.metrics.uniqueApiKeys);
  lines.push('Average Latency,' + report.metrics.averageLatency.toFixed(2));
  lines.push('Error Rate,' + (report.metrics.errorRate * 100).toFixed(2) + '%');
  lines.push('Throughput,' + report.metrics.throughput.toFixed(2));
  lines.push('');

  // Endpoints
  lines.push('Endpoint,Method,Requests,Avg Latency,Error Rate');
  for (const endpoint of report.endpoints) {
    lines.push(
      `${endpoint.path},${endpoint.method},${endpoint.requests},${endpoint.averageLatency.toFixed(2)},${(endpoint.errorRate * 100).toFixed(2)}%`
    );
  }
  lines.push('');

  // Errors
  lines.push('Error Type,Count,Percentage');
  for (const error of report.errors) {
    lines.push(`${error.type},${error.count},${(error.percentage * 100).toFixed(2)}%`);
  }

  return lines.join('\n');
}
