import { createPermissionCheckers } from '../core/base-permissions';

// Create permission checkers for doctors resource
const doctorPermissions = createPermissionCheckers('doctors');

/**
 * Check if user can create doctors
 */
export async function canCreateDoctor(): Promise<boolean> {
  return doctorPermissions.canCreate();
}

/**
 * Check if user can read doctors
 */
export async function canReadDoctor(): Promise<boolean> {
  return doctorPermissions.canRead();
}

/**
 * Check if user can update doctors
 */
export async function canUpdateDoctor(): Promise<boolean> {
  return doctorPermissions.canUpdate();
}

/**
 * Check if user can delete doctors
 */
export async function canDeleteDoctor(): Promise<boolean> {
  return doctorPermissions.canDelete();
}

/**
 * Check if user can archive doctors
 */
export async function canArchiveDoctor(): Promise<boolean> {
  return doctorPermissions.canArchive();
}

/**
 * Check if user can restore doctors
 */
export async function canRestoreDoctor(): Promise<boolean> {
  return doctorPermissions.canRestore();
}

/**
 * Check if user can export doctors
 */
export async function canExportDoctors(): Promise<boolean> {
  return doctorPermissions.canExport();
}

/**
 * Validate user has permission to create doctor
 */
export async function validateCreateDoctorPermission(): Promise<void> {
  await doctorPermissions.validateCreate();
}

/**
 * Validate user has permission to read doctor
 */
export async function validateReadDoctorPermission(): Promise<void> {
  await doctorPermissions.validateRead();
}

/**
 * Validate user has permission to update doctor
 */
export async function validateUpdateDoctorPermission(): Promise<void> {
  await doctorPermissions.validateUpdate();
}

/**
 * Validate user has permission to delete doctor
 */
export async function validateDeleteDoctorPermission(): Promise<void> {
  await doctorPermissions.validateDelete();
}

/**
 * Validate user has permission to archive doctor
 */
export async function validateArchiveDoctorPermission(): Promise<void> {
  await doctorPermissions.validateArchive();
}

/**
 * Validate user has permission to restore doctor
 */
export async function validateRestoreDoctorPermission(): Promise<void> {
  await doctorPermissions.validateRestore();
}

/**
 * Validate user has permission to export doctors
 */
export async function validateExportDoctorsPermission(): Promise<void> {
  await doctorPermissions.validateExport();
}

/**
 * Validate doctor belongs to user's clinic
 */
export async function validateDoctorClinicAccess(doctorId: string): Promise<void> {
  await doctorPermissions.validateClinicAccess(doctorId, 'doctors');
}
