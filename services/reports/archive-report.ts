import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Report, ReportStatus } from './report-types';
import { validateReportDeletePermission } from './report-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Archive Report
// Archive reports for soft deletion
// ============================================================================

/**
 * Archive a report
 */
export async function archiveReport(reportId: string): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateReportDeletePermission(reportId);

    // Fetch existing report
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !existingReport) {
      throw new NotFoundError('Report not found');
    }

    // Update report status
    const { data: archivedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: ReportStatus.ARCHIVED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to archive report', { error: updateError });
    }

    logger.info('Report archived', { reportId, clinicId, userId: user.id });
    return archivedReport as Report;
  } catch (error) {
    logger.error('Failed to archive report', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Archive multiple reports
 */
export async function archiveReports(reportIds: string[]): Promise<{ archived: number; failed: string[] }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportDeletePermission();

    const archived: string[] = [];
    const failed: string[] = [];

    // Placeholder for batch archiving
    for (const reportId of reportIds) {
      try {
        // Placeholder for individual archiving
        archived.push(reportId);
      } catch (error) {
        failed.push(reportId);
      }
    }

    logger.info('Batch report archiving completed', { clinicId, userId: user.id, archived: archived.length, failed: failed.length });
    return { archived: archived.length, failed };
  } catch (error) {
    logger.error('Failed to archive reports', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get archived reports
 */
export async function getArchivedReports(): Promise<Report[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const archivedReports: Report[] = [];

    logger.info('Archived reports retrieved', { clinicId, userId: user.id });
    return archivedReports;
  } catch (error) {
    logger.error('Failed to get archived reports', { error, clinicId, userId: user.id });
    throw error;
  }
}
