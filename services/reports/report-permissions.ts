import { getUserRole, getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { ReportCategory } from './report-types';

// ============================================================================
// Report Permissions
// Role-based access control for reports
// ============================================================================

/**
 * Report permission levels
 */
export enum ReportPermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  EXPORT = 'export',
  SCHEDULE = 'schedule',
  ADMIN = 'admin',
}

/**
 * Role-based report access matrix
 */
const ROLE_REPORT_ACCESS: Record<string, ReportPermission[]> = {
  Owner: [ReportPermission.VIEW, ReportPermission.EDIT, ReportPermission.DELETE, ReportPermission.SHARE, ReportPermission.EXPORT, ReportPermission.SCHEDULE, ReportPermission.ADMIN],
  Administrator: [ReportPermission.VIEW, ReportPermission.EDIT, ReportPermission.DELETE, ReportPermission.SHARE, ReportPermission.EXPORT, ReportPermission.SCHEDULE, ReportPermission.ADMIN],
  Accountant: [ReportPermission.VIEW, ReportPermission.EDIT, ReportPermission.EXPORT],
  Doctor: [ReportPermission.VIEW, ReportPermission.EXPORT],
  Receptionist: [ReportPermission.VIEW, ReportPermission.EXPORT],
  Staff: [ReportPermission.VIEW, ReportPermission.EXPORT],
  Patient: [ReportPermission.VIEW],
};

/**
 * Category-based role restrictions
 */
const CATEGORY_ROLE_RESTRICTIONS: Record<string, ReportCategory[]> = {
  Patient: [ReportCategory.PATIENT, ReportCategory.APPOINTMENT, ReportCategory.PRESCRIPTION],
  Doctor: [ReportCategory.PATIENT, ReportCategory.APPOINTMENT, ReportCategory.PRESCRIPTION, ReportCategory.DOCTOR],
  Accountant: [ReportCategory.FINANCIAL, ReportCategory.BILLING, ReportCategory.PAYMENT],
  Receptionist: [ReportCategory.APPOINTMENT, ReportCategory.PATIENT, ReportCategory.BILLING],
  Staff: [ReportCategory.APPOINTMENT, ReportCategory.PATIENT, ReportCategory.INVENTORY],
  Owner: Object.values(ReportCategory),
  Administrator: Object.values(ReportCategory),
};

/**
 * Check if user has permission for report operation
 */
export async function hasReportPermission(permission: ReportPermission): Promise<boolean> {
  const role = await getUserRole();
  const permissions = ROLE_REPORT_ACCESS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if user can access report category
 */
export async function canAccessReportCategory(category: ReportCategory): Promise<boolean> {
  const role = await getUserRole();
  const allowedCategories = CATEGORY_ROLE_RESTRICTIONS[role] || [];
  return allowedCategories.includes(category);
}

/**
 * Validate report view permission
 */
export async function validateReportViewPermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.VIEW))) {
    logger.warn('Unauthorized report view attempt', { reportId });
    throw new Error('You do not have permission to view reports');
  }
}

/**
 * Validate report edit permission
 */
export async function validateReportEditPermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.EDIT))) {
    logger.warn('Unauthorized report edit attempt', { reportId });
    throw new Error('You do not have permission to edit reports');
  }
}

/**
 * Validate report delete permission
 */
export async function validateReportDeletePermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.DELETE))) {
    logger.warn('Unauthorized report delete attempt', { reportId });
    throw new Error('You do not have permission to delete reports');
  }
}

/**
 * Validate report share permission
 */
export async function validateReportSharePermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.SHARE))) {
    logger.warn('Unauthorized report share attempt', { reportId });
    throw new Error('You do not have permission to share reports');
  }
}

/**
 * Validate report export permission
 */
export async function validateReportExportPermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.EXPORT))) {
    logger.warn('Unauthorized report export attempt', { reportId });
    throw new Error('You do not have permission to export reports');
  }
}

/**
 * Validate report schedule permission
 */
export async function validateReportSchedulePermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.SCHEDULE))) {
    logger.warn('Unauthorized report schedule attempt', { reportId });
    throw new Error('You do not have permission to schedule reports');
  }
}

/**
 * Validate report admin permission
 */
export async function validateReportAdminPermission(reportId?: string): Promise<void> {
  if (!(await hasReportPermission(ReportPermission.ADMIN))) {
    logger.warn('Unauthorized report admin attempt', { reportId });
    throw new Error('You do not have permission to perform admin operations on reports');
  }
}

/**
 * Validate report category access
 */
export async function validateReportCategoryAccess(category: ReportCategory): Promise<void> {
  if (!(await canAccessReportCategory(category))) {
    logger.warn('Unauthorized report category access attempt', { category });
    throw new Error('You do not have permission to access reports in this category');
  }
}

/**
 * Validate financial report access (restricted to accountants and above)
 */
export async function validateFinancialReportAccess(): Promise<void> {
  const role = await getUserRole();
  if (!['Owner', 'Administrator', 'Accountant'].includes(role)) {
    logger.warn('Unauthorized financial report access attempt', { role });
    throw new Error('You do not have permission to access financial reports');
  }
}

/**
 * Validate medical report access (restricted to doctors and above)
 */
export async function validateMedicalReportAccess(): Promise<void> {
  const role = await getUserRole();
  if (!['Owner', 'Administrator', 'Doctor'].includes(role)) {
    logger.warn('Unauthorized medical report access attempt', { role });
    throw new Error('You do not have permission to access medical reports');
  }
}

/**
 * Validate clinic isolation for reports
 */
export async function validateReportClinicIsolation(clinicId: string): Promise<void> {
  const userClinicId = await getUserClinicId();
  if (clinicId !== userClinicId) {
    logger.warn('Report clinic isolation violation', { userClinicId, requestedClinicId: clinicId });
    throw new Error('You can only access reports from your clinic');
  }
}

/**
 * Get user's accessible report categories
 */
export async function getAccessibleReportCategories(): Promise<ReportCategory[]> {
  const role = await getUserRole();
  return CATEGORY_ROLE_RESTRICTIONS[role] || [];
}

/**
 * Get user's report permissions
 */
export async function getUserReportPermissions(): Promise<ReportPermission[]> {
  const role = await getUserRole();
  return ROLE_REPORT_ACCESS[role] || [];
}
