import { createPermissionCheckers } from '../core/base-permissions';

// Create permission checkers for appointments resource
const appointmentPermissions = createPermissionCheckers('appointments');

/**
 * Check if user can create appointments
 */
export async function canCreateAppointment(): Promise<boolean> {
  return appointmentPermissions.canCreate();
}

/**
 * Check if user can read appointments
 */
export async function canReadAppointment(): Promise<boolean> {
  return appointmentPermissions.canRead();
}

/**
 * Check if user can update appointments
 */
export async function canUpdateAppointment(): Promise<boolean> {
  return appointmentPermissions.canUpdate();
}

/**
 * Check if user can delete appointments
 */
export async function canDeleteAppointment(): Promise<boolean> {
  return appointmentPermissions.canDelete();
}

/**
 * Check if user can archive appointments
 */
export async function canArchiveAppointment(): Promise<boolean> {
  return appointmentPermissions.canArchive();
}

/**
 * Check if user can restore appointments
 */
export async function canRestoreAppointment(): Promise<boolean> {
  return appointmentPermissions.canRestore();
}

/**
 * Check if user can export appointments
 */
export async function canExportAppointments(): Promise<boolean> {
  return appointmentPermissions.canExport();
}

/**
 * Validate user has permission to create appointment
 */
export async function validateCreateAppointmentPermission(): Promise<void> {
  await appointmentPermissions.validateCreate();
}

/**
 * Validate user has permission to read appointment
 */
export async function validateReadAppointmentPermission(): Promise<void> {
  await appointmentPermissions.validateRead();
}

/**
 * Validate user has permission to update appointment
 */
export async function validateUpdateAppointmentPermission(): Promise<void> {
  await appointmentPermissions.validateUpdate();
}

/**
 * Validate user has permission to delete appointment
 */
export async function validateDeleteAppointmentPermission(): Promise<void> {
  await appointmentPermissions.validateDelete();
}

/**
 * Validate user has permission to archive appointment
 */
export async function validateArchiveAppointmentPermission(): Promise<void> {
  await appointmentPermissions.validateArchive();
}

/**
 * Validate user has permission to restore appointment
 */
export async function validateRestoreAppointmentPermission(): Promise<void> {
  await appointmentPermissions.validateRestore();
}

/**
 * Validate user has permission to export appointments
 */
export async function validateExportAppointmentsPermission(): Promise<void> {
  await appointmentPermissions.validateExport();
}

/**
 * Validate appointment belongs to user's clinic
 */
export async function validateAppointmentClinicAccess(appointmentId: string): Promise<void> {
  await appointmentPermissions.validateClinicAccess(appointmentId, 'appointments');
}

/**
 * Check if user can manage their own appointments (for doctors)
 */
export async function canManageOwnAppointment(appointmentId: string): Promise<boolean> {
  const { getCurrentUser, getUserRole } = await import('../core/auth');
  const { getSupabaseClient } = await import('../core/client');
  
  const user = await getCurrentUser();
  const userId = user.id;
  const role = await getUserRole();
  
  // Owners and administrators can manage any appointment
  if (role === 'owner' || role === 'administrator') {
    return true;
  }
  
  // Doctors can only manage their own appointments
  if (role === 'doctor') {
    const supabase = getSupabaseClient();
    const { data: appointment } = await supabase
      .from('appointments')
      .select('doctor_id')
      .eq('id', appointmentId)
      .single();
    
    return appointment?.doctor_id === userId;
  }
  
  return false;
}
