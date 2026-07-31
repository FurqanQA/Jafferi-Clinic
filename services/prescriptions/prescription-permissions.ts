import { createPermissionCheckers } from '../core/base-permissions';
import { getCurrentUser, getUserRole } from '../core/auth';
import { getSupabaseClient } from '../core/client';

const prescriptionPermissions = createPermissionCheckers('prescriptions');

/**
 * Validate permission to create a prescription
 * Only doctors can create prescriptions
 */
export async function validateCreatePrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can create prescriptions');
  }
  
  await prescriptionPermissions.validateCreate();
}

/**
 * Validate permission to update a prescription
 * Only doctors can update prescriptions
 */
export async function validateUpdatePrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can update prescriptions');
  }
  
  await prescriptionPermissions.validateUpdate();
}

/**
 * Validate permission to sign a prescription
 * Only doctors can sign prescriptions
 */
export async function validateSignPrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor') {
    throw new Error('Only doctors can sign prescriptions');
  }
}

/**
 * Validate permission to complete a prescription
 * Only doctors and pharmacists can complete prescriptions
 */
export async function validateCompletePrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can complete prescriptions');
  }
}

/**
 * Validate permission to read a prescription
 * Doctors, receptionists, owners, and administrators can read
 * Accountants have no access
 */
export async function validateReadPrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role === 'accountant') {
    throw new Error('Accountants do not have access to prescriptions');
  }
  
  await prescriptionPermissions.validateRead();
}

/**
 * Validate permission to delete a prescription
 * Only owners and administrators can delete prescriptions
 */
export async function validateDeletePrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can delete prescriptions');
  }
  
  await prescriptionPermissions.validateDelete();
}

/**
 * Validate permission to archive a prescription
 * Only owners and administrators can archive prescriptions
 */
export async function validateArchivePrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can archive prescriptions');
  }
}

/**
 * Validate permission to restore a prescription
 * Only owners and administrators can restore prescriptions
 */
export async function validateRestorePrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can restore prescriptions');
  }
}

/**
 * Validate permission to export prescriptions
 * Only owners, administrators, and doctors can export prescriptions
 */
export async function validateExportPrescriptionPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role === 'accountant' || role === 'receptionist' || role === 'staff') {
    throw new Error('Only owners, administrators, and doctors can export prescriptions');
  }
}

/**
 * Validate permission to manage prescription templates
 * Only owners, administrators, and doctors can manage templates
 */
export async function validateManageTemplatePermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator' && role !== 'doctor') {
    throw new Error('Only owners, administrators, and doctors can manage prescription templates');
  }
}

/**
 * Validate clinic access for a prescription
 */
export async function validatePrescriptionClinicAccess(prescriptionId: string): Promise<void> {
  const { getUserClinicId } = await import('../core/auth');
  const { getSupabaseClient } = await import('../core/client');
  
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('prescriptions')
    .select('clinic_id')
    .eq('id', prescriptionId)
    .single();
  
  if (error || !data) {
    throw new Error('Prescription not found');
  }
  
  if (data.clinic_id !== clinicId) {
    throw new Error('Access denied: Prescription belongs to another clinic');
  }
}

/**
 * Check if a doctor can manage their own prescription
 */
export async function canManageOwnPrescription(prescriptionId: string): Promise<boolean> {
  const user = await getCurrentUser();
  const userId = user.id;
  const role = await getUserRole();
  
  if (role === 'owner' || role === 'administrator') {
    return true;
  }
  
  if (role === 'doctor') {
    const supabase = getSupabaseClient();
    const { data: prescription } = await supabase
      .from('prescriptions')
      .select('doctor_id')
      .eq('id', prescriptionId)
      .single();
    
    return prescription?.doctor_id === userId;
  }
  
  return false;
}

/**
 * Validate that a user can manage a specific prescription
 */
export async function validateManagePrescriptionAccess(prescriptionId: string): Promise<void> {
  const canManage = await canManageOwnPrescription(prescriptionId);
  
  if (!canManage) {
    throw new Error('Access denied: You do not have permission to manage this prescription');
  }
}
