import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateRefundPaymentPermission } from './payment-permissions';
import { validateRefundAmount, validateRefundStatus } from './payment-validation';
import { Refund, RefundStatus, Currency } from './payment-types';

// ============================================================================
// Refund Engine
// ============================================================================

/**
 * Generate unique refund number
 */
function generateRefundNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REF-${timestamp}-${random}`;
}

/**
 * Create refund record
 */
export async function createRefund(
  paymentId: string,
  amount: number,
  currency: Currency,
  reason: string
): Promise<Refund> {
  await validateRefundPaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch payment to validate refund amount
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('amount, currency')
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (paymentError || !payment) {
      throw new NotFoundError('Payment not found');
    }

    // Validate refund amount
    const alreadyRefunded = await getTotalRefundedAmount(paymentId);
    validateRefundAmount(amount, payment.amount, alreadyRefunded);

    const refundNumber = generateRefundNumber();

    const { data, error } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        refund_number: refundNumber,
        amount,
        currency,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create refund', { error, paymentId, amount });
      throw new DatabaseError('Failed to create refund', { error });
    }

    logger.info('Refund created successfully', { refundNumber, paymentId, amount });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating refund', { error, paymentId, amount });
    throw new DatabaseError('Failed to create refund', { error });
  }
}

/**
 * Get refund by ID
 */
export async function getRefund(refundId: string): Promise<Refund> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('id', refundId)
      .single();

    if (error) {
      logger.error('Failed to fetch refund', { error, refundId });
      throw new DatabaseError('Failed to fetch refund', { error });
    }

    if (!data) {
      throw new NotFoundError('Refund not found');
    }

    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching refund', { error, refundId });
    throw new DatabaseError('Failed to fetch refund', { error });
  }
}

/**
 * Get refund by number
 */
export async function getRefundByNumber(refundNumber: string): Promise<Refund> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('refund_number', refundNumber)
      .single();

    if (error) {
      logger.error('Failed to fetch refund by number', { error, refundNumber });
      throw new DatabaseError('Failed to fetch refund by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Refund not found');
    }

    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching refund by number', { error, refundNumber });
    throw new DatabaseError('Failed to fetch refund by number', { error });
  }
}

/**
 * Get refunds for payment
 */
export async function getPaymentRefunds(paymentId: string): Promise<Refund[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payment refunds', { error, paymentId });
      throw new DatabaseError('Failed to fetch payment refunds', { error });
    }

    return (data || []) as Refund[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment refunds', { error, paymentId });
    throw new DatabaseError('Failed to fetch payment refunds', { error });
  }
}

/**
 * Get total refunded amount for payment
 */
export async function getTotalRefundedAmount(paymentId: string): Promise<number> {
  const refunds = await getPaymentRefunds(paymentId);
  return refunds
    .filter(refund => refund.status === 'completed')
    .reduce((sum, refund) => sum + refund.amount, 0);
}

/**
 * Approve refund
 */
export async function approveRefund(refundId: string): Promise<Refund> {
  await validateRefundPaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const refund = await getRefund(refundId);

    if (refund.status !== 'pending') {
      throw new Error(`Cannot approve refund with status: ${refund.status}`);
    }

    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'approved',
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to approve refund', { error, refundId });
      throw new DatabaseError('Failed to approve refund', { error });
    }

    logger.info('Refund approved successfully', { refundId });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error approving refund', { error, refundId });
    throw new DatabaseError('Failed to approve refund', { error });
  }
}

/**
 * Reject refund
 */
export async function rejectRefund(refundId: string, reason?: string): Promise<Refund> {
  await validateRefundPaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const refund = await getRefund(refundId);

    if (refund.status !== 'pending') {
      throw new Error(`Cannot reject refund with status: ${refund.status}`);
    }

    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to reject refund', { error, refundId });
      throw new DatabaseError('Failed to reject refund', { error });
    }

    logger.info('Refund rejected successfully', { refundId, reason });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rejecting refund', { error, refundId });
    throw new DatabaseError('Failed to reject refund', { error });
  }
}

/**
 * Process refund
 */
export async function processRefund(refundId: string): Promise<Refund> {
  await validateRefundPaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const refund = await getRefund(refundId);

    if (refund.status !== 'approved') {
      throw new Error(`Cannot process refund with status: ${refund.status}`);
    }

    // Update status to processing
    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to process refund', { error, refundId });
      throw new DatabaseError('Failed to process refund', { error });
    }

    // Placeholder: Process with actual gateway
    // This would call the gateway adapter and update status based on response

    logger.info('Refund processed successfully', { refundId });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error processing refund', { error, refundId });
    throw new DatabaseError('Failed to process refund', { error });
  }
}

/**
 * Complete refund
 */
export async function completeRefund(refundId: string): Promise<Refund> {
  await validateRefundPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const refund = await getRefund(refundId);

    if (refund.status !== 'processing') {
      throw new Error(`Cannot complete refund with status: ${refund.status}`);
    }

    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete refund', { error, refundId });
      throw new DatabaseError('Failed to complete refund', { error });
    }

    logger.info('Refund completed successfully', { refundId });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing refund', { error, refundId });
    throw new DatabaseError('Failed to complete refund', { error });
  }
}

/**
 * Fail refund
 */
export async function failRefund(refundId: string, errorReason?: string): Promise<Refund> {
  await validateRefundPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const refund = await getRefund(refundId);

    if (refund.status !== 'processing') {
      throw new Error(`Cannot fail refund with status: ${refund.status}`);
    }

    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to fail refund', { error, refundId });
      throw new DatabaseError('Failed to fail refund', { error });
    }

    logger.info('Refund failed', { refundId, errorReason });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error failing refund', { error, refundId });
    throw new DatabaseError('Failed to fail refund', { error });
  }
}

/**
 * Cancel refund
 */
export async function cancelRefund(refundId: string): Promise<Refund> {
  await validateRefundPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const refund = await getRefund(refundId);

    if (refund.status !== 'pending') {
      throw new Error(`Cannot cancel refund with status: ${refund.status}`);
    }

    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel refund', { error, refundId });
      throw new DatabaseError('Failed to cancel refund', { error });
    }

    logger.info('Refund cancelled successfully', { refundId });
    return data as Refund;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling refund', { error, refundId });
    throw new DatabaseError('Failed to cancel refund', { error });
  }
}

/**
 * Get refund history for payment
 */
export async function getRefundHistory(paymentId: string): Promise<{
  refunds: Refund[];
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    processing: number;
    completed: number;
    failed: number;
    totalRefunded: number;
  };
}> {
  const refunds = await getPaymentRefunds(paymentId);

  const summary = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    processing: refunds.filter(r => r.status === 'processing').length,
    completed: refunds.filter(r => r.status === 'completed').length,
    failed: refunds.filter(r => r.status === 'failed').length,
    totalRefunded: refunds
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0),
  };

  return {
    refunds,
    summary,
  };
}

/**
 * Validate multiple refunds (for partial refunds)
 */
export async function validateMultipleRefunds(
  paymentId: string,
  refundAmounts: number[]
): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('amount')
    .eq('id', paymentId)
    .eq('clinic_id', clinicId)
    .single();

  if (paymentError || !payment) {
    throw new NotFoundError('Payment not found');
  }

  const totalRefundAmount = refundAmounts.reduce((sum, amount) => sum + amount, 0);
  const alreadyRefunded = await getTotalRefundedAmount(paymentId);

  validateRefundAmount(totalRefundAmount, payment.amount, alreadyRefunded);
}
