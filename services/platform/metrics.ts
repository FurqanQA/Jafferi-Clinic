import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';

// ============================================================================
// Metrics Manager
// Application metrics collection and aggregation
// ============================================================================

/**
 * Metric interface
 */
export interface Metric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels: Record<string, string>;
  timestamp: string;
  description: string | null;
}

/**
 * Metric aggregation result
 */
export interface MetricAggregation {
  metricName: string;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  percentile95: number;
  percentile99: number;
}

/**
 * Record a metric
 */
export async function recordMetric(data: {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels?: Record<string, string>;
  description?: string;
}): Promise<Metric> {
  try {
    const supabase = getSupabaseClient();

    const metricId = `metric-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: metric, error } = await supabase
      .from('metrics')
      .insert({
        id: metricId,
        name: data.name,
        type: data.type,
        value: data.value,
        labels: data.labels || {},
        timestamp: now,
        description: data.description || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to record metric', { error, data });
      throw new DatabaseError('Failed to record metric', { error });
    }

    logger.debug('Metric recorded', { metricId, name: data.name, value: data.value });

    // Invalidate cache
    cache.delete(`metrics:${data.name}`);
    cache.delete('metrics:all');

    return metric as Metric;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording metric', { error, data });
    throw new DatabaseError('Failed to record metric', { error });
  }
}

/**
 * Increment a counter metric
 */
export async function incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): Promise<Metric> {
  return recordMetric({
    name,
    type: 'counter',
    value,
    labels,
    description: `Counter metric: ${name}`,
  });
}

/**
 * Set a gauge metric
 */
export async function setGauge(name: string, value: number, labels?: Record<string, string>): Promise<Metric> {
  return recordMetric({
    name,
    type: 'gauge',
    value,
    labels,
    description: `Gauge metric: ${name}`,
  });
}

/**
 * Record a histogram value
 */
export async function recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<Metric> {
  return recordMetric({
    name,
    type: 'histogram',
    value,
    labels,
    description: `Histogram metric: ${name}`,
  });
}

/**
 * Record a summary value
 */
export async function recordSummary(name: string, value: number, labels?: Record<string, string>): Promise<Metric> {
  return recordMetric({
    name,
    type: 'summary',
    value,
    labels,
    description: `Summary metric: ${name}`,
  });
}

/**
 * Get metrics by name
 */
export async function getMetrics(name: string, options: {
  from?: string;
  to?: string;
  labels?: Record<string, string>;
  limit?: number;
}): Promise<Metric[]> {
  try {
    const { from, to, labels, limit = 1000 } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('metrics')
      .select('*')
      .eq('name', name);

    if (from) {
      query = query.gte('timestamp', from);
    }

    if (to) {
      query = query.lte('timestamp', to);
    }

    if (labels) {
      for (const [key, value] of Object.entries(labels)) {
        query = query.contains('labels', { [key]: value });
      }
    }

    const { data: metrics, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch metrics', { error, name });
      throw new DatabaseError('Failed to fetch metrics', { error });
    }

    return (metrics || []) as Metric[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching metrics', { error, name });
    throw new DatabaseError('Failed to fetch metrics', { error });
  }
}

/**
 * Get latest metric value
 */
export async function getLatestMetric(name: string, labels?: Record<string, string>): Promise<Metric | null> {
  try {
    const metrics = await getMetrics(name, { labels, limit: 1 });
    return metrics.length > 0 ? metrics[0] : null;
  } catch (error) {
    logger.error('Failed to get latest metric', { error, name });
    throw new DatabaseError('Failed to get latest metric', { error });
  }
}

/**
 * Aggregate metrics
 */
export async function aggregateMetrics(name: string, options: {
  from?: string;
  to?: string;
  labels?: Record<string, string>;
}): Promise<MetricAggregation> {
  try {
    const metrics = await getMetrics(name, options);

    if (metrics.length === 0) {
      return {
        metricName: name,
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        percentile95: 0,
        percentile99: 0,
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const count = values.length;
    const average = sum / count;
    const min = values[0];
    const max = values[values.length - 1];

    // Calculate percentiles
    const p95Index = Math.floor(values.length * 0.95);
    const p99Index = Math.floor(values.length * 0.99);
    const percentile95 = values[p95Index] || max;
    const percentile99 = values[p99Index] || max;

    return {
      metricName: name,
      count,
      sum,
      average,
      min,
      max,
      percentile95,
      percentile99,
    };
  } catch (error) {
    logger.error('Failed to aggregate metrics', { error, name });
    throw new DatabaseError('Failed to aggregate metrics', { error });
  }
}

/**
 * Get all metric names
 */
export async function getMetricNames(): Promise<string[]> {
  try {
    const cacheKey = 'metrics:names';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: metrics } = await supabase
      .from('metrics')
      .select('name');

    const names = new Set<string>();
    for (const metric of metrics || []) {
      names.add(metric.name);
    }

    const result = Array.from(names);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get metric names', { error });
    throw new DatabaseError('Failed to get metric names', { error });
  }
}

/**
 * Get metric labels
 */
export async function getMetricLabels(name: string): Promise<Record<string, string>[]> {
  try {
    const metrics = await getMetrics(name, { limit: 100 });
    const labelsSet = new Set<string>();

    const uniqueLabels: Record<string, string>[] = [];
    for (const metric of metrics) {
      const labelKey = JSON.stringify(metric.labels);
      if (!labelsSet.has(labelKey)) {
        labelsSet.add(labelKey);
        uniqueLabels.push(metric.labels);
      }
    }

    return uniqueLabels;
  } catch (error) {
    logger.error('Failed to get metric labels', { error, name });
    throw new DatabaseError('Failed to get metric labels', { error });
  }
}

/**
 * Delete old metrics
 */
export async function deleteOldMetrics(daysOld: number = 30): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('metrics')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      logger.error('Failed to delete old metrics', { error, daysOld });
      throw new DatabaseError('Failed to delete old metrics', { error });
    }

    logger.info('Old metrics deleted', { daysOld });

    // Invalidate cache
    cache.delete('metrics:all');
    cache.delete('metrics:names');

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting old metrics', { error, daysOld });
    throw new DatabaseError('Failed to delete old metrics', { error });
  }
}

/**
 * Get metrics summary
 */
export async function getMetricsSummary(): Promise<{
  totalMetrics: number;
  metricCount: Record<string, number>;
  metricTypes: Record<string, number>;
  oldestMetric: string | null;
  newestMetric: string | null;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: metrics } = await supabase
      .from('metrics')
      .select('name, type, timestamp');

    if (!metrics || metrics.length === 0) {
      return {
        totalMetrics: 0,
        metricCount: {},
        metricTypes: {},
        oldestMetric: null,
        newestMetric: null,
      };
    }

    const metricCount: Record<string, number> = {};
    const metricTypes: Record<string, number> = {};
    let oldest = metrics[0].timestamp;
    let newest = metrics[0].timestamp;

    for (const metric of metrics) {
      metricCount[metric.name] = (metricCount[metric.name] || 0) + 1;
      metricTypes[metric.type] = (metricTypes[metric.type] || 0) + 1;

      if (metric.timestamp < oldest) {
        oldest = metric.timestamp;
      }
      if (metric.timestamp > newest) {
        newest = metric.timestamp;
      }
    }

    return {
      totalMetrics: metrics.length,
      metricCount,
      metricTypes,
      oldestMetric: oldest,
      newestMetric: newest,
    };
  } catch (error) {
    logger.error('Failed to get metrics summary', { error });
    throw new DatabaseError('Failed to get metrics summary', { error });
  }
}

/**
 * Batch record metrics
 */
export async function batchRecordMetrics(metrics: Array<{
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels?: Record<string, string>;
  description?: string;
}>): Promise<Metric[]> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const records = metrics.map((m, index) => ({
      id: `metric-${Date.now()}-${index}`,
      name: m.name,
      type: m.type,
      value: m.value,
      labels: m.labels || {},
      timestamp: now,
      description: m.description || null,
    }));

    const { data: result, error } = await supabase
      .from('metrics')
      .insert(records)
      .select();

    if (error) {
      logger.error('Failed to batch record metrics', { error });
      throw new DatabaseError('Failed to batch record metrics', { error });
    }

    logger.info('Batch metrics recorded', { count: metrics.length });

    // Invalidate cache
    cache.delete('metrics:all');
    cache.delete('metrics:names');

    return (result || []) as Metric[];
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error batch recording metrics', { error });
    throw new DatabaseError('Failed to batch record metrics', { error });
  }
}

/**
 * Get metrics by time range
 */
export async function getMetricsByTimeRange(from: string, to: string, options: {
  names?: string[];
  labels?: Record<string, string>;
  limit?: number;
}): Promise<Metric[]> {
  try {
    const { names, labels, limit = 1000 } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('metrics')
      .select('*')
      .gte('timestamp', from)
      .lte('timestamp', to);

    if (names && names.length > 0) {
      query = query.in('name', names);
    }

    if (labels) {
      for (const [key, value] of Object.entries(labels)) {
        query = query.contains('labels', { [key]: value });
      }
    }

    const { data: metrics, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch metrics by time range', { error });
      throw new DatabaseError('Failed to fetch metrics by time range', { error });
    }

    return (metrics || []) as Metric[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching metrics by time range', { error });
    throw new DatabaseError('Failed to fetch metrics by time range', { error });
  }
}

/**
 * Timing helper - record execution time
 */
export async function recordTiming<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    await recordHistogram(name, duration, labels);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    await recordHistogram(name, duration, { ...labels, status: 'error' });
    throw error;
  }
}

/**
 * Counter helper - increment with labels
 */
export function createCounter(name: string, description?: string) {
  return {
    increment: (value: number = 1, labels?: Record<string, string>) => 
      incrementCounter(name, value, labels),
    set: (value: number, labels?: Record<string, string>) =>
      recordMetric({ name, type: 'counter', value, labels, description }),
  };
}

/**
 * Gauge helper - set value
 */
export function createGauge(name: string, description?: string) {
  return {
    set: (value: number, labels?: Record<string, string>) =>
      setGauge(name, value, labels),
    increment: (value: number = 1, labels?: Record<string, string>) =>
      incrementCounter(name, value, labels),
    decrement: (value: number = 1, labels?: Record<string, string>) =>
      incrementCounter(name, -value, labels),
  };
}

/**
 * Histogram helper - record value
 */
export function createHistogram(name: string, description?: string) {
  return {
    record: (value: number, labels?: Record<string, string>) =>
      recordHistogram(name, value, labels),
  };
}

/**
 * Summary helper - record value
 */
export function createSummary(name: string, description?: string) {
  return {
    record: (value: number, labels?: Record<string, string>) =>
      recordSummary(name, value, labels),
  };
}
