import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdatePaymentPermission } from './payment-permissions';
import { validateNotes, validateReferenceNumber } from './payment-validation';
import { Payment, PaymentStatus } from './payment-types';
import type { UpdatePaymentInput } from './payment-types';

// ============================================================================
// Update Payment
// ============================================================================

/**
 * Update payment
 */
export async function updatePayment(paymentId: string, input: UpdatePaymentInput): Promise<Payment> {
  await validateUpdatePaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate input
    validateNotes(input.notes);
    validateNotes(input.internal_notes);
    validateReferenceNumber(input.reference_number);

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

    // Check if payment can be updated
    if (existingPayment.status === 'completed' || existingPayment.status === 'refunded' || existingPayment.status === 'cancelled') {
      throw new Error(`Cannot update payment with status: ${existingPayment.status}`);
    }

    // Build update data
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      version_number: existingPayment.version_number + 1,
    };

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    if (input.internal_notes !== undefined) {
      updateData.internal_notes = input.internal_notes;
    }

    if (input.reference_number !== undefined) {
      updateData.reference_number = input.reference_number;
    }

    if (input.gateway_reference !== undefined) {
      updateData.gateway_reference = input.gateway_reference;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update payment', { error, paymentId });
      throw new DatabaseError('Failed to update payment', { error });
    }

    logger.info('Payment updated successfully', { paymentId });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating payment', { error, paymentId });
    throw new DatabaseError('Failed to update payment', { error });
  }
}

/**
 * Bulk update payments
 */
export async function bulkUpdatePayments(updates: Array<{ paymentId: string; input: UpdatePaymentInput }>): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const { paymentId, input } of updates) {
    const payment = await updatePayment(paymentId, input);
    payments.push(payment);
  }

  logger.info('Bulk payments updated successfully', { count: payments.length });
  return payments;
}
