import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateRefundPaymentPermission } from './payment-permissions';
import { validatePaymentStatusTransition } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';
import { createRefund, approveRefund, processRefund, completeRefund } from './refund-engine';

// ============================================================================
// Refund Payment
// ============================================================================

/**
 * Refund payment
 */
export async function refundPayment(paymentId: string, amount: number, reason: string): Promise<Payment> {
  await validateRefundPaymentPermission();

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
    validatePaymentStatusTransition(existingPayment.status, 'refunded');

    // Create refund record
    await createRefund(paymentId, amount, existingPayment.currency, reason);

    // Approve refund (auto-approve for now)
    const refund = await approveRefund(paymentId);

    // Process refund
    await processRefund(refund.id);

    // Complete refund
    await completeRefund(refund.id);

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_by: user.id,
        refunded_at: new Date().toISOString(),
        refund_reason: reason,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to refund payment', { error, paymentId });
      throw new DatabaseError('Failed to refund payment', { error });
    }

    // Update invoice paid amount
    if (existingPayment.invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('paid_amount')
        .eq('id', existingPayment.invoice_id)
        .single();

      if (invoice) {
        const newPaidAmount = Math.max(0, (invoice.paid_amount || 0) - amount);
        await supabase
          .from('invoices')
          .update({
            paid_amount: newPaidAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPayment.invoice_id);
      }
    }

    logger.info('Payment refunded successfully', { paymentId, amount });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error refunding payment', { error, paymentId });
    throw new DatabaseError('Failed to refund payment', { error });
  }
}

/**
 * Bulk refund payments
 */
export async function bulkRefundPayments(refunds: Array<{ paymentId: string; amount: number; reason: string }>): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const { paymentId, amount, reason } of refunds) {
    const payment = await refundPayment(paymentId, amount, reason);
    payments.push(payment);
  }

  logger.info('Bulk payments refunded successfully', { count: payments.length });
  return payments;
}
