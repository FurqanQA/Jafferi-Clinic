import { createPermissionCheckers } from '../core/base-permissions';

// Create permission checkers for patients resource
const patientPermissions = createPermissionCheckers('patients');

/**
 * Check if user can create patients
 */
export async function canCreatePatient(): Promise<boolean> {
  return patientPermissions.canCreate();
}

/**
 * Check if user can read patients
 */
export async function canReadPatient(): Promise<boolean> {
  return patientPermissions.canRead();
}

/**
 * Check if user can update patients
 */
export async function canUpdatePatient(): Promise<boolean> {
  return patientPermissions.canUpdate();
}

/**
 * Check if user can delete patients
 */
export async function canDeletePatient(): Promise<boolean> {
  return patientPermissions.canDelete();
}

/**
 * Check if user can archive patients
 */
export async function canArchivePatient(): Promise<boolean> {
  return patientPermissions.canArchive();
}

/**
 * Check if user can restore patients
 */
export async function canRestorePatient(): Promise<boolean> {
  return patientPermissions.canRestore();
}

/**
 * Check if user can export patients
 */
export async function canExportPatients(): Promise<boolean> {
  return patientPermissions.canExport();
}

/**
 * Validate user has permission to create patient
 */
export async function validateCreatePatientPermission(): Promise<void> {
  await patientPermissions.validateCreate();
}

/**
 * Validate user has permission to read patient
 */
export async function validateReadPatientPermission(): Promise<void> {
  await patientPermissions.validateRead();
}

/**
 * Validate user has permission to update patient
 */
export async function validateUpdatePatientPermission(): Promise<void> {
  await patientPermissions.validateUpdate();
}

/**
 * Validate user has permission to delete patient
 */
export async function validateDeletePatientPermission(): Promise<void> {
  await patientPermissions.validateDelete();
}

/**
 * Validate user has permission to archive patient
 */
export async function validateArchivePatientPermission(): Promise<void> {
  await patientPermissions.validateArchive();
}

/**
 * Validate user has permission to restore patient
 */
export async function validateRestorePatientPermission(): Promise<void> {
  await patientPermissions.validateRestore();
}

/**
 * Validate user has permission to export patients
 */
export async function validateExportPatientsPermission(): Promise<void> {
  await patientPermissions.validateExport();
}

/**
 * Validate patient belongs to user's clinic
 */
export async function validatePatientClinicAccess(patientId: string): Promise<void> {
  await patientPermissions.validateClinicAccess(patientId, 'patients');
}
