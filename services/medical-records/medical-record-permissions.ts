import { createPermissionCheckers } from '../core/base-permissions';
import { getCurrentUser, getUserRole } from '../core/auth';
import { getSupabaseClient } from '../core/client';

const medicalRecordPermissions = createPermissionCheckers('medical_records');

/**
 * Validate permission to create a medical record
 * Only doctors can create medical records
 */
export async function validateCreateMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can create medical records');
  }
  
  await medicalRecordPermissions.validateCreate();
}

/**
 * Validate permission to update a medical record
 * Only doctors can update medical records
 */
export async function validateUpdateMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can update medical records');
  }
  
  await medicalRecordPermissions.validateUpdate();
}

/**
 * Validate permission to sign a medical record
 * Only doctors can sign medical records
 */
export async function validateSignMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'doctor') {
    throw new Error('Only doctors can sign medical records');
  }
}

/**
 * Validate permission to read a medical record
 * Doctors, receptionists, owners, and administrators can read
 * Accountants have no access
 */
export async function validateReadMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role === 'accountant') {
    throw new Error('Accountants do not have access to medical records');
  }
  
  await medicalRecordPermissions.validateRead();
}

/**
 * Validate permission to delete a medical record
 * Only owners and administrators can delete medical records
 */
export async function validateDeleteMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can delete medical records');
  }
  
  await medicalRecordPermissions.validateDelete();
}

/**
 * Validate permission to archive a medical record
 * Only owners and administrators can archive medical records
 */
export async function validateArchiveMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can archive medical records');
  }
}

/**
 * Validate permission to restore a medical record
 * Only owners and administrators can restore medical records
 */
export async function validateRestoreMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can restore medical records');
  }
}

/**
 * Validate permission to export medical records
 * Only owners, administrators, and doctors can export medical records
 */
export async function validateExportMedicalRecordPermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role === 'accountant' || role === 'receptionist' || role === 'staff') {
    throw new Error('Only owners, administrators, and doctors can export medical records');
  }
}

/**
 * Validate permission to manage medical record templates
 * Only owners, administrators, and doctors can manage templates
 */
export async function validateManageTemplatePermission(): Promise<void> {
  const role = await getUserRole();
  
  if (role !== 'owner' && role !== 'administrator' && role !== 'doctor') {
    throw new Error('Only owners, administrators, and doctors can manage medical record templates');
  }
}

/**
 * Validate clinic access for a medical record
 */
export async function validateMedicalRecordClinicAccess(medicalRecordId: string): Promise<void> {
  const { getUserClinicId } = await import('../core/auth');
  const { getSupabaseClient } = await import('../core/client');
  
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('medical_records')
    .select('clinic_id')
    .eq('id', medicalRecordId)
    .single();
  
  if (error || !data) {
    throw new Error('Medical record not found');
  }
  
  if (data.clinic_id !== clinicId) {
    throw new Error('Access denied: Medical record belongs to another clinic');
  }
}

/**
 * Check if a doctor can manage their own medical record
 */
export async function canManageOwnMedicalRecord(medicalRecordId: string): Promise<boolean> {
  const user = await getCurrentUser();
  const userId = user.id;
  const role = await getUserRole();
  
  if (role === 'owner' || role === 'administrator') {
    return true;
  }
  
  if (role === 'doctor') {
    const supabase = getSupabaseClient();
    const { data: medicalRecord } = await supabase
      .from('medical_records')
      .select('doctor_id')
      .eq('id', medicalRecordId)
      .single();
    
    return medicalRecord?.doctor_id === userId;
  }
  
  return false;
}

/**
 * Validate that a user can manage a specific medical record
 */
export async function validateManageMedicalRecordAccess(medicalRecordId: string): Promise<void> {
  const canManage = await canManageOwnMedicalRecord(medicalRecordId);
  
  if (!canManage) {
    throw new Error('Access denied: You do not have permission to manage this medical record');
  }
}
