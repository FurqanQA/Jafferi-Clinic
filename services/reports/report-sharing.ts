import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { ReportSharing } from './report-types';
import { validateReportSharePermission } from './report-permissions';

// ============================================================================
// Report Sharing
// Share reports with users, roles, and clinics
// ============================================================================

/**
 * Share report with specified users and roles
 */
export async function shareReport(
  reportId: string,
  sharing: ReportSharing
): Promise<ReportSharing> {
  await validateReportSharePermission(reportId);

  try {
    const clinicId = await getUserClinicId();

    // Placeholder for database update
    logger.info('Report shared', { reportId, sharing });
    return sharing;
  } catch (error) {
    logger.error('Failed to share report', { error, reportId });
    throw error;
  }
}

/**
 * Get report sharing settings
 */
export async function getReportSharing(reportId: string): Promise<ReportSharing | null> {
  try {
    // Placeholder for database query
    return null;
  } catch (error) {
    logger.error('Failed to get report sharing', { error, reportId });
    throw error;
  }
}

/**
 * Update report sharing settings
 */
export async function updateReportSharing(
  reportId: string,
  updates: Partial<ReportSharing>
): Promise<ReportSharing> {
  await validateReportSharePermission(reportId);

  try {
    // Placeholder for database update
    const sharing: ReportSharing = {
      users: updates.users || [],
      roles: updates.roles || [],
      clinics: updates.clinics || [],
      permissions: updates.permissions || 'view',
    };

    logger.info('Report sharing updated', { reportId });
    return sharing;
  } catch (error) {
    logger.error('Failed to update report sharing', { error, reportId });
    throw error;
  }
}

/**
 * Remove report sharing
 */
export async function removeReportSharing(reportId: string): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    // Placeholder for database update to remove sharing
    logger.info('Report sharing removed', { reportId });
  } catch (error) {
    logger.error('Failed to remove report sharing', { error, reportId });
    throw error;
  }
}

/**
 * Share report with specific users
 */
export async function shareReportWithUsers(
  reportId: string,
  userIds: string[],
  permission: 'view' | 'edit' | 'admin' = 'view'
): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    const currentSharing = await getReportSharing(reportId) || {
      users: [],
      roles: [],
      clinics: [],
      permissions: 'view',
    };

    const updatedSharing: ReportSharing = {
      ...currentSharing,
      users: [...new Set([...currentSharing.users, ...userIds])],
      permissions: permission,
    };

    await shareReport(reportId, updatedSharing);
    logger.info('Report shared with users', { reportId, userIds, permission });
  } catch (error) {
    logger.error('Failed to share report with users', { error, reportId });
    throw error;
  }
}

/**
 * Share report with specific roles
 */
export async function shareReportWithRoles(
  reportId: string,
  roles: string[],
  permission: 'view' | 'edit' | 'admin' = 'view'
): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    const currentSharing = await getReportSharing(reportId) || {
      users: [],
      roles: [],
      clinics: [],
      permissions: 'view',
    };

    const updatedSharing: ReportSharing = {
      ...currentSharing,
      roles: [...new Set([...currentSharing.roles, ...roles])],
      permissions: permission,
    };

    await shareReport(reportId, updatedSharing);
    logger.info('Report shared with roles', { reportId, roles, permission });
  } catch (error) {
    logger.error('Failed to share report with roles', { error, reportId });
    throw error;
  }
}

/**
 * Share report with specific clinics
 */
export async function shareReportWithClinics(
  reportId: string,
  clinicIds: string[],
  permission: 'view' | 'edit' | 'admin' = 'view'
): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    const currentSharing = await getReportSharing(reportId) || {
      users: [],
      roles: [],
      clinics: [],
      permissions: 'view',
    };

    const updatedSharing: ReportSharing = {
      ...currentSharing,
      clinics: [...new Set([...currentSharing.clinics, ...clinicIds])],
      permissions: permission,
    };

    await shareReport(reportId, updatedSharing);
    logger.info('Report shared with clinics', { reportId, clinicIds, permission });
  } catch (error) {
    logger.error('Failed to share report with clinics', { error, reportId });
    throw error;
  }
}

/**
 * Remove user from report sharing
 */
export async function removeUserFromSharing(reportId: string, userId: string): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    const currentSharing = await getReportSharing(reportId);
    if (currentSharing) {
      const updatedSharing: ReportSharing = {
        ...currentSharing,
        users: currentSharing.users.filter(id => id !== userId),
      };
      await shareReport(reportId, updatedSharing);
      logger.info('User removed from report sharing', { reportId, userId });
    }
  } catch (error) {
    logger.error('Failed to remove user from sharing', { error, reportId, userId });
    throw error;
  }
}

/**
 * Remove role from report sharing
 */
export async function removeRoleFromSharing(reportId: string, role: string): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    const currentSharing = await getReportSharing(reportId);
    if (currentSharing) {
      const updatedSharing: ReportSharing = {
        ...currentSharing,
        roles: currentSharing.roles.filter(r => r !== role),
      };
      await shareReport(reportId, updatedSharing);
      logger.info('Role removed from report sharing', { reportId, role });
    }
  } catch (error) {
    logger.error('Failed to remove role from sharing', { error, reportId, role });
    throw error;
  }
}

/**
 * Remove clinic from report sharing
 */
export async function removeClinicFromSharing(reportId: string, clinicId: string): Promise<void> {
  await validateReportSharePermission(reportId);

  try {
    const currentSharing = await getReportSharing(reportId);
    if (currentSharing) {
      const updatedSharing: ReportSharing = {
        ...currentSharing,
        clinics: currentSharing.clinics.filter(id => id !== clinicId),
      };
      await shareReport(reportId, updatedSharing);
      logger.info('Clinic removed from report sharing', { reportId, clinicId });
    }
  } catch (error) {
    logger.error('Failed to remove clinic from sharing', { error, reportId, clinicId });
    throw error;
  }
}

/**
 * Get reports shared with user
 */
export async function getReportsSharedWithUser(userId: string): Promise<string[]> {
  try {
    // Placeholder for database query
    return [];
  } catch (error) {
    logger.error('Failed to get reports shared with user', { error, userId });
    throw error;
  }
}

/**
 * Get reports shared with role
 */
export async function getReportsSharedWithRole(role: string): Promise<string[]> {
  try {
    // Placeholder for database query
    return [];
  } catch (error) {
    logger.error('Failed to get reports shared with role', { error, role });
    throw error;
  }
}

/**
 * Get reports shared with clinic
 */
export async function getReportsSharedWithClinic(clinicId: string): Promise<string[]> {
  try {
    // Placeholder for database query
    return [];
  } catch (error) {
    logger.error('Failed to get reports shared with clinic', { error, clinicId });
    throw error;
  }
}

/**
 * Check if user has access to shared report
 */
export async function checkSharedReportAccess(reportId: string, userId: string): Promise<boolean> {
  try {
    const sharing = await getReportSharing(reportId);
    if (!sharing) {
      return false;
    }

    // Check if user is in sharing list
    if (sharing.users.includes(userId)) {
      return true;
    }

    // Check if user's role is in sharing list
    // Placeholder for getting user role
    const userRole = ''; // await getUserRole(userId);
    if (sharing.roles.includes(userRole)) {
      return true;
    }

    // Check if user's clinic is in sharing list
    const userClinicId = await getUserClinicId();
    if (sharing.clinics.includes(userClinicId)) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Failed to check shared report access', { error, reportId, userId });
    return false;
  }
}
