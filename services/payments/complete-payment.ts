import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateAuthorizePaymentPermission } from './payment-permissions';
import { validatePaymentStatusTransition } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';
import { createReceipt } from './receipts';

// ============================================================================
// Complete Payment
// ============================================================================

/**
 * Complete payment
 */
export async function completePayment(paymentId: string): Promise<Payment> {
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
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete payment', { error, paymentId });
      throw new DatabaseError('Failed to complete payment', { error });
    }

    // Update invoice paid amount
    if (existingPayment.invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('paid_amount')
        .eq('id', existingPayment.invoice_id)
        .single();

      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) + existingPayment.amount;
        await supabase
          .from('invoices')
          .update({
            paid_amount: newPaidAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPayment.invoice_id);
      }
    }

    // Create receipt
    await createReceipt(
      data.id,
      existingPayment.amount,
      existingPayment.currency,
      existingPayment.method
    );

    logger.info('Payment completed successfully', { paymentId });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing payment', { error, paymentId });
    throw new DatabaseError('Failed to complete payment', { error });
  }
}

/**
 * Bulk complete payments
 */
export async function bulkCompletePayments(paymentIds: string[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const paymentId of paymentIds) {
    const payment = await completePayment(paymentId);
    payments.push(payment);
  }

  logger.info('Bulk payments completed successfully', { count: payments.length });
  return payments;
}
