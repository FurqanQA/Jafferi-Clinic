import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadPaymentPermission } from './payment-permissions';
import { Payment } from './payment-types';

// ============================================================================
// Get Payment
// ============================================================================

/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<Payment> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch payment', { error, paymentId });
      throw new DatabaseError('Failed to fetch payment', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment not found');
    }

    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment', { error, paymentId });
    throw new DatabaseError('Failed to fetch payment', { error });
  }
}

/**
 * Get payment by number
 */
export async function getPaymentByNumber(paymentNumber: string): Promise<Payment> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_number', paymentNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch payment by number', { error, paymentNumber });
      throw new DatabaseError('Failed to fetch payment by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment not found');
    }

    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment by number', { error, paymentNumber });
    throw new DatabaseError('Failed to fetch payment by number', { error });
  }
}

/**
 * Get payment by transaction number
 */
export async function getPaymentByTransactionNumber(transactionNumber: string): Promise<Payment> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_number', transactionNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch payment by transaction number', { error, transactionNumber });
      throw new DatabaseError('Failed to fetch payment by transaction number', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment not found');
    }

    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment by transaction number', { error, transactionNumber });
    throw new DatabaseError('Failed to fetch payment by transaction number', { error });
  }
}

/**
 * Get payment with related data
 */
export async function getPaymentWithRelations(paymentId: string): Promise<{
  payment: Payment;
  invoice?: any;
  patient?: any;
  doctor?: any;
}> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices!inner(invoice_number, total_amount, paid_amount, currency),
        patient:patients!inner(first_name, last_name, phone, email),
        doctor:doctors(first_name, last_name)
      `)
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch payment with relations', { error, paymentId });
      throw new DatabaseError('Failed to fetch payment with relations', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment not found');
    }

    return {
      payment: data as Payment,
      invoice: data.invoice,
      patient: data.patient,
      doctor: data.doctor,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment with relations', { error, paymentId });
    throw new DatabaseError('Failed to fetch payment with relations', { error });
  }
}
