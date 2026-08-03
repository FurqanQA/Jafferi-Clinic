import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateExportAccess } from './dashboard-permissions';
import { ExportFormat } from './dashboard-types';

// ============================================================================
// Dashboard Export
// Export dashboard data in various formats
// ============================================================================

/**
 * Export data to CSV
 */
export async function exportToCSV(data: any[], filename: string): Promise<string> {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    logger.info('CSV export generated', { filename, rows: data.length });
    return csvContent;
  } catch (error) {
    logger.error('Failed to export to CSV', { error, filename });
    throw error;
  }
}

/**
 * Export data to JSON
 */
export async function exportToJSON(data: any[], filename: string): Promise<string> {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const jsonContent = JSON.stringify(data, null, 2);
    logger.info('JSON export generated', { filename, rows: data.length });
    return jsonContent;
  } catch (error) {
    logger.error('Failed to export to JSON', { error, filename });
    throw error;
  }
}

/**
 * Export data to Excel (placeholder - would use a library like exceljs)
 */
export async function exportToExcel(data: any[], filename: string): Promise<Buffer> {
  try {
    // Placeholder for Excel export
    // In production, this would use a library like exceljs or xlsx
    logger.warn('Excel export not implemented, returning empty buffer', { filename });
    return Buffer.from('');
  } catch (error) {
    logger.error('Failed to export to Excel', { error, filename });
    throw error;
  }
}

/**
 * Export data to PDF (placeholder - would use a library like pdfkit or jsPDF)
 */
export async function exportToPDF(data: any[], filename: string): Promise<Buffer> {
  try {
    // Placeholder for PDF export
    // In production, this would use a library like pdfkit or jsPDF
    logger.warn('PDF export not implemented, returning empty buffer', { filename });
    return Buffer.from('');
  } catch (error) {
    logger.error('Failed to export to PDF', { error, filename });
    throw error;
  }
}

/**
 * Export dashboard data
 */
export async function exportDashboardData(
  data: any[],
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  // Validate export permissions
  await validateExportAccess();

  const defaultFilename = filename || `dashboard_export_${new Date().toISOString().split('T')[0]}`;

  try {
    switch (format) {
      case ExportFormat.CSV:
        return await exportToCSV(data, `${defaultFilename}.csv`);
      case ExportFormat.JSON:
        return await exportToJSON(data, `${defaultFilename}.json`);
      case ExportFormat.EXCEL:
        return await exportToExcel(data, `${defaultFilename}.xlsx`);
      case ExportFormat.PDF:
        return await exportToPDF(data, `${defaultFilename}.pdf`);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    logger.error('Failed to export dashboard data', { error, format, filename });
    throw error;
  }
}

/**
 * Export metrics data
 */
export async function exportMetrics(
  metrics: Record<string, any>,
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  // Convert metrics to array format
  const data = Object.entries(metrics).map(([key, value]) => ({
    metric: key,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
  }));

  return await exportDashboardData(data, format, filename || `metrics_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export KPI data
 */
export async function exportKPIs(
  kpis: any[],
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  return await exportDashboardData(kpis, format, filename || `kpis_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export chart data
 */
export async function exportChartData(
  chartData: any,
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  // Flatten chart data for export
  const data: any[] = [];

  if (chartData.series && Array.isArray(chartData.series)) {
    for (const series of chartData.series) {
      if (series.data && Array.isArray(series.data)) {
        for (const point of series.data) {
          data.push({
            series: series.name,
            label: point.label,
            value: point.value,
          });
        }
      }
    }
  }

  return await exportDashboardData(data, format, filename || `chart_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export activity data
 */
export async function exportActivity(
  activities: any[],
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  return await exportDashboardData(activities, format, filename || `activity_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export calendar data
 */
export async function exportCalendar(
  events: any[],
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  return await exportDashboardData(events, format, filename || `calendar_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export alerts data
 */
export async function exportAlerts(
  alerts: any[],
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  return await exportDashboardData(alerts, format, filename || `alerts_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export comparison data
 */
export async function exportComparison(
  comparisons: any[],
  format: ExportFormat,
  filename?: string
): Promise<string | Buffer> {
  return await exportDashboardData(comparisons, format, filename || `comparison_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Get export file extension
 */
export function getExportFileExtension(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.CSV:
      return '.csv';
    case ExportFormat.JSON:
      return '.json';
    case ExportFormat.EXCEL:
      return '.xlsx';
    case ExportFormat.PDF:
      return '.pdf';
    default:
      return '.txt';
  }
}

/**
 * Get export MIME type
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.CSV:
      return 'text/csv';
    case ExportFormat.JSON:
      return 'application/json';
    case ExportFormat.EXCEL:
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case ExportFormat.PDF:
      return 'application/pdf';
    default:
      return 'text/plain';
  }
}

/**
 * Validate export format
 */
export function validateExportFormat(format: string): format is ExportFormat {
  return Object.values(ExportFormat).includes(format as ExportFormat);
}

/**
 * Generate export filename
 */
export function generateExportFilename(
  type: string,
  format: ExportFormat,
  date?: Date
): string {
  const exportDate = date || new Date();
  const dateStr = exportDate.toISOString().split('T')[0];
  const extension = getExportFileExtension(format);
  return `${type}_export_${dateStr}${extension}`;
}

/**
 * Get supported export formats
 */
export function getSupportedExportFormats(): ExportFormat[] {
  return Object.values(ExportFormat);
}

/**
 * Check if format is supported
 */
export function isFormatSupported(format: string): boolean {
  return validateExportFormat(format);
}
