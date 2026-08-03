import { AuthorizationError } from '../core/errors';
import { getUserRole, getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { DashboardRole } from './dashboard-types';

// ============================================================================
// Dashboard Permissions
// Permission checkers for dashboard access by role
// ============================================================================

/**
 * Role hierarchy for permission checks
 * Higher roles can access lower role dashboards
 */
const ROLE_HIERARCHY: Record<DashboardRole, number> = {
  [DashboardRole.OWNER]: 6,
  [DashboardRole.ADMINISTRATOR]: 5,
  [DashboardRole.ACCOUNTANT]: 4,
  [DashboardRole.DOCTOR]: 3,
  [DashboardRole.RECEPTIONIST]: 2,
  [DashboardRole.PATIENT]: 1,
};

/**
 * Check if user can access owner dashboard
 */
export async function validateOwnerDashboardAccess(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== DashboardRole.OWNER) {
    logger.warn('Unauthorized access attempt to owner dashboard', { role });
    throw new AuthorizationError('Access denied: Owner dashboard requires owner role');
  }
}

/**
 * Check if user can access administrator dashboard
 */
export async function validateAdministratorDashboardAccess(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== DashboardRole.ADMINISTRATOR && role !== DashboardRole.OWNER) {
    logger.warn('Unauthorized access attempt to administrator dashboard', { role });
    throw new AuthorizationError('Access denied: Administrator dashboard requires administrator or owner role');
  }
}

/**
 * Check if user can access doctor dashboard
 */
export async function validateDoctorDashboardAccess(targetDoctorId?: string): Promise<void> {
  const role = await getUserRole();
  const user = await getCurrentUser();
  
  // Owner and admin can access any doctor dashboard
  if (role === DashboardRole.OWNER || role === DashboardRole.ADMINISTRATOR) {
    return;
  }
  
  // Doctors can only access their own dashboard
  if (role === DashboardRole.DOCTOR) {
    if (targetDoctorId && targetDoctorId !== user.id) {
      logger.warn('Unauthorized access attempt to doctor dashboard', { userId: user.id, targetDoctorId });
      throw new AuthorizationError('Access denied: Doctors can only view their own dashboard');
    }
    return;
  }
  
  logger.warn('Unauthorized access attempt to doctor dashboard', { role });
  throw new AuthorizationError('Access denied: Doctor dashboard requires doctor role or higher');
}

/**
 * Check if user can access receptionist dashboard
 */
export async function validateReceptionistDashboardAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.RECEPTIONIST,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.OWNER,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to receptionist dashboard', { role });
    throw new AuthorizationError('Access denied: Receptionist dashboard requires receptionist role or higher');
  }
}

/**
 * Check if user can access accountant dashboard
 */
export async function validateAccountantDashboardAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.ACCOUNTANT,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.OWNER,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to accountant dashboard', { role });
    throw new AuthorizationError('Access denied: Accountant dashboard requires accountant role or higher');
  }
}

/**
 * Check if user can access patient dashboard
 */
export async function validatePatientDashboardAccess(targetPatientId?: string): Promise<void> {
  const role = await getUserRole();
  const user = await getCurrentUser();
  
  // Owner, admin, doctor, and receptionist can access patient dashboards
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.DOCTOR,
    DashboardRole.RECEPTIONIST,
  ];
  
  if (allowedRoles.includes(role as DashboardRole)) {
    return;
  }
  
  // Patients can only access their own dashboard
  if (role === DashboardRole.PATIENT) {
    if (targetPatientId && targetPatientId !== user.id) {
      logger.warn('Unauthorized access attempt to patient dashboard', { userId: user.id, targetPatientId });
      throw new AuthorizationError('Access denied: Patients can only view their own dashboard');
    }
    return;
  }
  
  logger.warn('Unauthorized access attempt to patient dashboard', { role });
  throw new AuthorizationError('Access denied: Patient dashboard requires patient role or higher');
}

/**
 * Check if user can access specific dashboard type
 */
export async function validateDashboardAccess(dashboardRole: DashboardRole, targetId?: string): Promise<void> {
  switch (dashboardRole) {
    case DashboardRole.OWNER:
      await validateOwnerDashboardAccess();
      break;
    case DashboardRole.ADMINISTRATOR:
      await validateAdministratorDashboardAccess();
      break;
    case DashboardRole.DOCTOR:
      await validateDoctorDashboardAccess(targetId);
      break;
    case DashboardRole.RECEPTIONIST:
      await validateReceptionistDashboardAccess();
      break;
    case DashboardRole.ACCOUNTANT:
      await validateAccountantDashboardAccess();
      break;
    case DashboardRole.PATIENT:
      await validatePatientDashboardAccess(targetId);
      break;
    default:
      throw new AuthorizationError(`Unknown dashboard role: ${dashboardRole}`);
  }
}

/**
 * Check if user can view analytics
 */
export async function validateAnalyticsAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.ACCOUNTANT,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to analytics', { role });
    throw new AuthorizationError('Access denied: Analytics requires accountant role or higher');
  }
}

/**
 * Check if user can export dashboard data
 */
export async function validateExportAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.ACCOUNTANT,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to export', { role });
    throw new AuthorizationError('Access denied: Export requires accountant role or higher');
  }
}

/**
 * Check if user can view financial data
 */
export async function validateFinancialAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.ACCOUNTANT,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to financial data', { role });
    throw new AuthorizationError('Access denied: Financial data requires accountant role or higher');
  }
}

/**
 * Check if user can view patient data
 */
export async function validatePatientDataAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.DOCTOR,
    DashboardRole.RECEPTIONIST,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to patient data', { role });
    throw new AuthorizationError('Access denied: Patient data requires receptionist role or higher');
  }
}

/**
 * Check if user can view medical data
 */
export async function validateMedicalDataAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.DOCTOR,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to medical data', { role });
    throw new AuthorizationError('Access denied: Medical data requires doctor role or higher');
  }
}

/**
 * Check if user can view laboratory data
 */
export async function validateLaboratoryAccess(): Promise<void> {
  const role = await getUserRole();
  
  const allowedRoles = [
    DashboardRole.OWNER,
    DashboardRole.ADMINISTRATOR,
    DashboardRole.DOCTOR,
  ];
  
  if (!allowedRoles.includes(role as DashboardRole)) {
    logger.warn('Unauthorized access attempt to laboratory data', { role });
    throw new AuthorizationError('Access denied: Laboratory data requires doctor role or higher');
  }
}

/**
 * Check if user can manage clinic settings
 */
export async function validateClinicSettingsAccess(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== DashboardRole.OWNER && role !== DashboardRole.ADMINISTRATOR) {
    logger.warn('Unauthorized access attempt to clinic settings', { role });
    throw new AuthorizationError('Access denied: Clinic settings require administrator role or higher');
  }
}

/**
 * Check if user can view staff data
 */
export async function validateStaffAccess(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== DashboardRole.OWNER && role !== DashboardRole.ADMINISTRATOR) {
    logger.warn('Unauthorized access attempt to staff data', { role });
    throw new AuthorizationError('Access denied: Staff data require administrator role or higher');
  }
}

/**
 * Check if user's role can access target role's dashboard
 */
export function canAccessDashboard(userRole: DashboardRole, targetDashboard: DashboardRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole];
  const targetLevel = ROLE_HIERARCHY[targetDashboard];
  
  // Users can always access their own role dashboard
  if (userRole === targetDashboard) {
    return true;
  }
  
  // Higher roles can access lower role dashboards
  return userLevel >= targetLevel;
}

/**
 * Get accessible dashboard types for user role
 */
export function getAccessibleDashboards(role: DashboardRole): DashboardRole[] {
  const userLevel = ROLE_HIERARCHY[role];
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => userLevel >= level)
    .map(([dashboardRole]) => dashboardRole as DashboardRole);
}

/**
 * Validate clinic isolation - ensure user can only access their clinic's data
 */
export async function validateClinicIsolation(targetClinicId?: string): Promise<string> {
  const userClinicId = await getUserClinicId();
  
  if (targetClinicId && targetClinicId !== userClinicId) {
    logger.warn('Cross-clinic access attempt blocked', { userClinicId, targetClinicId });
    throw new AuthorizationError('Access denied: Cannot access data from another clinic');
  }
  
  return userClinicId;
}
