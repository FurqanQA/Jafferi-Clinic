import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Report, ReportCategory, ReportType, ReportStatus, ReportTemplate, ScheduleFrequency } from './report-types';
import { validateReportCategoryAccess } from './report-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Create Report
// Create new report definitions
// ============================================================================

/**
 * Create a new report
 */
export async function createReport(
  reportData: Omit<Report, 'id' | 'clinicId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  // Check permissions
  await validateReportCategoryAccess(reportData.category);

  try {
    const report: Report = {
      ...reportData,
      id: `RPT-${Date.now()}`,
      clinicId,
      createdBy: user.id,
      status: ReportStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database insertion
    logger.info('Report created', { reportId: report.id, clinicId, userId: user.id });
    return report;
  } catch (error) {
    logger.error('Failed to create report', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Create a report from template
 */
export async function createReportFromTemplate(
  templateId: string,
  overrides?: Partial<Omit<Report, 'id' | 'clinicId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status'>>
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch template
    const { data: template, error: fetchError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !template) {
      throw new NotFoundError('Template not found');
    }

    // Check permissions
    await validateReportCategoryAccess(template.category);

    const report: Report = {
      title: template.name,
      description: template.description,
      category: template.category,
      type: template.type,
      parameters: template.parameters || {},
      filters: template.filters || [],
      columns: template.columns || [],
      groupBy: template.groupBy,
      sortBy: template.sortBy,
      sharing: { users: [], roles: [], clinics: [], permissions: 'view' },
      isPublic: false,
      isTemplate: false,
      templateId,
      ...overrides,
      id: `RPT-${Date.now()}`,
      clinicId,
      createdBy: user.id,
      status: ReportStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert report into database
    const { data: insertedReport, error: insertError } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError('Failed to create report from template', { error: insertError });
    }

    logger.info('Report created from template', { reportId: report.id, templateId, clinicId, userId: user.id });
    return insertedReport as Report;
  } catch (error) {
    logger.error('Failed to create report from template', { error, templateId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Create a scheduled report
 */
export async function createScheduledReport(
  reportData: Omit<Report, 'id' | 'clinicId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status' | 'schedule'>
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  // Check permissions
  await validateReportCategoryAccess(reportData.category);

  try {
    const report: Report = {
      ...reportData,
      id: `RPT-${Date.now()}`,
      clinicId,
      createdBy: user.id,
      status: ReportStatus.SCHEDULED,
      schedule: {
        enabled: true,
        frequency: ScheduleFrequency.DAILY,
        timezone: 'UTC',
        recipients: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database insertion
    logger.info('Scheduled report created', { reportId: report.id, clinicId, userId: user.id });
    return report;
  } catch (error) {
    logger.error('Failed to create scheduled report', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Create a public report
 */
export async function createPublicReport(
  reportData: Omit<Report, 'id' | 'clinicId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status' | 'isPublic'>
): Promise<Report> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  // Check permissions (requires admin)
  await validateReportCategoryAccess(reportData.category);

  try {
    const report: Report = {
      ...reportData,
      id: `RPT-${Date.now()}`,
      clinicId,
      createdBy: user.id,
      status: ReportStatus.DRAFT,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Placeholder for database insertion
    logger.info('Public report created', { reportId: report.id, clinicId, userId: user.id });
    return report;
  } catch (error) {
    logger.error('Failed to create public report', { error, clinicId, userId: user.id });
    throw error;
  }
}
