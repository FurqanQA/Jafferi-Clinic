import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Metrics
// Performance metrics collection and reporting
// ============================================================================

/**
 * Metric Type
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Metric Value
 */
export interface MetricValue {
  value: number;
  timestamp: string;
  labels?: Record<string, string>;
}

/**
 * Metric Definition
 */
export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  labels?: string[];
}

/**
 * Metrics Registry
 */
interface MetricsRegistry {
  [key: string]: {
    definition: MetricDefinition;
    values: MetricValue[];
  };
}

/**
 * Metrics storage
 */
const metricsRegistry: MetricsRegistry = {};

/**
 * Register a metric
 */
export function registerMetric(definition: MetricDefinition): void {
  if (metricsRegistry[definition.name]) {
    logger.warn('Metric already registered', { name: definition.name });
    return;
  }

  metricsRegistry[definition.name] = {
    definition,
    values: [],
  };

  logger.info('Metric registered', { name: definition.name, type: definition.type });
}

/**
 * Increment counter metric
 */
export function incrementCounter(
  name: string,
  value: number = 1,
  labels?: Record<string, string>
): void {
  const metric = metricsRegistry[name];
  if (!metric) {
    logger.warn('Metric not found', { name });
    return;
  }

  if (metric.definition.type !== MetricType.COUNTER) {
    logger.warn('Metric is not a counter', { name, type: metric.definition.type });
    return;
  }

  const lastValue = metric.values.length > 0 ? metric.values[metric.values.length - 1].value : 0;
  metric.values.push({
    value: lastValue + value,
    timestamp: new Date().toISOString(),
    labels,
  });

  // Keep only last 1000 values
  if (metric.values.length > 1000) {
    metric.values = metric.values.slice(-1000);
  }
}

/**
 * Set gauge metric
 */
export function setGauge(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  const metric = metricsRegistry[name];
  if (!metric) {
    logger.warn('Metric not found', { name });
    return;
  }

  if (metric.definition.type !== MetricType.GAUGE) {
    logger.warn('Metric is not a gauge', { name, type: metric.definition.type });
    return;
  }

  metric.values.push({
    value,
    timestamp: new Date().toISOString(),
    labels,
  });

  if (metric.values.length > 1000) {
    metric.values = metric.values.slice(-1000);
  }
}

/**
 * Record histogram metric
 */
export function recordHistogram(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  const metric = metricsRegistry[name];
  if (!metric) {
    logger.warn('Metric not found', { name });
    return;
  }

  if (metric.definition.type !== MetricType.HISTOGRAM) {
    logger.warn('Metric is not a histogram', { name, type: metric.definition.type });
    return;
  }

  metric.values.push({
    value,
    timestamp: new Date().toISOString(),
    labels,
  });

  if (metric.values.length > 1000) {
    metric.values = metric.values.slice(-1000);
  }
}

/**
 * Record summary metric
 */
export function recordSummary(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  const metric = metricsRegistry[name];
  if (!metric) {
    logger.warn('Metric not found', { name });
    return;
  }

  if (metric.definition.type !== MetricType.SUMMARY) {
    logger.warn('Metric is not a summary', { name, type: metric.definition.type });
    return;
  }

  metric.values.push({
    value,
    timestamp: new Date().toISOString(),
    labels,
  });

  if (metric.values.length > 1000) {
    metric.values = metric.values.slice(-1000);
  }
}

/**
 * Get metric values
 */
export function getMetricValues(
  name: string,
  labels?: Record<string, string>
): MetricValue[] {
  const metric = metricsRegistry[name];
  if (!metric) {
    return [];
  }

  if (labels) {
    return metric.values.filter((v) => {
      if (!v.labels) return false;
      return Object.entries(labels).every(([key, value]) => v.labels![key] === value);
    });
  }

  return metric.values;
}

/**
 * Get metric summary statistics
 */
export function getMetricSummary(name: string): {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const metric = metricsRegistry[name];
  if (!metric || metric.values.length === 0) {
    return null;
  }

  const values = metric.values.map((v) => v.value).sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / count;
  const min = values[0];
  const max = values[values.length - 1];

  const p50 = values[Math.floor(count * 0.5)];
  const p95 = values[Math.floor(count * 0.95)];
  const p99 = values[Math.floor(count * 0.99)];

  return {
    count,
    sum,
    avg,
    min,
    max,
    p50,
    p95,
    p99,
  };
}

/**
 * Get all metrics
 */
export function getAllMetrics(): Record<string, MetricDefinition> {
  const result: Record<string, MetricDefinition> = {};
  for (const [name, metric] of Object.entries(metricsRegistry)) {
    result[name] = metric.definition;
  }
  return result;
}

/**
 * Reset metric
 */
export function resetMetric(name: string): void {
  const metric = metricsRegistry[name];
  if (metric) {
    metric.values = [];
    logger.info('Metric reset', { name });
  }
}

/**
 * Reset all metrics
 */
export function resetAllMetrics(): void {
  for (const name of Object.keys(metricsRegistry)) {
    resetMetric(name);
  }
  logger.info('All metrics reset');
}

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(): string {
  const lines: string[] = [];

  for (const [name, metric] of Object.entries(metricsRegistry)) {
    lines.push(`# HELP ${name} ${metric.definition.description}`);
    lines.push(`# TYPE ${name} ${metric.definition.type}`);

    if (metric.values.length > 0) {
      const latestValue = metric.values[metric.values.length - 1];
      const labelStr = latestValue.labels
        ? `{${Object.entries(latestValue.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
        : '';
      lines.push(`${name}${labelStr} ${latestValue.value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Initialize default metrics
 */
export function initializeDefaultMetrics(): void {
  registerMetric({
    name: 'api_requests_total',
    type: MetricType.COUNTER,
    description: 'Total number of API requests',
    labels: ['method', 'endpoint', 'status'],
  });

  registerMetric({
    name: 'api_request_duration_seconds',
    type: MetricType.HISTOGRAM,
    description: 'API request duration in seconds',
    labels: ['method', 'endpoint'],
  });

  registerMetric({
    name: 'api_active_connections',
    type: MetricType.GAUGE,
    description: 'Number of active API connections',
  });

  registerMetric({
    name: 'api_errors_total',
    type: MetricType.COUNTER,
    description: 'Total number of API errors',
    labels: ['type', 'endpoint'],
  });

  registerMetric({
    name: 'api_cache_hits_total',
    type: MetricType.COUNTER,
    description: 'Total number of cache hits',
  });

  registerMetric({
    name: 'api_cache_misses_total',
    type: MetricType.COUNTER,
    description: 'Total number of cache misses',
  });

  registerMetric({
    name: 'api_rate_limit_exceeded_total',
    type: MetricType.COUNTER,
    description: 'Total number of rate limit violations',
    labels: ['identifier'],
  });

  logger.info('Default metrics initialized');
}

/**
 * Record API request metric
 */
export function recordApiRequest(
  method: string,
  endpoint: string,
  status: number,
  duration: number
): void {
  incrementCounter('api_requests_total', 1, {
    method,
    endpoint,
    status: String(status),
  });

  recordHistogram('api_request_duration_seconds', duration / 1000, {
    method,
    endpoint,
  });

  if (status >= 400) {
    incrementCounter('api_errors_total', 1, {
      type: status >= 500 ? 'server_error' : 'client_error',
      endpoint,
    });
  }
}

/**
 * Record cache hit
 */
export function recordCacheHit(): void {
  incrementCounter('api_cache_hits_total');
}

/**
 * Record cache miss
 */
export function recordCacheMiss(): void {
  incrementCounter('api_cache_misses_total');
}

/**
 * Update active connections
 */
export function updateActiveConnections(count: number): void {
  setGauge('api_active_connections', count);
}

/**
 * Record rate limit exceeded
 */
export function recordRateLimitExceeded(identifier: string): void {
  incrementCounter('api_rate_limit_exceeded_total', 1, { identifier });
}
