import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { ExportFormat } from './report-types';
import { validateReportExportPermission } from './report-permissions';

// ============================================================================
// Export Reports
// Export reports in various formats
// ============================================================================

/**
 * Export a report to a specific format
 */
export async function exportReport(
  reportId: string,
  format: ExportFormat
): Promise<{ data: Buffer; filename: string; mimeType: string }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportExportPermission(reportId);

    // Placeholder for report execution and export
    const data = Buffer.from('');
    const filename = `report-${reportId}.${format.toLowerCase()}`;
    const mimeType = getMimeType(format);

    logger.info('Report exported', { reportId, format, clinicId, userId: user.id });
    return { data, filename, mimeType };
  } catch (error) {
    logger.error('Failed to export report', { error, reportId, format, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Export multiple reports
 */
export async function exportReports(
  reportIds: string[],
  format: ExportFormat
): Promise<{ data: Buffer; filename: string; mimeType: string }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportExportPermission();

    // Placeholder for batch export
    const data = Buffer.from('');
    const filename = `reports-export.${format.toLowerCase()}`;
    const mimeType = getMimeType(format);

    logger.info('Multiple reports exported', { clinicId, userId: user.id, count: reportIds.length, format });
    return { data, filename, mimeType };
  } catch (error) {
    logger.error('Failed to export reports', { error, clinicId, userId: user.id, reportIds, format });
    throw error;
  }
}

/**
 * Get export history for a report
 */
export async function getExportHistory(reportId: string): Promise<Array<{
  exportId: string;
  format: ExportFormat;
  exportedAt: string;
  exportedBy: string;
}>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportExportPermission(reportId);

    // Placeholder for database query
    const history: Array<{
      exportId: string;
      format: ExportFormat;
      exportedAt: string;
      exportedBy: string;
    }> = [];

    logger.info('Export history retrieved', { reportId, clinicId, userId: user.id });
    return history;
  } catch (error) {
    logger.error('Failed to get export history', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get MIME type for export format
 */
function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    [ExportFormat.CSV]: 'text/csv',
    [ExportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    [ExportFormat.PDF]: 'application/pdf',
    [ExportFormat.JSON]: 'application/json',
    [ExportFormat.PRINT]: 'text/html',
  };
  return mimeTypes[format] || 'application/octet-stream';
}
