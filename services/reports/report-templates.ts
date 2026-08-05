import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { ReportTemplate, ReportCategory, ReportType } from './report-types';
import { validateReportTemplate } from './report-validation';
import { validateReportEditPermission, validateReportCategoryAccess } from './report-permissions';

// ============================================================================
// Report Templates
// Pre-built report templates for common reporting needs
// ============================================================================

/**
 * Create a report template
 */
export async function createReportTemplate(
  template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReportTemplate> {
  await validateReportEditPermission();
  await validateReportCategoryAccess(template.category);

  try {
    const validated = validateReportTemplate(template);
    const clinicId = await getUserClinicId();

    // Placeholder for database insertion
    const newTemplate: ReportTemplate = {
      ...validated,
      id: `TEMPLATE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Report template created', { templateId: newTemplate.id, category: template.category });
    return newTemplate;
  } catch (error) {
    logger.error('Failed to create report template', { error });
    throw error;
  }
}

/**
 * Get report template by ID
 */
export async function getReportTemplate(templateId: string): Promise<ReportTemplate | null> {
  try {
    // Placeholder for database query
    return null;
  } catch (error) {
    logger.error('Failed to get report template', { error, templateId });
    throw error;
  }
}

/**
 * Get report templates by category
 */
export async function getReportTemplatesByCategory(
  category: ReportCategory
): Promise<ReportTemplate[]> {
  await validateReportCategoryAccess(category);

  try {
    // Placeholder for database query
    logger.info('Report templates retrieved by category', { category });
    return [];
  } catch (error) {
    logger.error('Failed to get report templates by category', { error, category });
    throw error;
  }
}

/**
 * Get all report templates
 */
export async function getAllReportTemplates(): Promise<ReportTemplate[]> {
  try {
    // Placeholder for database query
    return [];
  } catch (error) {
    logger.error('Failed to get all report templates', { error });
    throw error;
  }
}

/**
 * Get system templates
 */
export async function getSystemTemplates(): Promise<ReportTemplate[]> {
  try {
    // Placeholder for database query
    return [];
  } catch (error) {
    logger.error('Failed to get system templates', { error });
    throw error;
  }
}

/**
 * Get user templates
 */
export async function getUserTemplates(): Promise<ReportTemplate[]> {
  try {
    const user = await getCurrentUser();
    // Placeholder for database query
    return [];
  } catch (error) {
    logger.error('Failed to get user templates', { error });
    throw error;
  }
}

/**
 * Update report template
 */
export async function updateReportTemplate(
  templateId: string,
  updates: Partial<Omit<ReportTemplate, 'id' | 'createdAt' | 'createdBy' | 'isSystemTemplate'>>
): Promise<ReportTemplate> {
  await validateReportEditPermission();

  try {
    // Placeholder for database update
    const template: ReportTemplate = {
      id: templateId,
      name: updates.name || '',
      category: updates.category || ReportCategory.FINANCIAL,
      type: updates.type || ReportType.SUMMARY,
      isSystemTemplate: false,
      createdBy: '',
      parameters: updates.parameters || {},
      filters: updates.filters || [],
      columns: updates.columns || [],
      groupBy: updates.groupBy,
      sortBy: updates.sortBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Report template updated', { templateId });
    return template;
  } catch (error) {
    logger.error('Failed to update report template', { error, templateId });
    throw error;
  }
}

/**
 * Delete report template
 */
export async function deleteReportTemplate(templateId: string): Promise<void> {
  await validateReportEditPermission();

  try {
    // Placeholder for database deletion
    logger.info('Report template deleted', { templateId });
  } catch (error) {
    logger.error('Failed to delete report template', { error, templateId });
    throw error;
  }
}

/**
 * Duplicate report template
 */
export async function duplicateReportTemplate(templateId: string): Promise<ReportTemplate> {
  await validateReportEditPermission();

  try {
    const original = await getReportTemplate(templateId);
    if (!original) {
      throw new Error('Template not found');
    }

    const duplicate = await createReportTemplate({
      ...original,
      name: `${original.name} (Copy)`,
      isSystemTemplate: false,
    });

    logger.info('Report template duplicated', { originalId: templateId, newId: duplicate.id });
    return duplicate;
  } catch (error) {
    logger.error('Failed to duplicate report template', { error, templateId });
    throw error;
  }
}

/**
 * Create report from template
 */
export async function createReportFromTemplate(
  templateId: string,
  title: string,
  parameters?: Record<string, any>
): Promise<Partial<ReportTemplate>> {
  try {
    const template = await getReportTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const report = {
      title,
      description: template.description,
      category: template.category,
      type: template.type,
      parameters: { ...template.parameters, ...parameters },
      filters: template.filters,
      columns: template.columns,
      groupBy: template.groupBy,
      sortBy: template.sortBy,
    };

    logger.info('Report created from template', { templateId, title });
    return report;
  } catch (error) {
    logger.error('Failed to create report from template', { error, templateId });
    throw error;
  }
}

/**
 * Get available template categories
 */
export function getAvailableTemplateCategories(): ReportCategory[] {
  return Object.values(ReportCategory);
}

/**
 * Get available template types
 */
export function getAvailableTemplateTypes(): ReportType[] {
  return Object.values(ReportType);
}

/**
 * Initialize system templates
 */
export async function initializeSystemTemplates(): Promise<void> {
  logger.info('Initializing system templates');
  
  // Placeholder for creating default system templates
  const systemTemplates: Array<Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>> = [
    {
      name: 'Monthly Revenue Summary',
      description: 'Summary of monthly revenue across all clinics',
      category: ReportCategory.FINANCIAL,
      type: ReportType.SUMMARY,
      isSystemTemplate: true,
      createdBy: 'SYSTEM',
      parameters: { period: 'monthly' },
      filters: [],
      columns: [
        { field: 'date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
        { field: 'revenue', label: 'Revenue', type: 'currency', aggregatable: true, sortable: true, filterable: true },
      ],
    },
    {
      name: 'Patient Growth Report',
      description: 'Track patient acquisition and retention',
      category: ReportCategory.PATIENT,
      type: ReportType.TREND,
      isSystemTemplate: true,
      createdBy: 'SYSTEM',
      parameters: { period: 'monthly' },
      filters: [],
      columns: [
        { field: 'date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
        { field: 'new_patients', label: 'New Patients', type: 'number', aggregatable: true, sortable: true, filterable: true },
      ],
    },
  ];

  for (const template of systemTemplates) {
    try {
      await createReportTemplate(template);
    } catch (error) {
      logger.error('Failed to initialize system template', { error, templateName: template.name });
    }
  }

  logger.info('System templates initialized', { count: systemTemplates.length });
}
