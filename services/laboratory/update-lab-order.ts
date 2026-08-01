import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateLabOrderPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { updateLabOrderSchema, validateStatusTransition, validateCanCancelLabOrder } from './laboratory-validation';
import { LabOrder, LabOrderStatus } from './laboratory-types';

/**
 * Update an existing laboratory order
 */
export async function updateLabOrder(labOrderId: string, input: any, newStatus?: LabOrderStatus): Promise<LabOrder> {
  await validateUpdateLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const validatedInput = updateLabOrderSchema.parse(input);
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

    // Prevent updates to completed, archived, or deleted orders
    if (currentOrder.status === 'completed' || currentOrder.status === 'archived') {
      throw new Error('Cannot update a completed or archived laboratory order');
    }

    // Validate status transition if new status is provided
    if (newStatus && newStatus !== currentOrder.status) {
      validateStatusTransition(currentOrder.status, newStatus);
    }

    // Build update object
    const updateData: any = {
      ...validatedInput,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      version_number: (currentOrder.version_number || 0) + 1,
    };

    if (newStatus) {
      updateData.status = newStatus;
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update(updateData)
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update lab order', { error, labOrderId });
      throw new DatabaseError('Failed to update lab order', { error });
    }

    logger.info('Lab order updated successfully', { labOrderId, newStatus });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating lab order', { error, labOrderId });
    throw new DatabaseError('Failed to update lab order', { error });
  }
}

/**
 * Update lab order priority
 */
export async function updateLabOrderPriority(labOrderId: string, priority: 'routine' | 'urgent' | 'emergency' | 'stat'): Promise<LabOrder> {
  await validateUpdateLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        priority,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update lab order priority', { error, labOrderId });
      throw new DatabaseError('Failed to update lab order priority', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory order not found');
    }

    logger.info('Lab order priority updated successfully', { labOrderId, priority });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating lab order priority', { error, labOrderId });
    throw new DatabaseError('Failed to update lab order priority', { error });
  }
}

/**
 * Update lab order clinical notes
 */
export async function updateLabOrderClinicalNotes(labOrderId: string, clinicalNotes: string): Promise<LabOrder> {
  await validateUpdateLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        clinical_notes: clinicalNotes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update lab order clinical notes', { error, labOrderId });
      throw new DatabaseError('Failed to update lab order clinical notes', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory order not found');
    }

    logger.info('Lab order clinical notes updated successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating lab order clinical notes', { error, labOrderId });
    throw new DatabaseError('Failed to update lab order clinical notes', { error });
  }
}

/**
 * Update lab order internal notes
 */
export async function updateLabOrderInternalNotes(labOrderId: string, internalNotes: string): Promise<LabOrder> {
  await validateUpdateLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        internal_notes: internalNotes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update lab order internal notes', { error, labOrderId });
      throw new DatabaseError('Failed to update lab order internal notes', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory order not found');
    }

    logger.info('Lab order internal notes updated successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating lab order internal notes', { error, labOrderId });
    throw new DatabaseError('Failed to update lab order internal notes', { error });
  }
}
