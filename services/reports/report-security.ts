import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { ReportCategory } from './report-types';

// ============================================================================
// Report Security
// Security controls for sensitive report data
// ============================================================================

/**
 * Data sensitivity levels
 */
export enum DataSensitivity {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
}

/**
 * Security context for report access
 */
export interface SecurityContext {
  userId: string;
  clinicId: string;
  role: string;
  permissions: string[];
}

/**
 * Get security context for current user
 */
export async function getSecurityContext(): Promise<SecurityContext> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const role = user.user_metadata?.role || '';

  return {
    userId: user.id,
    clinicId,
    role,
    permissions: getRolePermissions(role),
  };
}

/**
 * Get permissions for a role
 */
function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    Owner: ['view_all', 'edit_all', 'delete_all', 'share_all', 'export_all', 'admin'],
    Administrator: ['view_all', 'edit_all', 'delete_all', 'share_all', 'export_all', 'admin'],
    Accountant: ['view_financial', 'edit_financial', 'export_financial'],
    Doctor: ['view_medical', 'view_patient', 'export_medical'],
    Receptionist: ['view_appointment', 'view_patient', 'export_appointment'],
    Staff: ['view_appointment', 'view_patient', 'export_appointment'],
    Patient: ['view_own_data'],
  };

  return rolePermissions[role] || [];
}

/**
 * Check if user has required permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const context = await getSecurityContext();
  return context.permissions.includes(permission) || context.permissions.includes('admin');
}

/**
 * Check data sensitivity for report category
 */
export function getDataSensitivity(category: ReportCategory): DataSensitivity {
  const sensitivityMap: Record<ReportCategory, DataSensitivity> = {
    [ReportCategory.FINANCIAL]: DataSensitivity.RESTRICTED,
    [ReportCategory.PATIENT]: DataSensitivity.CONFIDENTIAL,
    [ReportCategory.DOCTOR]: DataSensitivity.INTERNAL,
    [ReportCategory.APPOINTMENT]: DataSensitivity.INTERNAL,
    [ReportCategory.PRESCRIPTION]: DataSensitivity.CONFIDENTIAL,
    [ReportCategory.LABORATORY]: DataSensitivity.CONFIDENTIAL,
    [ReportCategory.INVENTORY]: DataSensitivity.INTERNAL,
    [ReportCategory.BILLING]: DataSensitivity.RESTRICTED,
    [ReportCategory.PAYMENT]: DataSensitivity.RESTRICTED,
    [ReportCategory.NOTIFICATION]: DataSensitivity.INTERNAL,
    [ReportCategory.DASHBOARD]: DataSensitivity.INTERNAL,
    [ReportCategory.OPERATIONAL]: DataSensitivity.INTERNAL,
    [ReportCategory.COMPLIANCE]: DataSensitivity.RESTRICTED,
    [ReportCategory.KPI]: DataSensitivity.INTERNAL,
    [ReportCategory.FORECASTING]: DataSensitivity.INTERNAL,
    [ReportCategory.CUSTOM]: DataSensitivity.INTERNAL,
  };

  return sensitivityMap[category];
}

/**
 * Check if user can access data with given sensitivity
 */
export async function canAccessData(sensitivity: DataSensitivity): Promise<boolean> {
  const context = await getSecurityContext();

  const sensitivityLevels: Record<DataSensitivity, number> = {
    [DataSensitivity.PUBLIC]: 0,
    [DataSensitivity.INTERNAL]: 1,
    [DataSensitivity.CONFIDENTIAL]: 2,
    [DataSensitivity.RESTRICTED]: 3,
  };

  const roleLevels: Record<string, number> = {
    Owner: 3,
    Administrator: 3,
    Accountant: 3,
    Doctor: 2,
    Receptionist: 1,
    Staff: 1,
    Patient: 1,
  };

  const userLevel = roleLevels[context.role] || 0;
  const requiredLevel = sensitivityLevels[sensitivity];

  return userLevel >= requiredLevel;
}

/**
 * Sanitize report data based on user permissions
 */
export async function sanitizeReportData(
  data: any[],
  category: ReportCategory
): Promise<any[]> {
  const sensitivity = getDataSensitivity(category);
  const canAccess = await canAccessData(sensitivity);

  if (!canAccess) {
    logger.warn('Access denied to sensitive data', { category, sensitivity });
    return [];
  }

  // Apply field-level filtering based on role
  const context = await getSecurityContext();
  return filterSensitiveFields(data, context.role, category);
}

/**
 * Filter sensitive fields based on role
 */
function filterSensitiveFields(data: any[], role: string, category: ReportCategory): any[] {
  // Placeholder for field-level filtering logic
  // This would remove sensitive fields based on role and category
  return data;
}

/**
 * Mask sensitive data
 */
export function maskSensitiveData(value: any, fieldType: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (fieldType) {
    case 'email':
      return maskEmail(value);
    case 'phone':
      return maskPhone(value);
    case 'ssn':
      return maskSSN(value);
    case 'credit_card':
      return maskCreditCard(value);
    default:
      return value;
  }
}

/**
 * Mask email address
 */
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`;
}

/**
 * Mask phone number
 */
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
}

/**
 * Mask SSN
 */
function maskSSN(ssn: string): string {
  return '***-**-' + ssn.slice(-4);
}

/**
 * Mask credit card number
 */
function maskCreditCard(card: string): string {
  return '****-****-****-' + card.slice(-4);
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const context = await getSecurityContext();
    logger.warn('Security event logged', {
      eventType,
      userId: context.userId,
      clinicId: context.clinicId,
      role: context.role,
      ...details,
    });
  } catch (error) {
    logger.error('Failed to log security event', { error, eventType });
  }
}

/**
 * Validate report access for audit trail
 */
export async function validateReportAccessForAudit(
  reportId: string,
  category: ReportCategory
): Promise<{ authorized: boolean; reason?: string }> {
  try {
    const sensitivity = getDataSensitivity(category);
    const canAccess = await canAccessData(sensitivity);

    if (!canAccess) {
      await logSecurityEvent('REPORT_ACCESS_DENIED', { reportId, category, sensitivity });
      return { authorized: false, reason: 'Insufficient permissions for data sensitivity level' };
    }

    await logSecurityEvent('REPORT_ACCESS_GRANTED', { reportId, category, sensitivity });
    return { authorized: true };
  } catch (error) {
    logger.error('Failed to validate report access', { error, reportId });
    return { authorized: false, reason: 'Validation error' };
  }
}

/**
 * Encrypt sensitive report data
 */
export async function encryptReportData(data: any): Promise<string> {
  // Placeholder for encryption logic
  return JSON.stringify(data);
}

/**
 * Decrypt sensitive report data
 */
export async function decryptReportData(encrypted: string): Promise<any> {
  // Placeholder for decryption logic
  return JSON.parse(encrypted);
}
