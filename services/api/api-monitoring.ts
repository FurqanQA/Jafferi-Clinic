import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// API Monitoring
// Real-time monitoring and alerting for API operations
// ============================================================================

/**
 * Monitoring Event
 */
export interface MonitoringEvent {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'warning';
  level: 'info' | 'warn' | 'error' | 'critical';
  source: string;
  clinicId?: string;
  userId?: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  duration?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Monitoring Statistics
 */
export interface MonitoringStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  requestsPerMinute: number;
}

/**
 * Alert Configuration
 */
export interface AlertConfig {
  enabled: boolean;
  errorRateThreshold: number;
  latencyThreshold: number;
  rateLimitThreshold: number;
  notificationChannels: string[];
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  errorRateThreshold: 0.05, // 5%
  latencyThreshold: 5000, // 5 seconds
  rateLimitThreshold: 1000, // requests per minute
  notificationChannels: ['email', 'slack'],
};

/**
 * Record monitoring event
 */
export async function recordMonitoringEvent(event: MonitoringEvent): Promise<void> {
  try {
    const key = `monitoring:event:${event.id}`;
    cache.set(key, JSON.stringify(event), 86400000); // 24 hours

    // Store in time-series bucket
    const bucketKey = `monitoring:bucket:${event.timestamp.slice(0, 10)}`;
    const bucketData = cache.get<string>(bucketKey);
    const events: MonitoringEvent[] = bucketData ? JSON.parse(bucketData) : [];
    events.push(event);
    cache.set(bucketKey, JSON.stringify(events), 86400000 * 7); // 7 days

    // Check for alerts
    if (event.level === 'error' || event.level === 'critical') {
      await checkAlerts(event);
    }

    logger.debug('Monitoring event recorded', { eventId: event.id, type: event.type });
  } catch (error) {
    logger.error('Failed to record monitoring event', { eventId: event.id, error });
  }
}

/**
 * Get monitoring statistics
 */
export async function getMonitoringStats(
  clinicId?: string,
  startDate?: string,
  endDate?: string
): Promise<MonitoringStats> {
  try {
    const start = startDate || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const latencies: number[] = [];

    for (let date = new Date(start); date <= new Date(end); date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().slice(0, 10);
      const bucketKey = `monitoring:bucket:${dateStr}`;
      const bucketData = cache.get<string>(bucketKey);

      if (bucketData) {
        const events: MonitoringEvent[] = JSON.parse(bucketData);
        const filteredEvents = clinicId
          ? events.filter((e) => e.clinicId === clinicId)
          : events;

        for (const event of filteredEvents) {
          if (event.type === 'request' || event.type === 'response') {
            totalRequests++;
            if (event.statusCode && event.statusCode >= 400) {
              failedRequests++;
            } else {
              successfulRequests++;
            }
            if (event.duration) {
              latencies.push(event.duration);
            }
          }
        }
      }
    }

    const sortedLatencies = latencies.sort((a, b) => a - b);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0;
    const p95Latency = sortedLatencies.length > 0
      ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)]
      : 0;
    const p99Latency = sortedLatencies.length > 0
      ? sortedLatencies[Math.floor(sortedLatencies.length * 0.99)]
      : 0;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const requestsPerMinute = totalRequests / 1440; // 1440 minutes in a day

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatency,
      p95Latency,
      p99Latency,
      errorRate,
      requestsPerMinute,
    };
  } catch (error) {
    logger.error('Failed to get monitoring stats', { error });
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
      requestsPerMinute: 0,
    };
  }
}

/**
 * Get recent events
 */
export async function getRecentEvents(
  clinicId?: string,
  limit: number = 100
): Promise<MonitoringEvent[]> {
  try {
    const events: MonitoringEvent[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const bucketKey = `monitoring:bucket:${today}`;
    const bucketData = cache.get<string>(bucketKey);

    if (bucketData) {
      const allEvents: MonitoringEvent[] = JSON.parse(bucketData);
      const filtered = clinicId
        ? allEvents.filter((e) => e.clinicId === clinicId)
        : allEvents;

      return filtered.slice(-limit);
    }

    return events;
  } catch (error) {
    logger.error('Failed to get recent events', { error });
    return [];
  }
}

/**
 * Check alerts
 */
async function checkAlerts(event: MonitoringEvent): Promise<void> {
  const config = DEFAULT_ALERT_CONFIG;
  if (!config.enabled) {
    return;
  }

  try {
    const stats = await getMonitoringStats(event.clinicId);

    if (stats.errorRate > config.errorRateThreshold) {
      await triggerAlert('error_rate_exceeded', {
        threshold: config.errorRateThreshold,
        actual: stats.errorRate,
        clinicId: event.clinicId,
      });
    }

    if (stats.averageLatency > config.latencyThreshold) {
      await triggerAlert('latency_threshold_exceeded', {
        threshold: config.latencyThreshold,
        actual: stats.averageLatency,
        clinicId: event.clinicId,
      });
    }

    if (stats.requestsPerMinute > config.rateLimitThreshold) {
      await triggerAlert('rate_limit_exceeded', {
        threshold: config.rateLimitThreshold,
        actual: stats.requestsPerMinute,
        clinicId: event.clinicId,
      });
    }
  } catch (error) {
    logger.error('Failed to check alerts', { error });
  }
}

/**
 * Trigger alert
 */
async function triggerAlert(
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  logger.warn('Alert triggered', { type, data });
  // Placeholder for actual alert notification
  // In production, this would send notifications via configured channels
}

/**
 * Get alert configuration
 */
export function getAlertConfig(): AlertConfig {
  return DEFAULT_ALERT_CONFIG;
}

/**
 * Update alert configuration
 */
export function updateAlertConfig(config: Partial<AlertConfig>): AlertConfig {
  Object.assign(DEFAULT_ALERT_CONFIG, config);
  logger.info('Alert configuration updated', { config: DEFAULT_ALERT_CONFIG });
  return DEFAULT_ALERT_CONFIG;
}

/**
 * Clear old monitoring data
 */
export async function clearOldMonitoringData(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 86400000);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    // In a real implementation with Redis, this would use keys command
    logger.info('Old monitoring data cleared', { cutoffDate: cutoffStr });
  } catch (error) {
    logger.error('Failed to clear old monitoring data', { error });
  }
}

/**
 * Create monitoring event
 */
export function createMonitoringEvent(
  type: MonitoringEvent['type'],
  level: MonitoringEvent['level'],
  source: string,
  endpoint: string,
  method: string,
  metadata?: Record<string, unknown>
): MonitoringEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    level,
    source,
    endpoint,
    method,
    metadata,
  };
}
