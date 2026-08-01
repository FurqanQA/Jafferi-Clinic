import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReconciliationPermission } from './payment-permissions';
import { Reconciliation, ReconciliationStatus } from './payment-types';

// ============================================================================
// Reconciliation Engine
// ============================================================================

/**
 * Generate unique reconciliation number
 */
function generateReconciliationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${timestamp}-${random}`;
}

/**
 * Create reconciliation record
 */
export async function createReconciliation(
  type: 'bank' | 'gateway' | 'insurance',
  startDate: string,
  endDate: string
): Promise<Reconciliation> {
  await validateReconciliationPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const reconciliationNumber = generateReconciliationNumber();

    const { data, error } = await supabase
      .from('reconciliations')
      .insert({
        clinic_id: clinicId,
        reconciliation_number: reconciliationNumber,
        type,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        total_transactions: 0,
        matched_transactions: 0,
        unmatched_transactions: 0,
        total_amount: 0,
        matched_amount: 0,
        unmatched_amount: 0,
        difference_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create reconciliation', { error, type, startDate, endDate });
      throw new DatabaseError('Failed to create reconciliation', { error });
    }

    logger.info('Reconciliation created successfully', { reconciliationNumber, type });
    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating reconciliation', { error, type, startDate, endDate });
    throw new DatabaseError('Failed to create reconciliation', { error });
  }
}

/**
 * Get reconciliation by ID
 */
export async function getReconciliation(reconciliationId: string): Promise<Reconciliation> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reconciliations')
      .select('*')
      .eq('id', reconciliationId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch reconciliation', { error, reconciliationId });
      throw new DatabaseError('Failed to fetch reconciliation', { error });
    }

    if (!data) {
      throw new NotFoundError('Reconciliation not found');
    }

    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching reconciliation', { error, reconciliationId });
    throw new DatabaseError('Failed to fetch reconciliation', { error });
  }
}

/**
 * Get reconciliation by number
 */
export async function getReconciliationByNumber(reconciliationNumber: string): Promise<Reconciliation> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reconciliations')
      .select('*')
      .eq('reconciliation_number', reconciliationNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch reconciliation by number', { error, reconciliationNumber });
      throw new DatabaseError('Failed to fetch reconciliation by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Reconciliation not found');
    }

    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching reconciliation by number', { error, reconciliationNumber });
    throw new DatabaseError('Failed to fetch reconciliation by number', { error });
  }
}

/**
 * Get all reconciliations for clinic
 */
export async function getReconciliations(type?: 'bank' | 'gateway' | 'insurance'): Promise<Reconciliation[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('reconciliations')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch reconciliations', { error });
      throw new DatabaseError('Failed to fetch reconciliations', { error });
    }

    return (data || []) as Reconciliation[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching reconciliations', { error });
    throw new DatabaseError('Failed to fetch reconciliations', { error });
  }
}

/**
 * Start reconciliation process
 */
export async function startReconciliation(reconciliationId: string): Promise<Reconciliation> {
  await validateReconciliationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const reconciliation = await getReconciliation(reconciliationId);

    if (reconciliation.status !== 'pending') {
      throw new Error(`Cannot start reconciliation with status: ${reconciliation.status}`);
    }

    const { data, error } = await supabase
      .from('reconciliations')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to start reconciliation', { error, reconciliationId });
      throw new DatabaseError('Failed to start reconciliation', { error });
    }

    logger.info('Reconciliation started', { reconciliationId });
    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error starting reconciliation', { error, reconciliationId });
    throw new DatabaseError('Failed to start reconciliation', { error });
  }
}

/**
 * Complete reconciliation
 */
export async function completeReconciliation(
  reconciliationId: string,
  results: {
    totalTransactions: number;
    matchedTransactions: number;
    unmatchedTransactions: number;
    totalAmount: number;
    matchedAmount: number;
    unmatchedAmount: number;
    differenceAmount: number;
  }
): Promise<Reconciliation> {
  await validateReconciliationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const reconciliation = await getReconciliation(reconciliationId);

    if (reconciliation.status !== 'in_progress') {
      throw new Error(`Cannot complete reconciliation with status: ${reconciliation.status}`);
    }

    const { data, error } = await supabase
      .from('reconciliations')
      .update({
        status: 'completed',
        total_transactions: results.totalTransactions,
        matched_transactions: results.matchedTransactions,
        unmatched_transactions: results.unmatchedTransactions,
        total_amount: results.totalAmount,
        matched_amount: results.matchedAmount,
        unmatched_amount: results.unmatchedAmount,
        difference_amount: results.differenceAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete reconciliation', { error, reconciliationId });
      throw new DatabaseError('Failed to complete reconciliation', { error });
    }

    logger.info('Reconciliation completed', { reconciliationId, results });
    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing reconciliation', { error, reconciliationId });
    throw new DatabaseError('Failed to complete reconciliation', { error });
  }
}

/**
 * Fail reconciliation
 */
export async function failReconciliation(reconciliationId: string, reason?: string): Promise<Reconciliation> {
  await validateReconciliationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const reconciliation = await getReconciliation(reconciliationId);

    if (reconciliation.status !== 'in_progress') {
      throw new Error(`Cannot fail reconciliation with status: ${reconciliation.status}`);
    }

    const { data, error } = await supabase
      .from('reconciliations')
      .update({
        status: 'failed',
        notes: reason || reconciliation.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to fail reconciliation', { error, reconciliationId });
      throw new DatabaseError('Failed to fail reconciliation', { error });
    }

    logger.info('Reconciliation failed', { reconciliationId, reason });
    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error failing reconciliation', { error, reconciliationId });
    throw new DatabaseError('Failed to fail reconciliation', { error });
  }
}

/**
 * Adjust reconciliation (for manual adjustments)
 */
export async function adjustReconciliation(
  reconciliationId: string,
  adjustmentAmount: number,
  notes?: string
): Promise<Reconciliation> {
  await validateReconciliationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const reconciliation = await getReconciliation(reconciliationId);

    if (reconciliation.status !== 'completed') {
      throw new Error(`Cannot adjust reconciliation with status: ${reconciliation.status}`);
    }

    const newDifferenceAmount = reconciliation.difference_amount + adjustmentAmount;

    const { data, error } = await supabase
      .from('reconciliations')
      .update({
        status: 'adjusted',
        difference_amount: newDifferenceAmount,
        notes: notes ? `${reconciliation.notes || ''}\n${notes}`.trim() : reconciliation.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to adjust reconciliation', { error, reconciliationId });
      throw new DatabaseError('Failed to adjust reconciliation', { error });
    }

    logger.info('Reconciliation adjusted', { reconciliationId, adjustmentAmount });
    return data as Reconciliation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adjusting reconciliation', { error, reconciliationId });
    throw new DatabaseError('Failed to adjust reconciliation', { error });
  }
}

/**
 * Detect missing transactions (placeholder)
 */
export async function detectMissingTransactions(
  reconciliationId: string
): Promise<string[]> {
  // Placeholder for missing transaction detection logic
  logger.info('Missing transaction detection requested', { reconciliationId });

  // This would compare local records with gateway/bank records
  // and return IDs of missing transactions
  return [];
}

/**
 * Detect duplicate transactions (placeholder)
 */
export async function detectDuplicateTransactions(
  reconciliationId: string
): Promise<Array<{ localId: string; remoteId: string }>> {
  // Placeholder for duplicate transaction detection logic
  logger.info('Duplicate transaction detection requested', { reconciliationId });

  // This would identify transactions that appear multiple times
  // either locally or in remote records
  return [];
}

/**
 * Detect differences between local and remote records (placeholder)
 */
export async function detectDifferences(
  reconciliationId: string
): Promise<Array<{ localId: string; remoteId: string; field: string; localValue: any; remoteValue: any }>> {
  // Placeholder for difference detection logic
  logger.info('Difference detection requested', { reconciliationId });

  // This would identify discrepancies between local and remote records
  return [];
}

/**
 * Get reconciliation summary
 */
export async function getReconciliationSummary(reconciliationId: string): Promise<{
  reconciliation: Reconciliation;
  missingTransactions: string[];
  duplicateTransactions: Array<{ localId: string; remoteId: string }>;
  differences: Array<{ localId: string; remoteId: string; field: string; localValue: any; remoteValue: any }>;
}> {
  const reconciliation = await getReconciliation(reconciliationId);

  const missingTransactions = await detectMissingTransactions(reconciliationId);
  const duplicateTransactions = await detectDuplicateTransactions(reconciliationId);
  const differences = await detectDifferences(reconciliationId);

  return {
    reconciliation,
    missingTransactions,
    duplicateTransactions,
    differences,
  };
}
