import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCollectSamplePermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { validateCanCollectSample, validateStatusTransition } from './laboratory-validation';
import { LabOrder, LAB_ORDER_STATUS } from './laboratory-types';
import { recordSpecimenCollection, recordSpecimenReceipt } from './specimen';

/**
 * Collect sample for laboratory order
 */
export async function collectSample(labOrderId: string, collectionTime: string, barcode?: string, notes?: string): Promise<LabOrder> {
  await validateCollectSamplePermission();
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

    // Validate can collect sample for current status
    validateCanCollectSample(currentOrder.status);

    // Validate status transition
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.SAMPLE_COLLECTED);

    // Update specimen record
    if (currentOrder.specimen) {
      await recordSpecimenCollection(labOrderId, collectionTime);
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.SAMPLE_COLLECTED,
        collection_date: collectionTime,
        specimen: {
          ...currentOrder.specimen,
          collection_time: collectionTime,
          collected_by: user.id,
          specimen_status: 'collected',
          barcode: barcode || currentOrder.specimen?.barcode,
          notes: notes || currentOrder.specimen?.notes,
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
      logger.error('Failed to collect sample', { error, labOrderId });
      throw new DatabaseError('Failed to collect sample', { error });
    }

    logger.info('Sample collected successfully', { labOrderId, collectionTime });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error collecting sample', { error, labOrderId });
    throw new DatabaseError('Failed to collect sample', { error });
  }
}

/**
 * Receive sample at laboratory
 */
export async function receiveSample(labOrderId: string): Promise<LabOrder> {
  await validateCollectSamplePermission();
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
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.RECEIVED);

    // Update specimen status
    if (currentOrder.specimen) {
      await recordSpecimenReceipt(labOrderId);
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.RECEIVED,
        specimen: {
          ...currentOrder.specimen,
          specimen_status: 'received',
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
      logger.error('Failed to receive sample', { error, labOrderId });
      throw new DatabaseError('Failed to receive sample', { error });
    }

    logger.info('Sample received successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error receiving sample', { error, labOrderId });
    throw new DatabaseError('Failed to receive sample', { error });
  }
}

/**
 * Reject sample
 */
export async function rejectSample(labOrderId: string, rejectionReason: string): Promise<LabOrder> {
  await validateCollectSamplePermission();
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
        internal_notes: `Sample rejected: ${rejectionReason}`,
        specimen: {
          ...currentOrder.specimen,
          specimen_status: 'rejected',
          notes: rejectionReason,
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
      logger.error('Failed to reject sample', { error, labOrderId });
      throw new DatabaseError('Failed to reject sample', { error });
    }

    logger.info('Sample rejected successfully', { labOrderId, rejectionReason });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rejecting sample', { error, labOrderId });
    throw new DatabaseError('Failed to reject sample', { error });
  }
}
