import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCreditNotePermission } from './billing-permissions';
import { validateCreditNoteAmount } from './billing-validation';
import { CreditNote } from './billing-types';

/**
 * Generate credit note number
 */
export async function generateCreditNoteNumber(clinicId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

  const { data, error } = await supabase
    .from('credit_notes')
    .select('credit_note_number')
    .eq('clinic_id', clinicId)
    .like('credit_note_number', `CN-${datePrefix}%`)
    .order('credit_note_number', { ascending: false })
    .limit(1);

  if (error) {
    logger.error('Failed to generate credit note number', { error });
    throw new DatabaseError('Failed to generate credit note number', { error });
  }

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].credit_note_number;
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }

  return `CN-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Create credit note
 */
export async function createCreditNote(
  invoiceId: string,
  amount: number,
  reason: string
): Promise<CreditNote> {
  await validateCreditNotePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate credit note amount against invoice paid amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('paid_amount')
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .single();

    if (invoiceError || !invoice) {
      throw new NotFoundError('Invoice not found');
    }

    validateCreditNoteAmount(amount, invoice.paid_amount);

    const creditNoteNumber = await generateCreditNoteNumber(clinicId);

    const { data, error } = await supabase
      .from('credit_notes')
      .insert({
        clinic_id: clinicId,
        invoice_id: invoiceId,
        credit_note_number: creditNoteNumber,
        credit_note_date: new Date().toISOString(),
        status: 'draft',
        reason,
        amount,
        applied_amount: 0,
        remaining_balance: amount,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create credit note', { error });
      throw new DatabaseError('Failed to create credit note', { error });
    }

    logger.info('Credit note created successfully', { creditNoteNumber, invoiceId });
    return data as CreditNote;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating credit note', { error });
    throw new DatabaseError('Failed to create credit note', { error });
  }
}

/**
 * Get credit note by ID
 */
export async function getCreditNote(creditNoteId: string): Promise<CreditNote> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('credit_notes')
      .select('*')
      .eq('id', creditNoteId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch credit note', { error, creditNoteId });
      throw new DatabaseError('Failed to fetch credit note', { error });
    }

    if (!data) {
      throw new NotFoundError('Credit note not found');
    }

    return data as CreditNote;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching credit note', { error, creditNoteId });
    throw new DatabaseError('Failed to fetch credit note', { error });
  }
}

/**
 * Get credit notes by invoice
 */
export async function getCreditNotesByInvoice(invoiceId: string): Promise<CreditNote[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('credit_notes')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('credit_note_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch credit notes by invoice', { error, invoiceId });
      throw new DatabaseError('Failed to fetch credit notes by invoice', { error });
    }

    return (data || []) as CreditNote[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching credit notes by invoice', { error, invoiceId });
    throw new DatabaseError('Failed to fetch credit notes by invoice', { error });
  }
}

/**
 * Issue credit note
 */
export async function issueCreditNote(creditNoteId: string): Promise<CreditNote> {
  await validateCreditNotePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('credit_notes')
      .update({
        status: 'issued',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', creditNoteId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to issue credit note', { error, creditNoteId });
      throw new DatabaseError('Failed to issue credit note', { error });
    }

    if (!data) {
      throw new NotFoundError('Credit note not found');
    }

    logger.info('Credit note issued successfully', { creditNoteId });
    return data as CreditNote;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error issuing credit note', { error, creditNoteId });
    throw new DatabaseError('Failed to issue credit note', { error });
  }
}

/**
 * Apply credit note to invoice
 */
export async function applyCreditNote(creditNoteId: string, applyAmount: number): Promise<CreditNote> {
  await validateCreditNotePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const creditNote = await getCreditNote(creditNoteId);

    if (creditNote.status !== 'issued') {
      throw new Error('Can only apply issued credit notes');
    }

    if (applyAmount > (creditNote.remaining_balance || 0)) {
      throw new Error('Apply amount cannot exceed remaining balance');
    }

    const newAppliedAmount = (creditNote.applied_amount || 0) + applyAmount;
    const newRemainingBalance = (creditNote.remaining_balance || 0) - applyAmount;
    const newStatus = newRemainingBalance === 0 ? 'applied' : 'issued';

    const { data, error } = await supabase
      .from('credit_notes')
      .update({
        applied_amount: newAppliedAmount,
        remaining_balance: newRemainingBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creditNoteId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to apply credit note', { error, creditNoteId });
      throw new DatabaseError('Failed to apply credit note', { error });
    }

    if (!data) {
      throw new NotFoundError('Credit note not found');
    }

    logger.info('Credit note applied successfully', { creditNoteId, applyAmount });
    return data as CreditNote;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error applying credit note', { error, creditNoteId });
    throw new DatabaseError('Failed to apply credit note', { error });
  }
}

/**
 * Cancel credit note
 */
export async function cancelCreditNote(creditNoteId: string): Promise<CreditNote> {
  await validateCreditNotePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('credit_notes')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', creditNoteId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel credit note', { error, creditNoteId });
      throw new DatabaseError('Failed to cancel credit note', { error });
    }

    if (!data) {
      throw new NotFoundError('Credit note not found');
    }

    logger.info('Credit note cancelled successfully', { creditNoteId });
    return data as CreditNote;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling credit note', { error, creditNoteId });
    throw new DatabaseError('Failed to cancel credit note', { error });
  }
}

/**
 * Get all credit notes for clinic
 */
export async function getCreditNotes(): Promise<CreditNote[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('credit_notes')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('credit_note_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch credit notes', { error });
      throw new DatabaseError('Failed to fetch credit notes', { error });
    }

    return (data || []) as CreditNote[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching credit notes', { error });
    throw new DatabaseError('Failed to fetch credit notes', { error });
  }
}

/**
 * Get credit notes by status
 */
export async function getCreditNotesByStatus(status: 'draft' | 'issued' | 'applied' | 'cancelled'): Promise<CreditNote[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('credit_notes')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('credit_note_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch credit notes by status', { error, status });
      throw new DatabaseError('Failed to fetch credit notes by status', { error });
    }

    return (data || []) as CreditNote[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching credit notes by status', { error, status });
    throw new DatabaseError('Failed to fetch credit notes by status', { error });
  }
}
