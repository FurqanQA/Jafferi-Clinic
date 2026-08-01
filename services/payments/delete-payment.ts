import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateDeletePaymentPermission } from './payment-permissions';
import { Payment, PaymentStatus } from './payment-types';

// ============================================================================
// Delete Payment
// ============================================================================

/**
 * Soft delete payment
 */
export async function softDeletePayment(paymentId: string): Promise<Payment> {
  await validateDeletePaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch existing payment
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !existingPayment) {
      throw new NotFoundError('Payment not found');
    }

    // Validate status (only archived payments can be deleted)
    if (existingPayment.status !== 'archived') {
      throw new Error(`Cannot delete payment with status: ${existingPayment.status}. Payment must be archived first.`);
    }

    // Update payment status to deleted
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'deleted',
        is_active: false,
        deleted_by: user.id,
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to delete payment', { error, paymentId });
      throw new DatabaseError('Failed to delete payment', { error });
    }

    logger.info('Payment deleted successfully', { paymentId });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting payment', { error, paymentId });
    throw new DatabaseError('Failed to delete payment', { error });
  }
}

/**
 * Permanently delete payment
 */
export async function permanentlyDeletePayment(paymentId: string): Promise<void> {
  await validateDeletePaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch existing payment to verify it's deleted
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !existingPayment) {
      throw new NotFoundError('Payment not found');
    }

    // Validate status (only deleted payments can be permanently deleted)
    if (existingPayment.status !== 'deleted') {
      throw new Error(`Cannot permanently delete payment with status: ${existingPayment.status}. Payment must be soft deleted first.`);
    }

    // Permanently delete the payment
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      logger.error('Failed to permanently delete payment', { error, paymentId });
      throw new DatabaseError('Failed to permanently delete payment', { error });
    }

    logger.info('Payment permanently deleted successfully', { paymentId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error permanently deleting payment', { error, paymentId });
    throw new DatabaseError('Failed to permanently delete payment', { error });
  }
}

/**
 * Bulk soft delete payments
 */
export async function bulkSoftDeletePayments(paymentIds: string[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const paymentId of paymentIds) {
    const payment = await softDeletePayment(paymentId);
    payments.push(payment);
  }

  logger.info('Bulk payments deleted successfully', { count: payments.length });
  return payments;
}
