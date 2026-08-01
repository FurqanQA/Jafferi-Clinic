import { createPermissionCheckers } from '../core/base-permissions';
import { getUserRole, getCurrentUser, getUserClinicId } from '../core/auth';
import { getSupabaseClient } from '../core/client';
import { logger } from '../shared/logger';

const labCheckers = createPermissionCheckers('laboratory');

/**
 * Validate create laboratory order permission
 */
export async function validateCreateLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canCreate())) {
    throw new Error('You do not have permission to create laboratory orders');
  }
}

/**
 * Validate update laboratory order permission
 */
export async function validateUpdateLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canUpdate())) {
    throw new Error('You do not have permission to update laboratory orders');
  }
}

/**
 * Validate collect sample permission (lab technician only)
 */
export async function validateCollectSamplePermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'lab_technician' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only lab technicians, owners, and administrators can collect samples');
  }
}

/**
 * Validate start processing permission (lab technician only)
 */
export async function validateStartProcessingPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'lab_technician' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only lab technicians, owners, and administrators can start processing tests');
  }
}

/**
 * Validate upload results permission (lab technician only)
 */
export async function validateUploadResultsPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'lab_technician' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only lab technicians, owners, and administrators can upload results');
  }
}

/**
 * Validate review results permission (doctor only)
 */
export async function validateReviewResultsPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can review results');
  }
}

/**
 * Validate approve results permission (doctor only)
 */
export async function validateApproveResultsPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'doctor' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only doctors, owners, and administrators can approve results');
  }
}

/**
 * Validate upload imaging report permission (radiologist only)
 */
export async function validateUploadImagingPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'radiologist' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only radiologists, owners, and administrators can upload imaging reports');
  }
}

/**
 * Validate approve imaging permission (radiologist only)
 */
export async function validateApproveImagingPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'radiologist' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only radiologists, owners, and administrators can approve imaging');
  }
}

/**
 * Validate read laboratory order permission
 */
export async function validateReadLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canRead())) {
    throw new Error('You do not have permission to read laboratory orders');
  }
}

/**
 * Validate delete laboratory order permission
 */
export async function validateDeleteLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canDelete())) {
    throw new Error('You do not have permission to delete laboratory orders');
  }
}

/**
 * Validate archive laboratory order permission
 */
export async function validateArchiveLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canArchive())) {
    throw new Error('You do not have permission to archive laboratory orders');
  }
}

/**
 * Validate restore laboratory order permission
 */
export async function validateRestoreLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canRestore())) {
    throw new Error('You do not have permission to restore laboratory orders');
  }
}

/**
 * Validate export laboratory order permission
 */
export async function validateExportLabOrderPermission(): Promise<void> {
  if (!(await labCheckers.canExport())) {
    throw new Error('You do not have permission to export laboratory orders');
  }
}

/**
 * Validate manage template permission
 */
export async function validateManageTemplatePermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator' && role !== 'lab_technician') {
    throw new Error('Only owners, administrators, and lab technicians can manage laboratory templates');
  }
}

/**
 * Validate laboratory order clinic access
 */
export async function validateLabOrderClinicAccess(labOrderId: string): Promise<void> {
  await labCheckers.validateClinicAccess(labOrderId, 'lab_orders');
}

/**
 * Validate doctor can manage their own laboratory orders
 */
export async function validateManageLabOrderAccess(labOrderId: string): Promise<void> {
  const role = await getUserRole();
  
  // Owners and administrators can manage all orders
  if (role === 'owner' || role === 'administrator') {
    return;
  }
  
  // Lab technicians and radiologists can manage all orders within their clinic
  if (role === 'lab_technician' || role === 'radiologist') {
    await validateLabOrderClinicAccess(labOrderId);
    return;
  }
  
  // Doctors can only manage their own orders
  if (role === 'doctor') {
    const user = await getCurrentUser();
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('lab_orders')
      .select('doctor_id')
      .eq('id', labOrderId)
      .single();
    
    if (error || !data) {
      throw new Error('Laboratory order not found');
    }
    
    if (data.doctor_id !== user.id) {
      throw new Error('Access denied: You can only manage your own laboratory orders');
    }
    
    return;
  }
  
  // Receptionists and staff cannot manage orders
  throw new Error('You do not have permission to manage laboratory orders');
}

/**
 * Validate schedule test permission (receptionist only)
 */
export async function validateScheduleTestPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'receptionist' && role !== 'owner' && role !== 'administrator') {
    throw new Error('Only receptionists, owners, and administrators can schedule tests');
  }
}
