import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReportDeletePermission } from './report-permissions';

// ============================================================================
// Delete Report
// Delete existing reports
// ============================================================================

/**
 * Delete a report
 */
export async function deleteReport(reportId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportDeletePermission(reportId);

    // Placeholder for database deletion
    logger.info('Report deleted', { reportId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to delete report', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Delete multiple reports
 */
export async function deleteReports(reportIds: string[]): Promise<{ deleted: number; failed: string[] }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportDeletePermission();

    const deleted: string[] = [];
    const failed: string[] = [];

    // Placeholder for batch deletion
    for (const reportId of reportIds) {
      try {
        // Placeholder for individual deletion
        deleted.push(reportId);
      } catch (error) {
        failed.push(reportId);
      }
    }

    logger.info('Batch report deletion completed', { clinicId, userId: user.id, deleted: deleted.length, failed: failed.length });
    return { deleted: deleted.length, failed };
  } catch (error) {
    logger.error('Failed to delete reports', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Permanently delete a report (bypass archive)
 */
export async function permanentlyDeleteReport(reportId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions (requires admin)
    await validateReportDeletePermission(reportId);

    // Placeholder for permanent database deletion
    logger.info('Report permanently deleted', { reportId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to permanently delete report', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}
