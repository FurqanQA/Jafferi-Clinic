import { getUserRole, getUserClinicId } from '../core/auth';
import { hasPermission, canWrite, canDelete, type UserRole } from '../core/permissions';
import { AuthorizationError } from '../core/errors';

/**
 * Check if user can create patients
 */
export async function canCreatePatient(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients') && canWrite(role, 'patients');
}

/**
 * Check if user can read patients
 */
export async function canReadPatient(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients');
}

/**
 * Check if user can update patients
 */
export async function canUpdatePatient(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients') && canWrite(role, 'patients');
}

/**
 * Check if user can delete patients
 */
export async function canDeletePatient(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients') && canDelete(role, 'patients');
}

/**
 * Check if user can archive patients
 */
export async function canArchivePatient(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients') && canWrite(role, 'patients');
}

/**
 * Check if user can restore patients
 */
export async function canRestorePatient(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients') && canWrite(role, 'patients');
}

/**
 * Check if user can export patients
 */
export async function canExportPatients(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return hasPermission(role, 'patients');
}

/**
 * Validate user has permission to create patient
 */
export async function validateCreatePatientPermission(): Promise<void> {
  if (!(await canCreatePatient())) {
    throw new AuthorizationError('You do not have permission to create patients');
  }
}

/**
 * Validate user has permission to read patient
 */
export async function validateReadPatientPermission(): Promise<void> {
  if (!(await canReadPatient())) {
    throw new AuthorizationError('You do not have permission to view patients');
  }
}

/**
 * Validate user has permission to update patient
 */
export async function validateUpdatePatientPermission(): Promise<void> {
  if (!(await canUpdatePatient())) {
    throw new AuthorizationError('You do not have permission to update patients');
  }
}

/**
 * Validate user has permission to delete patient
 */
export async function validateDeletePatientPermission(): Promise<void> {
  if (!(await canDeletePatient())) {
    throw new AuthorizationError('You do not have permission to delete patients');
  }
}

/**
 * Validate user has permission to archive patient
 */
export async function validateArchivePatientPermission(): Promise<void> {
  if (!(await canArchivePatient())) {
    throw new AuthorizationError('You do not have permission to archive patients');
  }
}

/**
 * Validate user has permission to restore patient
 */
export async function validateRestorePatientPermission(): Promise<void> {
  if (!(await canRestorePatient())) {
    throw new AuthorizationError('You do not have permission to restore patients');
  }
}

/**
 * Validate user has permission to export patients
 */
export async function validateExportPatientsPermission(): Promise<void> {
  if (!(await canExportPatients())) {
    throw new AuthorizationError('You do not have permission to export patients');
  }
}

/**
 * Validate patient belongs to user's clinic
 */
export async function validatePatientClinicAccess(patientId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { data: patient, error } = await supabase
    .from('patients')
    .select('clinic_id')
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    throw new AuthorizationError('Patient not found');
  }

  if (patient.clinic_id !== clinicId) {
    throw new AuthorizationError('You do not have access to this patient');
  }
}
