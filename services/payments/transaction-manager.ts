import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePaymentStatusTransition } from './payment-validation';
import { Transaction, PaymentStatus, Currency } from './payment-types';

// ============================================================================
// Transaction Manager
// ============================================================================

/**
 * Generate unique transaction number
 */
function generateTransactionNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Create transaction record
 */
export async function createTransaction(
  paymentId: string,
  transactionType: 'authorization' | 'capture' | 'void' | 'refund' | 'chargeback',
  amount: number,
  currency: Currency,
  gatewayReference: string,
  gatewayResponse?: Record<string, any>
): Promise<Transaction> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const transactionNumber = generateTransactionNumber();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        payment_id: paymentId,
        transaction_number: transactionNumber,
        transaction_type: transactionType,
        amount,
        currency,
        gateway_reference: gatewayReference,
        gateway_response: gatewayResponse,
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create transaction', { error, paymentId, transactionType });
      throw new DatabaseError('Failed to create transaction', { error });
    }

    logger.info('Transaction created successfully', { transactionNumber, paymentId, transactionType });
    return data as Transaction;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating transaction', { error, paymentId, transactionType });
    throw new DatabaseError('Failed to create transaction', { error });
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: PaymentStatus,
  processedAt?: string
): Promise<Transaction> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (processedAt) {
      updateData.processed_at = processedAt;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update transaction status', { error, transactionId });
      throw new DatabaseError('Failed to update transaction status', { error });
    }

    if (!data) {
      throw new NotFoundError('Transaction not found');
    }

    logger.info('Transaction status updated successfully', { transactionId, status });
    return data as Transaction;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating transaction status', { error, transactionId });
    throw new DatabaseError('Failed to update transaction status', { error });
  }
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      logger.error('Failed to fetch transaction', { error, transactionId });
      throw new DatabaseError('Failed to fetch transaction', { error });
    }

    if (!data) {
      throw new NotFoundError('Transaction not found');
    }

    return data as Transaction;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching transaction', { error, transactionId });
    throw new DatabaseError('Failed to fetch transaction', { error });
  }
}

/**
 * Get transaction by number
 */
export async function getTransactionByNumber(transactionNumber: string): Promise<Transaction> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_number', transactionNumber)
      .single();

    if (error) {
      logger.error('Failed to fetch transaction by number', { error, transactionNumber });
      throw new DatabaseError('Failed to fetch transaction by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Transaction not found');
    }

    return data as Transaction;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching transaction by number', { error, transactionNumber });
    throw new DatabaseError('Failed to fetch transaction by number', { error });
  }
}

/**
 * Get transactions for payment
 */
export async function getPaymentTransactions(paymentId: string): Promise<Transaction[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payment transactions', { error, paymentId });
      throw new DatabaseError('Failed to fetch payment transactions', { error });
    }

    return (data || []) as Transaction[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment transactions', { error, paymentId });
    throw new DatabaseError('Failed to fetch payment transactions', { error });
  }
}

/**
 * Check for duplicate transaction
 */
export async function checkDuplicateTransaction(
  gatewayReference: string,
  paymentId?: string
): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('transactions')
      .select('id')
      .eq('gateway_reference', gatewayReference);

    if (paymentId) {
      query = query.eq('payment_id', paymentId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      logger.error('Failed to check duplicate transaction', { error, gatewayReference });
      throw new DatabaseError('Failed to check duplicate transaction', { error });
    }

    return (data || []).length > 0;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error checking duplicate transaction', { error, gatewayReference });
    throw new DatabaseError('Failed to check duplicate transaction', { error });
  }
}

/**
 * Get transaction history for payment
 */
export async function getTransactionHistory(paymentId: string): Promise<{
  transactions: Transaction[];
  summary: {
    total: number;
    authorized: number;
    captured: number;
    voided: number;
    refunded: number;
    chargebacks: number;
  };
}> {
  const transactions = await getPaymentTransactions(paymentId);

  const summary = {
    total: transactions.length,
    authorized: transactions.filter(t => t.transaction_type === 'authorization').length,
    captured: transactions.filter(t => t.transaction_type === 'capture').length,
    voided: transactions.filter(t => t.transaction_type === 'void').length,
    refunded: transactions.filter(t => t.transaction_type === 'refund').length,
    chargebacks: transactions.filter(t => t.transaction_type === 'chargeback').length,
  };

  return {
    transactions,
    summary,
  };
}

/**
 * Retry failed transaction (placeholder)
 */
export async function retryTransaction(transactionId: string): Promise<Transaction> {
  // Placeholder for retry logic
  logger.info('Transaction retry requested', { transactionId });

  const transaction = await getTransaction(transactionId);

  if (transaction.status !== 'failed') {
    throw new Error('Only failed transactions can be retried');
  }

  // Placeholder: Implement actual retry logic based on transaction type
  return transaction;
}

/**
 * Rollback transaction (placeholder)
 */
export async function rollbackTransaction(transactionId: string): Promise<Transaction> {
  // Placeholder for rollback logic
  logger.info('Transaction rollback requested', { transactionId });

  const transaction = await getTransaction(transactionId);

  // Placeholder: Implement actual rollback logic based on transaction type
  return transaction;
}

/**
 * Void authorized transaction
 */
export async function voidTransaction(transactionId: string): Promise<Transaction> {
  const user = await getCurrentUser();
  const transaction = await getTransaction(transactionId);

  if (transaction.transaction_type !== 'authorization') {
    throw new Error('Only authorization transactions can be voided');
  }

  if (transaction.status !== 'authorized') {
    throw new Error('Only authorized transactions can be voided');
  }

  // Update transaction status to cancelled
  const updatedTransaction = await updateTransactionStatus(transactionId, 'cancelled');

  logger.info('Transaction voided successfully', { transactionId });
  return updatedTransaction;
}

/**
 * Process transaction with gateway (placeholder)
 */
export async function processTransaction(
  paymentId: string,
  transactionType: 'authorization' | 'capture' | 'void' | 'refund' | 'chargeback',
  amount: number,
  currency: Currency,
  gatewayReference: string,
  gatewayResponse?: Record<string, any>
): Promise<Transaction> {
  // Create transaction record
  const transaction = await createTransaction(
    paymentId,
    transactionType,
    amount,
    currency,
    gatewayReference,
    gatewayResponse
  );

  // Placeholder: Process with actual gateway
  // This would call the gateway adapter and update status based on response

  return transaction;
}
