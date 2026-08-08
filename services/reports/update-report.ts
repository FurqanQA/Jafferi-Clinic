import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Report, ReportStatus } from './report-types';
import { validateReportCategoryAccess, validateReportEditPermission } from './report-permissions';

// ============================================================================
// Update Report
// Update existing report definitions
// ============================================================================

/**
 * Update a report
 */
export async function updateReport(
  reportId: string,
  updates: Partial<Omit<Report, 'id' | 'clinicId' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching existing report
    const existingReport: Report | null = null;

    if (!existingReport) {
      throw new Error('Report not found');
    }

    const report = existingReport as Report;

    // Check permissions
    await validateReportEditPermission(reportId);

    // Check category access if category is being changed
    if (updates.category && updates.category !== report.category) {
      await validateReportCategoryAccess(updates.category);
    }

    const updatedReport: Report = {
      ...report,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database update
    logger.info('Report updated', { reportId, clinicId, userId: user.id });
    return updatedReport;
  } catch (error) {
    logger.error('Failed to update report', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching existing report
    const existingReport: Report | null = null;

    if (!existingReport) {
      throw new Error('Report not found');
    }

    const report = existingReport as Report;

    // Check permissions
    await validateReportEditPermission(reportId);

    const updatedReport: Report = {
      ...report,
      status,
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database update
    logger.info('Report status updated', { reportId, status, clinicId, userId: user.id });
    return updatedReport;
  } catch (error) {
    logger.error('Failed to update report status', { error, reportId, status, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Update report schedule
 */
export async function updateReportSchedule(
  reportId: string,
  schedule: Report['schedule']
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching existing report
    const existingReport: Report | null = null;

    if (!existingReport) {
      throw new Error('Report not found');
    }

    const report = existingReport as Report;

    // Check permissions
    await validateReportEditPermission(reportId);

    const updatedReport: Report = {
      ...report,
      schedule,
      status: schedule?.enabled ? ReportStatus.SCHEDULED : ReportStatus.DRAFT,
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database update
    logger.info('Report schedule updated', { reportId, clinicId, userId: user.id });
    return updatedReport;
  } catch (error) {
    logger.error('Failed to update report schedule', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Update report sharing settings
 */
export async function updateReportSharing(
  reportId: string,
  sharing: Report['sharing']
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching existing report
    const existingReport: Report | null = null;

    if (!existingReport) {
      throw new Error('Report not found');
    }

    const report = existingReport as Report;

    // Check permissions
    await validateReportEditPermission(reportId);

    const updatedReport: Report = {
      ...report,
      sharing,
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database update
    logger.info('Report sharing updated', { reportId, clinicId, userId: user.id });
    return updatedReport;
  } catch (error) {
    logger.error('Failed to update report sharing', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Update report filters
 */
export async function updateReportFilters(
  reportId: string,
  filters: Report['filters']
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching existing report
    const existingReport: Report | null = null;

    if (!existingReport) {
      throw new Error('Report not found');
    }

    const report = existingReport as Report;

    // Check permissions
    await validateReportEditPermission(reportId);

    const updatedReport: Report = {
      ...report,
      filters,
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database update
    logger.info('Report filters updated', { reportId, clinicId, userId: user.id });
    return updatedReport;
  } catch (error) {
    logger.error('Failed to update report filters', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}
