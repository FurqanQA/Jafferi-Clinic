import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateArchivePaymentPermission } from './payment-permissions';
import { Payment, PaymentStatus } from './payment-types';

// ============================================================================
// Restore Payment
// ============================================================================

/**
 * Restore archived payment
 */
export async function restorePayment(paymentId: string): Promise<Payment> {
  await validateArchivePaymentPermission();

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

    // Validate status is archived
    if (existingPayment.status !== 'archived') {
      throw new Error(`Cannot restore payment with status: ${existingPayment.status}`);
    }

    // Determine the appropriate status to restore to
    let restoredStatus: PaymentStatus = 'pending';
    if (existingPayment.refunded_at) {
      restoredStatus = 'refunded';
    } else if (existingPayment.cancelled_at) {
      restoredStatus = 'cancelled';
    } else if (existingPayment.completed_at) {
      restoredStatus = 'completed';
    }

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: restoredStatus,
        restored_by: user.id,
        restored_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to restore payment', { error, paymentId });
      throw new DatabaseError('Failed to restore payment', { error });
    }

    logger.info('Payment restored successfully', { paymentId, restoredStatus });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring payment', { error, paymentId });
    throw new DatabaseError('Failed to restore payment', { error });
  }
}

/**
 * Bulk restore payments
 */
export async function bulkRestorePayments(paymentIds: string[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const paymentId of paymentIds) {
    const payment = await restorePayment(paymentId);
    payments.push(payment);
  }

  logger.info('Bulk payments restored successfully', { count: payments.length });
  return payments;
}
