import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Report } from './report-types';
import { validateReportViewPermission } from './report-permissions';

// ============================================================================
// Get Report
// Retrieve individual reports
// ============================================================================

/**
 * Get a report by ID
 */
export async function getReport(reportId: string): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportViewPermission(reportId);

    // Placeholder for database query
    const report: Report | null = null;

    if (!report) {
      throw new Error('Report not found');
    }

    // Verify clinic access for multi-tenancy
    if (report.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    logger.info('Report retrieved', { reportId, clinicId, userId: user.id });
    return report;
  } catch (error) {
    logger.error('Failed to get report', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get a report by ID with execution results
 */
export async function getReportWithResults(reportId: string): Promise<{ report: Report; results: any }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportViewPermission(reportId);

    // Placeholder for database query
    const report: Report | null = null;

    if (!report) {
      throw new Error('Report not found');
    }

    // Verify clinic access for multi-tenancy
    if (report.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    // Placeholder for fetching execution results
    const results = null;

    logger.info('Report with results retrieved', { reportId, clinicId, userId: user.id });
    return { report, results };
  } catch (error) {
    logger.error('Failed to get report with results', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}
