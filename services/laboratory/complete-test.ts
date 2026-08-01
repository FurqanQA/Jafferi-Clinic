import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUploadResultsPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { validateStatusTransition } from './laboratory-validation';
import { LabOrder, LAB_ORDER_STATUS, LabResult } from './laboratory-types';
import { createLabResult } from './results';

/**
 * Complete test and mark results as ready
 */
export async function completeTest(labOrderId: string, results: LabResult[], patientAge?: number, patientGender?: 'male' | 'female', isPregnant?: boolean): Promise<LabOrder> {
  await validateUploadResultsPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch current lab order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !currentOrder) {
      throw new NotFoundError('Laboratory order not found');
    }

    // Validate status transition
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.RESULT_READY);

    // Create lab results
    for (const result of results) {
      await createLabResult(result, labOrderId, patientAge, patientGender, isPregnant);
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.RESULT_READY,
        results,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: (currentOrder.version_number || 0) + 1,
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete test', { error, labOrderId });
      throw new DatabaseError('Failed to complete test', { error });
    }

    logger.info('Test completed successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing test', { error, labOrderId });
    throw new DatabaseError('Failed to complete test', { error });
  }
}

/**
 * Mark test as failed
 */
export async function failTest(labOrderId: string, failureReason: string): Promise<LabOrder> {
  await validateUploadResultsPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch current lab order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !currentOrder) {
      throw new NotFoundError('Laboratory order not found');
    }

    // Validate status transition
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.REJECTED);

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.REJECTED,
        internal_notes: `Test failed: ${failureReason}`,
        specimen: {
          ...currentOrder.specimen,
          specimen_status: 'rejected',
          notes: failureReason,
        },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: (currentOrder.version_number || 0) + 1,
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark test as failed', { error, labOrderId });
      throw new DatabaseError('Failed to mark test as failed', { error });
    }

    logger.info('Test marked as failed successfully', { labOrderId, failureReason });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error marking test as failed', { error, labOrderId });
    throw new DatabaseError('Failed to mark test as failed', { error });
  }
}

/**
 * Re-run test
 */
export async function rerunTest(labOrderId: string, reason?: string): Promise<LabOrder> {
  await validateUploadResultsPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch current lab order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !currentOrder) {
      throw new NotFoundError('Laboratory order not found');
    }

    // Validate can re-run (must be in received or in_progress status)
    if (currentOrder.status !== 'received' && currentOrder.status !== 'in_progress') {
      throw new Error('Can only re-run tests in received or in_progress status');
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.IN_PROGRESS,
        internal_notes: reason ? `Test re-run: ${reason}` : currentOrder.internal_notes,
        results: [],
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: (currentOrder.version_number || 0) + 1,
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to re-run test', { error, labOrderId });
      throw new DatabaseError('Failed to re-run test', { error });
    }

    logger.info('Test re-run initiated successfully', { labOrderId, reason });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error re-running test', { error, labOrderId });
    throw new DatabaseError('Failed to re-run test', { error });
  }
}
