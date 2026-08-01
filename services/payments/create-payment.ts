import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCreatePaymentPermission } from './payment-permissions';
import { validatePaymentAmount, validatePaymentMethod, validateOverpayment, validatePaymentDate } from './payment-validation';
import { Payment, PaymentStatus, PaymentMethod, Currency } from './payment-types';
import { createReceipt } from './receipts';
import type { CreatePaymentInput } from './payment-types';

// ============================================================================
// Create Payment
// ============================================================================

/**
 * Generate unique payment number
 */
function generatePaymentNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
}

/**
 * Generate unique transaction number
 */
function generateTransactionNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Create payment
 */
export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  await validateCreatePaymentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate input
    validatePaymentAmount(input.amount, input.currency || 'USD');
    validatePaymentMethod(input.method, input.gateway);

    // Validate invoice exists and belongs to clinic
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, patient_id, doctor_id, currency')
      .eq('id', input.invoice_id)
      .eq('clinic_id', clinicId)
      .single();

    if (invoiceError || !invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Validate patient exists and belongs to clinic
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', input.patient_id)
      .eq('clinic_id', clinicId)
      .single();

    if (patientError || !patient) {
      throw new NotFoundError('Patient not found');
    }

    // Validate doctor if provided
    if (input.doctor_id) {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', input.doctor_id)
        .eq('clinic_id', clinicId)
        .single();

      if (doctorError || !doctor) {
        throw new NotFoundError('Doctor not found');
      }
    }

    // Validate overpayment prevention
    validateOverpayment(input.amount, invoice.total_amount, invoice.paid_amount || 0);

    // Validate payment date
    const paymentDate = new Date().toISOString().split('T')[0];
    const paymentTime = new Date().toISOString();
    validatePaymentDate(paymentDate);

    const paymentNumber = generatePaymentNumber();
    const transactionNumber = generateTransactionNumber();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        clinic_id: clinicId,
        invoice_id: input.invoice_id,
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        appointment_id: input.appointment_id,
        payment_number: paymentNumber,
        transaction_number: transactionNumber,
        status: 'completed',
        method: input.method,
        gateway: input.gateway,
        payment_date: paymentDate,
        payment_time: paymentTime,
        amount: input.amount,
        currency: input.currency || invoice.currency,
        exchange_rate: input.exchange_rate,
        notes: input.notes,
        internal_notes: input.internal_notes,
        reference_number: input.reference_number,
        card_last_four: input.card_last_four,
        card_brand: input.card_brand,
        bank_name: input.bank_name,
        cheque_number: input.cheque_number,
        cheque_date: input.cheque_date,
        drawer_id: input.drawer_id,
        installment_id: input.installment_id,
        payment_link_id: input.payment_link_id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        version_number: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create payment', { error, input });
      throw new DatabaseError('Failed to create payment', { error });
    }

    // Update invoice paid amount
    const newPaidAmount = (invoice.paid_amount || 0) + input.amount;
    await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.invoice_id);

    // Create receipt
    await createReceipt(
      data.id,
      input.amount,
      input.currency || invoice.currency,
      input.method
    );

    logger.info('Payment created successfully', { paymentNumber, amount: input.amount });
    return data as Payment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating payment', { error, input });
    throw new DatabaseError('Failed to create payment', { error });
  }
}

/**
 * Create bulk payments
 */
export async function createBulkPayments(inputs: CreatePaymentInput[]): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const input of inputs) {
    const payment = await createPayment(input);
    payments.push(payment);
  }

  logger.info('Bulk payments created successfully', { count: payments.length });
  return payments;
}
