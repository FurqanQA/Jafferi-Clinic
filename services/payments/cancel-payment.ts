import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCancelPaymentPermission } from './payment-permissions';
import { validatePaymentStatusTransition } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';

// ============================================================================
// Cancel Payment
// ============================================================================

/**
 * Cancel payment
 */
export async function cancelPayment(paymentId: string, reason?: string): Promise<Payment> {
  await validateCancelPaymentPermission();

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

    // Validate status transition
    validatePaymentStatusTransition(existingPayment.status, 'cancelled');

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel payment', { error, paymentId });
      throw new DatabaseError('Failed to cancel payment', { error });
    }

    logger.info('Payment cancelled successfully', { paymentId, reason });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling payment', { error, paymentId });
    throw new DatabaseError('Failed to cancel payment', { error });
  }
}

/**
 * Bulk cancel payments
 */
export async function bulkCancelPayments(cancellations: Array<{ paymentId: string; reason?: string }>): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const { paymentId, reason } of cancellations) {
    const payment = await cancelPayment(paymentId, reason);
    payments.push(payment);
  }

  logger.info('Bulk payments cancelled successfully', { count: payments.length });
  return payments;
}
