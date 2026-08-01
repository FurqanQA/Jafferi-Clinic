import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrintReceiptPermission } from './payment-permissions';
import { Receipt, PaymentMethod, Currency } from './payment-types';

// ============================================================================
// Receipt Engine
// ============================================================================

/**
 * Generate unique receipt number
 */
function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

/**
 * Create receipt for payment
 */
export async function createReceipt(
  paymentId: string,
  amount: number,
  currency: Currency,
  paymentMethod: PaymentMethod,
  notes?: string
): Promise<Receipt> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const receiptNumber = generateReceiptNumber();
    const receiptDate = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('payment_receipts')
      .insert({
        payment_id: paymentId,
        receipt_number: receiptNumber,
        receipt_date: receiptDate,
        amount,
        currency,
        payment_method: paymentMethod,
        notes,
        created_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create receipt', { error, paymentId, amount });
      throw new DatabaseError('Failed to create receipt', { error });
    }

    logger.info('Receipt created successfully', { receiptNumber, paymentId, amount });
    return data as Receipt;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating receipt', { error, paymentId, amount });
    throw new DatabaseError('Failed to create receipt', { error });
  }
}

/**
 * Get receipt by ID
 */
export async function getReceipt(receiptId: string): Promise<Receipt> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (error) {
      logger.error('Failed to fetch receipt', { error, receiptId });
      throw new DatabaseError('Failed to fetch receipt', { error });
    }

    if (!data) {
      throw new NotFoundError('Receipt not found');
    }

    return data as Receipt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching receipt', { error, receiptId });
    throw new DatabaseError('Failed to fetch receipt', { error });
  }
}

/**
 * Get receipt by number
 */
export async function getReceiptByNumber(receiptNumber: string): Promise<Receipt> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('receipt_number', receiptNumber)
      .single();

    if (error) {
      logger.error('Failed to fetch receipt by number', { error, receiptNumber });
      throw new DatabaseError('Failed to fetch receipt by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Receipt not found');
    }

    return data as Receipt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching receipt by number', { error, receiptNumber });
    throw new DatabaseError('Failed to fetch receipt by number', { error });
  }
}

/**
 * Get receipts for payment
 */
export async function getPaymentReceipts(paymentId: string): Promise<Receipt[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payment receipts', { error, paymentId });
      throw new DatabaseError('Failed to fetch payment receipts', { error });
    }

    return (data || []) as Receipt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment receipts', { error, paymentId });
    throw new DatabaseError('Failed to fetch payment receipts', { error });
  }
}

/**
 * Get receipt summary for invoice
 */
export async function getInvoiceReceiptSummary(invoiceId: string): Promise<{
  totalReceipts: number;
  totalAmount: number;
  receipts: Receipt[];
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get all payments for invoice
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId);

    if (paymentsError) {
      throw new DatabaseError('Failed to fetch payments for invoice', { error: paymentsError });
    }

    const paymentIds = (payments || []).map(p => p.id);

    if (paymentIds.length === 0) {
      return {
        totalReceipts: 0,
        totalAmount: 0,
        receipts: [],
      };
    }

    // Get all receipts for these payments
    const { data: receipts, error: receiptsError } = await supabase
      .from('payment_receipts')
      .select('*')
      .in('payment_id', paymentIds)
      .order('created_at', { ascending: false });

    if (receiptsError) {
      throw new DatabaseError('Failed to fetch receipts for invoice', { error: receiptsError });
    }

    const totalAmount = (receipts || []).reduce((sum, r) => sum + r.amount, 0);

    return {
      totalReceipts: (receipts || []).length,
      totalAmount,
      receipts: (receipts || []) as Receipt[],
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice receipt summary', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice receipt summary', { error });
  }
}

/**
 * Get receipt history for patient
 */
export async function getPatientReceiptHistory(patientId: string): Promise<Receipt[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get all payments for patient
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId);

    if (paymentsError) {
      throw new DatabaseError('Failed to fetch payments for patient', { error: paymentsError });
    }

    const paymentIds = (payments || []).map(p => p.id);

    if (paymentIds.length === 0) {
      return [];
    }

    // Get all receipts for these payments
    const { data: receipts, error: receiptsError } = await supabase
      .from('payment_receipts')
      .select('*')
      .in('payment_id', paymentIds)
      .order('created_at', { ascending: false });

    if (receiptsError) {
      throw new DatabaseError('Failed to fetch receipts for patient', { error: receiptsError });
    }

    return (receipts || []) as Receipt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching patient receipt history', { error, patientId });
    throw new DatabaseError('Failed to fetch patient receipt history', { error });
  }
}

/**
 * Email receipt (placeholder)
 */
export async function emailReceipt(receiptId: string, recipientEmail: string): Promise<void> {
  await validatePrintReceiptPermission();

  // Placeholder for email sending logic
  logger.info('Email receipt requested', { receiptId, recipientEmail });
}

/**
 * Send receipt via WhatsApp (placeholder)
 */
export async function sendWhatsAppReceipt(receiptId: string, phoneNumber: string): Promise<void> {
  await validatePrintReceiptPermission();

  // Placeholder for WhatsApp sending logic
  logger.info('WhatsApp receipt requested', { receiptId, phoneNumber });
}

/**
 * Send receipt via SMS (placeholder)
 */
export async function sendSMSReceipt(receiptId: string, phoneNumber: string): Promise<void> {
  await validatePrintReceiptPermission();

  // Placeholder for SMS sending logic
  logger.info('SMS receipt requested', { receiptId, phoneNumber });
}

/**
 * Regenerate receipt
 */
export async function regenerateReceipt(paymentId: string): Promise<Receipt> {
  await validatePrintReceiptPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('amount, currency, method')
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (paymentError || !payment) {
      throw new NotFoundError('Payment not found');
    }

    // Create new receipt
    const receipt = await createReceipt(
      paymentId,
      payment.amount,
      payment.currency,
      payment.method
    );

    logger.info('Receipt regenerated successfully', { receiptId: receipt.id, paymentId });
    return receipt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error regenerating receipt', { error, paymentId });
    throw new DatabaseError('Failed to regenerate receipt', { error });
  }
}
