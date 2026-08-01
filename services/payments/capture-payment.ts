import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateAuthorizePaymentPermission } from './payment-permissions';
import { validatePaymentStatusTransition } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';

// ============================================================================
// Capture Payment
// ============================================================================

/**
 * Capture payment
 */
export async function capturePayment(paymentId: string): Promise<Payment> {
  await validateAuthorizePaymentPermission();

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
    validatePaymentStatusTransition(existingPayment.status, 'completed');

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        captured_by: user.id,
        captured_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to capture payment', { error, paymentId });
      throw new DatabaseError('Failed to capture payment', { error });
    }

    logger.info('Payment captured successfully', { paymentId });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error capturing payment', { error, paymentId });
    throw new DatabaseError('Failed to capture payment', { error });
  }
}

/**
 * Bulk capture payments
 */
export async function bulkCapturePayments(paymentIds: string[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const paymentId of paymentIds) {
    const payment = await capturePayment(paymentId);
    payments.push(payment);
  }

  logger.info('Bulk payments captured successfully', { count: payments.length });
  return payments;
}
