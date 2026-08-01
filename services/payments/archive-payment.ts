import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateArchivePaymentPermission } from './payment-permissions';
import { validatePaymentStatusTransition } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';

// ============================================================================
// Archive Payment
// ============================================================================

/**
 * Archive payment
 */
export async function archivePayment(paymentId: string): Promise<Payment> {
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

    // Validate status can be archived (completed, cancelled, or refunded payments can be archived)
    if (existingPayment.status !== 'completed' && existingPayment.status !== 'cancelled' && existingPayment.status !== 'refunded') {
      throw new Error(`Cannot archive payment with status: ${existingPayment.status}`);
    }

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'archived',
        archived_by: user.id,
        archived_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingPayment.version_number + 1,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to archive payment', { error, paymentId });
      throw new DatabaseError('Failed to archive payment', { error });
    }

    logger.info('Payment archived successfully', { paymentId });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error archiving payment', { error, paymentId });
    throw new DatabaseError('Failed to archive payment', { error });
  }
}

/**
 * Bulk archive payments
 */
export async function bulkArchivePayments(paymentIds: string[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const paymentId of paymentIds) {
    const payment = await archivePayment(paymentId);
    payments.push(payment);
  }

  logger.info('Bulk payments archived successfully', { count: payments.length });
  return payments;
}

/**
 * Auto-archive completed payments older than specified days (placeholder)
 */
export async function autoArchiveCompletedPayments(daysOld: number = 90): Promise<number> {
  // Placeholder for auto-archiving logic
  logger.info('Auto-archiving completed payments requested', { daysOld });

  // Placeholder: Implement actual auto-archiving logic
  return 0;
}
