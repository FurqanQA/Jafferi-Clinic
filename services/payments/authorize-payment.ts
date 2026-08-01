import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateAuthorizePaymentPermission } from './payment-permissions';
import { validatePaymentStatusTransition } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';

// ============================================================================
// Authorize Payment
// ============================================================================

/**
 * Authorize payment
 */
export async function authorizePayment(paymentId: string): Promise<Payment> {
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
    validatePaymentStatusTransition(existingPayment.status, 'authorized');

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'authorized',
        authorized_by: user.id,
        authorized_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to authorize payment', { error, paymentId });
      throw new DatabaseError('Failed to authorize payment', { error });
    }

    logger.info('Payment authorized successfully', { paymentId });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error authorizing payment', { error, paymentId });
    throw new DatabaseError('Failed to authorize payment', { error });
  }
}

/**
 * Bulk authorize payments
 */
export async function bulkAuthorizePayments(paymentIds: string[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const paymentId of paymentIds) {
    const payment = await authorizePayment(paymentId);
    payments.push(payment);
  }

  logger.info('Bulk payments authorized successfully', { count: payments.length });
  return payments;
}
