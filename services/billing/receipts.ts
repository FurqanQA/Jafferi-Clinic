import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReceiptPermission } from './billing-permissions';
import { Receipt } from './billing-types';

/**
 * Generate receipt number
 */
export async function generateReceiptNumber(clinicId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

  const { data, error } = await supabase
    .from('receipts')
    .select('receipt_number')
    .eq('clinic_id', clinicId)
    .like('receipt_number', `RCPT-${datePrefix}%`)
    .order('receipt_number', { ascending: false })
    .limit(1);

  if (error) {
    logger.error('Failed to generate receipt number', { error });
    throw new DatabaseError('Failed to generate receipt number', { error });
  }

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].receipt_number;
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }

  return `RCPT-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Create receipt
 */
export async function createReceipt(
  invoiceId: string,
  amount: number,
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online' | 'insurance',
  paymentReference?: string,
  notes?: string
): Promise<Receipt> {
  await validateReceiptPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const receiptNumber = await generateReceiptNumber(clinicId);

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        clinic_id: clinicId,
        invoice_id: invoiceId,
        receipt_number: receiptNumber,
        receipt_date: new Date().toISOString(),
        amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        notes,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create receipt', { error });
      throw new DatabaseError('Failed to create receipt', { error });
    }

    logger.info('Receipt created successfully', { receiptNumber, invoiceId });
    return data as Receipt;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating receipt', { error });
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
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('clinic_id', clinicId)
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
      .from('receipts')
      .select('*')
      .eq('receipt_number', receiptNumber)
      .eq('clinic_id', clinicId)
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
 * Get receipts by invoice
 */
export async function getReceiptsByInvoice(invoiceId: string): Promise<Receipt[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId)
      .order('receipt_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch receipts by invoice', { error, invoiceId });
      throw new DatabaseError('Failed to fetch receipts by invoice', { error });
    }

    return (data || []) as Receipt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching receipts by invoice', { error, invoiceId });
    throw new DatabaseError('Failed to fetch receipts by invoice', { error });
  }
}

/**
 * Get receipt summary for invoice
 */
export async function getReceiptSummary(invoiceId: string): Promise<{
  totalReceipts: number;
  totalAmount: number;
  receipts: Receipt[];
}> {
  const receipts = await getReceiptsByInvoice(invoiceId);
  const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return {
    totalReceipts: receipts.length,
    totalAmount,
    receipts,
  };
}

/**
 * Get all receipts for clinic
 */
export async function getReceipts(): Promise<Receipt[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('receipt_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch receipts', { error });
      throw new DatabaseError('Failed to fetch receipts', { error });
    }

    return (data || []) as Receipt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching receipts', { error });
    throw new DatabaseError('Failed to fetch receipts', { error });
  }
}

/**
 * Get receipts by payment method
 */
export async function getReceiptsByPaymentMethod(
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online' | 'insurance'
): Promise<Receipt[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('payment_method', paymentMethod)
      .order('receipt_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch receipts by payment method', { error, paymentMethod });
      throw new DatabaseError('Failed to fetch receipts by payment method', { error });
    }

    return (data || []) as Receipt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching receipts by payment method', { error, paymentMethod });
    throw new DatabaseError('Failed to fetch receipts by payment method', { error });
  }
}

/**
 * Get receipt history for a date range
 */
export async function getReceiptHistory(dateFrom: string, dateTo: string): Promise<Receipt[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('receipt_date', dateFrom)
      .lte('receipt_date', dateTo)
      .order('receipt_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch receipt history', { error });
      throw new DatabaseError('Failed to fetch receipt history', { error });
    }

    return (data || []) as Receipt[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching receipt history', { error });
    throw new DatabaseError('Failed to fetch receipt history', { error });
  }
}
