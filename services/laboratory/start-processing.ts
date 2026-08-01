import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateStartProcessingPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { validateCanStartProcessing, validateStatusTransition } from './laboratory-validation';
import { LabOrder, LAB_ORDER_STATUS } from './laboratory-types';

/**
 * Start processing laboratory order
 */
export async function startProcessing(labOrderId: string): Promise<LabOrder> {
  await validateStartProcessingPermission();
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

    // Validate can start processing for current status
    validateCanStartProcessing(currentOrder.status);

    // Validate status transition
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.IN_PROGRESS);

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.IN_PROGRESS,
        specimen: {
          ...currentOrder.specimen,
          specimen_status: 'processed',
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
      logger.error('Failed to start processing', { error, labOrderId });
      throw new DatabaseError('Failed to start processing', { error });
    }

    logger.info('Processing started successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error starting processing', { error, labOrderId });
    throw new DatabaseError('Failed to start processing', { error });
  }
}

/**
 * Pause processing of laboratory order
 */
export async function pauseProcessing(labOrderId: string, reason?: string): Promise<LabOrder> {
  await validateStartProcessingPermission();
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

    if (currentOrder.status !== LAB_ORDER_STATUS.IN_PROGRESS) {
      throw new Error('Can only pause processing for orders in progress');
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        internal_notes: reason ? `Processing paused: ${reason}` : currentOrder.internal_notes,
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
      logger.error('Failed to pause processing', { error, labOrderId });
      throw new DatabaseError('Failed to pause processing', { error });
    }

    logger.info('Processing paused successfully', { labOrderId, reason });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error pausing processing', { error, labOrderId });
    throw new DatabaseError('Failed to pause processing', { error });
  }
}

/**
 * Resume processing of laboratory order
 */
export async function resumeProcessing(labOrderId: string): Promise<LabOrder> {
  await validateStartProcessingPermission();
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

    if (currentOrder.status !== LAB_ORDER_STATUS.IN_PROGRESS) {
      throw new Error('Can only resume processing for orders in progress');
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        internal_notes: currentOrder.internal_notes?.replace('Processing paused:', 'Processing resumed:'),
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
      logger.error('Failed to resume processing', { error, labOrderId });
      throw new DatabaseError('Failed to resume processing', { error });
    }

    logger.info('Processing resumed successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resuming processing', { error, labOrderId });
    throw new DatabaseError('Failed to resume processing', { error });
  }
}
