import { logger } from '../shared/logger';
import { ApiVersion } from './api-types';

// ============================================================================
// API Status
// API status tracking and maintenance mode management
// ============================================================================

/**
 * Status Information
 */
export interface StatusInfo {
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  message: string;
  version: ApiVersion;
  maintenanceMode: boolean;
  maintenanceStart?: string;
  maintenanceEnd?: string;
  deprecatedVersions: ApiVersion[];
  lastUpdated: string;
}

/**
 * Maintenance Schedule
 */
export interface MaintenanceSchedule {
  start: string;
  end: string;
  message: string;
  affectedServices: string[];
}

/**
 * Current status
 */
let currentStatus: StatusInfo = {
  status: 'operational',
  message: 'All systems operational',
  version: ApiVersion.V2,
  maintenanceMode: false,
  deprecatedVersions: [ApiVersion.V1],
  lastUpdated: new Date().toISOString(),
};

/**
 * Maintenance schedule
 */
let maintenanceSchedule: MaintenanceSchedule | null = null;

/**
 * Get current API status
 */
export function getApiStatus(): StatusInfo {
  return { ...currentStatus };
}

/**
 * Update API status
 */
export function updateApiStatus(
  status: 'operational' | 'degraded' | 'down' | 'maintenance',
  message: string,
  version?: ApiVersion
): void {
  currentStatus = {
    ...currentStatus,
    status,
    message,
    version: version || currentStatus.version,
    lastUpdated: new Date().toISOString(),
  };

  logger.info('API status updated', { status, message, version: currentStatus.version });
}

/**
 * Enable maintenance mode
 */
export function enableMaintenanceMode(
  message: string,
  start?: string,
  end?: string
): void {
  currentStatus.maintenanceMode = true;
  currentStatus.message = message;
  currentStatus.maintenanceStart = start || new Date().toISOString();
  currentStatus.maintenanceEnd = end;
  currentStatus.status = 'maintenance';
  currentStatus.lastUpdated = new Date().toISOString();

  logger.info('Maintenance mode enabled', { message, start, end });
}

/**
 * Disable maintenance mode
 */
export function disableMaintenanceMode(): void {
  currentStatus.maintenanceMode = false;
  currentStatus.message = 'All systems operational';
  currentStatus.maintenanceStart = undefined;
  currentStatus.maintenanceEnd = undefined;
  currentStatus.status = 'operational';
  currentStatus.lastUpdated = new Date().toISOString();

  logger.info('Maintenance mode disabled');
}

/**
 * Schedule maintenance
 */
export function scheduleMaintenance(schedule: MaintenanceSchedule): void {
  maintenanceSchedule = schedule;
  logger.info('Maintenance scheduled', { start: schedule.start, end: schedule.end });
}

/**
 * Cancel scheduled maintenance
 */
export function cancelMaintenance(): void {
  maintenanceSchedule = null;
  logger.info('Scheduled maintenance cancelled');
}

/**
 * Get scheduled maintenance
 */
export function getScheduledMaintenance(): MaintenanceSchedule | null {
  return maintenanceSchedule;
}

/**
 * Check if maintenance is active
 */
export function isMaintenanceActive(): boolean {
  if (!currentStatus.maintenanceMode) {
    return false;
  }

  if (currentStatus.maintenanceEnd) {
    const endTime = new Date(currentStatus.maintenanceEnd);
    return new Date() < endTime;
  }

  return true;
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  return currentStatus.deprecatedVersions.includes(version);
}

/**
 * Add deprecated version
 */
export function addDeprecatedVersion(version: ApiVersion): void {
  if (!currentStatus.deprecatedVersions.includes(version)) {
    currentStatus.deprecatedVersions.push(version);
    currentStatus.lastUpdated = new Date().toISOString();
    logger.info('Version deprecated', { version });
  }
}

/**
 * Remove deprecated version
 */
export function removeDeprecatedVersion(version: ApiVersion): void {
  currentStatus.deprecatedVersions = currentStatus.deprecatedVersions.filter(
    (v) => v !== version
  );
  currentStatus.lastUpdated = new Date().toISOString();
  logger.info('Version undeprecated', { version });
}

/**
 * Get deprecated versions
 */
export function getDeprecatedVersions(): ApiVersion[] {
  return [...currentStatus.deprecatedVersions];
}

/**
 * Set current API version
 */
export function setCurrentVersion(version: ApiVersion): void {
  currentStatus.version = version;
  currentStatus.lastUpdated = new Date().toISOString();
  logger.info('API version updated', { version });
}

/**
 * Get current API version
 */
export function getCurrentVersion(): ApiVersion {
  return currentStatus.version;
}

/**
 * Check if API is operational
 */
export function isOperational(): boolean {
  return currentStatus.status === 'operational' && !isMaintenanceActive();
}

/**
 * Get status page data
 */
export function getStatusPageData(): {
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down' | 'maintenance';
    message?: string;
  }>;
  incidents: Array<{
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    createdAt: string;
    updatedAt: string;
  }>;
} {
  return {
    status: currentStatus.status,
    services: [
      {
        name: 'API Gateway',
        status: currentStatus.status,
        message: currentStatus.message,
      },
      {
        name: 'Authentication',
        status: 'operational',
      },
      {
        name: 'Database',
        status: 'operational',
      },
      {
        name: 'Cache',
        status: 'operational',
      },
      {
        name: 'Webhooks',
        status: 'operational',
      },
    ],
    incidents: [],
  };
}

/**
 * Create incident
 */
export function createIncident(
  title: string,
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
): string {
  const id = crypto.randomUUID();
  logger.info('Incident created', { id, title, status });
  return id;
}

/**
 * Update incident
 */
export function updateIncident(
  id: string,
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
): void {
  logger.info('Incident updated', { id, status });
}

/**
 * Resolve incident
 */
export function resolveIncident(id: string): void {
  logger.info('Incident resolved', { id });
}
