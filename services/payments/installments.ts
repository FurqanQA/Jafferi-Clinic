import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateInstallmentPermission } from './payment-permissions';
import { validateInstallmentAmount, validateInstallmentTotals, validateInstallmentStatus } from './payment-validation';
import { Installment, InstallmentStatus, Currency } from './payment-types';

// ============================================================================
// Installment Engine
// ============================================================================

/**
 * Generate unique installment number
 */
function generateInstallmentNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INS-${timestamp}-${random}`;
}

/**
 * Create installment plan
 */
export async function createInstallmentPlan(
  invoiceId: string,
  patientId: string,
  totalAmount: number,
  currency: Currency,
  installmentAmounts: number[],
  dueDates: string[],
  notes?: string
): Promise<Installment[]> {
  await validateInstallmentPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateInstallmentTotals(installmentAmounts.map(amount => ({ amount })), totalAmount);

    if (installmentAmounts.length !== dueDates.length) {
      throw new Error('Installment amounts and due dates must have the same length');
    }

    const installments: Installment[] = [];

    for (let i = 0; i < installmentAmounts.length; i++) {
      validateInstallmentAmount(installmentAmounts[i], totalAmount);

      const installmentNumber = generateInstallmentNumber();
      const paidAmount = 0;
      const remainingBalance = installmentAmounts[i];

      const { data, error } = await supabase
        .from('installments')
        .insert({
          clinic_id: clinicId,
          invoice_id: invoiceId,
          patient_id: patientId,
          installment_number: installmentNumber,
          total_amount: installmentAmounts[i],
          currency,
          paid_amount: paidAmount,
          remaining_balance: remainingBalance,
          due_date: dueDates[i],
          status: 'pending',
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create installment', { error, invoiceId, i });
        throw new DatabaseError('Failed to create installment', { error });
      }

      installments.push(data as Installment);
    }

    logger.info('Installment plan created successfully', { invoiceId, totalInstallments: installments.length });
    return installments;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating installment plan', { error, invoiceId });
    throw new DatabaseError('Failed to create installment plan', { error });
  }
}

/**
 * Get installment by ID
 */
export async function getInstallment(installmentId: string): Promise<Installment> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('id', installmentId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch installment', { error, installmentId });
      throw new DatabaseError('Failed to fetch installment', { error });
    }

    if (!data) {
      throw new NotFoundError('Installment not found');
    }

    return data as Installment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching installment', { error, installmentId });
    throw new DatabaseError('Failed to fetch installment', { error });
  }
}

/**
 * Get installment by number
 */
export async function getInstallmentByNumber(installmentNumber: string): Promise<Installment> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('installment_number', installmentNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch installment by number', { error, installmentNumber });
      throw new DatabaseError('Failed to fetch installment by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Installment not found');
    }

    return data as Installment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching installment by number', { error, installmentNumber });
    throw new DatabaseError('Failed to fetch installment by number', { error });
  }
}

/**
 * Get installments for invoice
 */
export async function getInvoiceInstallments(invoiceId: string): Promise<Installment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId)
      .order('due_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch invoice installments', { error, invoiceId });
      throw new DatabaseError('Failed to fetch invoice installments', { error });
    }

    return (data || []) as Installment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice installments', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice installments', { error });
  }
}

/**
 * Get installments for patient
 */
export async function getPatientInstallments(patientId: string, status?: InstallmentStatus): Promise<Installment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('installments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .order('due_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch patient installments', { error, patientId });
      throw new DatabaseError('Failed to fetch patient installments', { error });
    }

    return (data || []) as Installment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching patient installments', { error, patientId });
    throw new DatabaseError('Failed to fetch patient installments', { error });
  }
}

/**
 * Update installment payment
 */
export async function updateInstallmentPayment(
  installmentId: string,
  paymentAmount: number
): Promise<Installment> {
  await validateInstallmentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const installment = await getInstallment(installmentId);

    if (installment.status === 'paid' || installment.status === 'cancelled') {
      throw new Error(`Cannot update payment for installment with status: ${installment.status}`);
    }

    const newPaidAmount = installment.paid_amount + paymentAmount;
    const newRemainingBalance = installment.remaining_balance - paymentAmount;

    if (newRemainingBalance < 0) {
      throw new Error('Payment amount exceeds remaining balance');
    }

    const newStatus: InstallmentStatus = newRemainingBalance === 0 ? 'paid' : 'pending';

    const { data, error } = await supabase
      .from('installments')
      .update({
        paid_amount: newPaidAmount,
        remaining_balance: newRemainingBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update installment payment', { error, installmentId });
      throw new DatabaseError('Failed to update installment payment', { error });
    }

    logger.info('Installment payment updated successfully', { installmentId, paymentAmount });
    return data as Installment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating installment payment', { error, installmentId });
    throw new DatabaseError('Failed to update installment payment', { error });
  }
}

/**
 * Cancel installment
 */
export async function cancelInstallment(installmentId: string): Promise<Installment> {
  await validateInstallmentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const installment = await getInstallment(installmentId);

    if (installment.status === 'paid') {
      throw new Error('Cannot cancel paid installment');
    }

    const { data, error } = await supabase
      .from('installments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel installment', { error, installmentId });
      throw new DatabaseError('Failed to cancel installment', { error });
    }

    logger.info('Installment cancelled successfully', { installmentId });
    return data as Installment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling installment', { error, installmentId });
    throw new DatabaseError('Failed to cancel installment', { error });
  }
}

/**
 * Get overdue installments
 */
export async function getOverdueInstallments(): Promise<Installment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('clinic_id', clinicId)
      .lt('due_date', today)
      .in('status', ['pending', 'due'])
      .order('due_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch overdue installments', { error });
      throw new DatabaseError('Failed to fetch overdue installments', { error });
    }

    return (data || []) as Installment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching overdue installments', { error });
    throw new DatabaseError('Failed to fetch overdue installments', { error });
  }
}

/**
 * Update installment status to overdue
 */
export async function updateOverdueInstallments(): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('installments')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString(),
      })
      .eq('clinic_id', clinicId)
      .lt('due_date', today)
      .eq('status', 'pending')
      .select();

    if (error) {
      logger.error('Failed to update overdue installments', { error });
      throw new DatabaseError('Failed to update overdue installments', { error });
    }

    const updatedCount = (data || []).length;
    logger.info('Overdue installments updated', { count: updatedCount });
    return updatedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating overdue installments', { error });
    throw new DatabaseError('Failed to update overdue installments', { error });
  }
}

/**
 * Add late fee to installment (placeholder)
 */
export async function addLateFee(installmentId: string, lateFee: number): Promise<Installment> {
  await validateInstallmentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const installment = await getInstallment(installmentId);

    const newTotalAmount = installment.total_amount + lateFee;
    const newRemainingBalance = installment.remaining_balance + lateFee;

    const { data, error } = await supabase
      .from('installments')
      .update({
        total_amount: newTotalAmount,
        remaining_balance: newRemainingBalance,
        late_fee: lateFee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to add late fee', { error, installmentId });
      throw new DatabaseError('Failed to add late fee', { error });
    }

    logger.info('Late fee added successfully', { installmentId, lateFee });
    return data as Installment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding late fee', { error, installmentId });
    throw new DatabaseError('Failed to add late fee', { error });
  }
}

/**
 * Get installment summary for invoice
 */
export async function getInstallmentSummary(invoiceId: string): Promise<{
  totalInstallments: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  pending: number;
  due: number;
  overdue: number;
  paid: number;
  cancelled: number;
}> {
  const installments = await getInvoiceInstallments(invoiceId);

  const totalInstallments = installments.length;
  const totalAmount = installments.reduce((sum, i) => sum + i.total_amount, 0);
  const paidAmount = installments.reduce((sum, i) => sum + i.paid_amount, 0);
  const remainingBalance = installments.reduce((sum, i) => sum + i.remaining_balance, 0);

  const pending = installments.filter(i => i.status === 'pending').length;
  const due = installments.filter(i => i.status === 'due').length;
  const overdue = installments.filter(i => i.status === 'overdue').length;
  const paid = installments.filter(i => i.status === 'paid').length;
  const cancelled = installments.filter(i => i.status === 'cancelled').length;

  return {
    totalInstallments,
    totalAmount,
    paidAmount,
    remainingBalance,
    pending,
    due,
    overdue,
    paid,
    cancelled,
  };
}
