import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReviewResultsPermission, validateApproveResultsPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { validateStatusTransition } from './laboratory-validation';
import { LabOrder, LAB_ORDER_STATUS } from './laboratory-types';
import { createResultReview, approveResultReview } from './result-review';

/**
 * Review laboratory results
 */
export async function reviewResults(labOrderId: string, reviewNotes?: string): Promise<LabOrder> {
  await validateReviewResultsPermission();
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
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.REVIEWED);

    // Create result review
    await createResultReview(labOrderId, reviewNotes);

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.REVIEWED,
        internal_notes: reviewNotes ? `Review notes: ${reviewNotes}` : currentOrder.internal_notes,
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
      logger.error('Failed to review results', { error, labOrderId });
      throw new DatabaseError('Failed to review results', { error });
    }

    logger.info('Results reviewed successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error reviewing results', { error, labOrderId });
    throw new DatabaseError('Failed to review results', { error });
  }
}

/**
 * Approve laboratory results
 */
export async function approveResults(labOrderId: string, electronicSignature?: string): Promise<LabOrder> {
  await validateApproveResultsPermission();
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
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.APPROVED);

    // Get result review
    const { data: review, error: reviewError } = await supabase
      .from('result_reviews')
      .select('id')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (review && !reviewError) {
      await approveResultReview(review.id, electronicSignature);
    }

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.APPROVED,
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
      logger.error('Failed to approve results', { error, labOrderId });
      throw new DatabaseError('Failed to approve results', { error });
    }

    logger.info('Results approved successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error approving results', { error, labOrderId });
    throw new DatabaseError('Failed to approve results', { error });
  }
}

/**
 * Reject laboratory results
 */
export async function rejectResults(labOrderId: string, rejectionReason: string): Promise<LabOrder> {
  await validateReviewResultsPermission();
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
        internal_notes: `Results rejected: ${rejectionReason}`,
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
      logger.error('Failed to reject results', { error, labOrderId });
      throw new DatabaseError('Failed to reject results', { error });
    }

    logger.info('Results rejected successfully', { labOrderId, rejectionReason });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rejecting results', { error, labOrderId });
    throw new DatabaseError('Failed to reject results', { error });
  }
}
