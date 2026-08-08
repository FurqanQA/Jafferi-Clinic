import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError } from '../core/errors';
import { logger } from '../shared/logger';
import { Report } from './report-types';
import { validateReportViewPermission } from './report-permissions';
import { getSupabaseClient } from '../core/client';

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
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateReportViewPermission(reportId);

    // Fetch report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !report) {
      throw new NotFoundError('Report not found');
    }

    logger.info('Report retrieved', { reportId, clinicId, userId: user.id });
    return report as Report;
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
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateReportViewPermission(reportId);

    // Fetch report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !report) {
      throw new NotFoundError('Report not found');
    }

    // Placeholder for fetching execution results
    const results = null;

    logger.info('Report with results retrieved', { reportId, clinicId, userId: user.id });
    return { report: report as Report, results };
  } catch (error) {
    logger.error('Failed to get report with results', { error, reportId, clinicId, userId: user.id });
    throw error;
  }
}
