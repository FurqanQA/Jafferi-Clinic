import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// Export API Logs
// Export API request/response logs for analysis and auditing
// ============================================================================

/**
 * Export Format
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
}

/**
 * Export API Logs Options
 */
export interface ExportApiLogsOptions {
  clinicId: string;
  startDate?: Date;
  endDate?: Date;
  apiKeyId?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  format: ExportFormat;
  limit?: number;
  includeHeaders?: boolean;
  includeBody?: boolean;
}

/**
 * API Log Entry
 */
export interface ApiLogEntry {
  id: string;
  timestamp: string;
  clinicId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent: string;
  headers?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

/**
 * Export API Logs Result
 */
export interface ExportApiLogsResult {
  data: string;
  format: ExportFormat;
  recordCount: number;
  fileName: string;
  generatedAt: string;
}

/**
 * Export API logs
 */
export async function exportApiLogs(options: ExportApiLogsOptions): Promise<ExportApiLogsResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.format) {
      throw new Error('Export format is required');
    }

    // Generate logs (in a real implementation, this would query the database)
    const logs = await generateApiLogs(options);

    // Format the logs based on the requested format
    let formattedData: string;

    switch (options.format) {
      case ExportFormat.JSON:
        formattedData = formatAsJson(logs);
        break;
      case ExportFormat.CSV:
        formattedData = formatAsCsv(logs);
        break;
      case ExportFormat.XML:
        formattedData = formatAsXml(logs);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    const fileName = generateFileName(options);

    logger.info('API logs exported', {
      clinicId: options.clinicId,
      format: options.format,
      recordCount: logs.length,
      fileName,
    });

    return {
      data: formattedData,
      format: options.format,
      recordCount: logs.length,
      fileName,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('API logs export failed', { error, options });
    throw error;
  }
}

/**
 * Generate API logs (mock implementation)
 */
async function generateApiLogs(options: ExportApiLogsOptions): Promise<ApiLogEntry[]> {
  const cacheKey = `api-logs:${JSON.stringify(options)}`;
  const cached = cache.get<string>(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // In a real implementation, this would query the database
  // For now, return empty array
  const logs: ApiLogEntry[] = [];

  cache.set(cacheKey, JSON.stringify(logs), 300000);
  return logs;
}

/**
 * Format logs as JSON
 */
function formatAsJson(logs: ApiLogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

/**
 * Format logs as CSV
 */
function formatAsCsv(logs: ApiLogEntry[]): string {
  if (logs.length === 0) {
    return '';
  }

  const headers = Object.keys(logs[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const log of logs) {
    const values = headers.map((header) => {
      const value = log[header as keyof ApiLogEntry];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Format logs as XML
 */
function formatAsXml(logs: ApiLogEntry[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<api-logs>\n';

  for (const log of logs) {
    xml += '  <log>\n';
    for (const [key, value] of Object.entries(log)) {
      if (value !== null && value !== undefined) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        xml += `    <${key}>${escapeXml(stringValue)}</${key}>\n`;
      }
    }
    xml += '  </log>\n';
  }

  xml += '</api-logs>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate file name for export
 */
function generateFileName(options: ExportApiLogsOptions): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const clinicId = options.clinicId.replace(/[^a-zA-Z0-9]/g, '_');
  const format = options.format.toLowerCase();

  return `api-logs_${clinicId}_${timestamp}.${format}`;
}

/**
 * Validate export API logs options
 */
export function validateExportApiLogsOptions(options: ExportApiLogsOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.clinicId) {
    errors.push('Clinic ID is required');
  }

  if (!options.format) {
    errors.push('Export format is required');
  }

  const validFormats = Object.values(ExportFormat);
  if (options.format && !validFormats.includes(options.format)) {
    errors.push(`Invalid export format: ${options.format}`);
  }

  if (options.startDate && options.endDate && options.startDate > options.endDate) {
    errors.push('Start date must be before end date');
  }

  if (options.limit && options.limit < 1) {
    errors.push('Limit must be at least 1');
  }

  if (options.limit && options.limit > 100000) {
    errors.push('Limit cannot exceed 100000');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get export statistics
 */
export async function getExportStatistics(clinicId: string): Promise<{
  totalLogs: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  mostUsedEndpoints: Array<{ endpoint: string; count: number }>;
}> {
  try {
    const cacheKey = `export-stats:${clinicId}`;
    const cached = cache.get<string>(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // In a real implementation, this would query the database
    const stats = {
      totalLogs: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      mostUsedEndpoints: [],
    };

    cache.set(cacheKey, JSON.stringify(stats), 300000);
    return stats;
  } catch (error) {
    logger.error('Export statistics retrieval failed', { error, clinicId });
    throw error;
  }
}
