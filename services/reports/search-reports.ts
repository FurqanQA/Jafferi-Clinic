import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Report } from './report-types';
import { validateReportViewPermission } from './report-permissions';

// ============================================================================
// Search Reports
// Search and filter reports
// ============================================================================

/**
 * Search reports by query
 */
export async function searchReports(
  query: string,
  options?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ reports: Report[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportViewPermission();

    // Placeholder for database search
    const reports: Report[] = [];
    const total = 0;

    logger.info('Reports searched', { clinicId, userId: user.id, query, count: reports.length });
    return { reports, total };
  } catch (error) {
    logger.error('Failed to search reports', { error, clinicId, userId: user.id, query });
    throw error;
  }
}

/**
 * Advanced report search with filters
 */
export async function advancedSearchReports(filters: {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ reports: Report[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportViewPermission();

    // Placeholder for database advanced search
    const reports: Report[] = [];
    const total = 0;

    logger.info('Advanced report search completed', { clinicId, userId: user.id, filters, count: reports.length });
    return { reports, total };
  } catch (error) {
    logger.error('Failed to perform advanced report search', { error, clinicId, userId: user.id, filters });
    throw error;
  }
}

/**
 * Get report suggestions for autocomplete
 */
export async function getReportSuggestions(
  query: string,
  limit: number = 10
): Promise<Array<{ id: string; title: string; category: string }>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateReportViewPermission();

    // Placeholder for database query
    const suggestions: Array<{ id: string; title: string; category: string }> = [];

    logger.info('Report suggestions retrieved', { clinicId, userId: user.id, query, count: suggestions.length });
    return suggestions;
  } catch (error) {
    logger.error('Failed to get report suggestions', { error, clinicId, userId: user.id, query });
    throw error;
  }
}
