import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateRecurringBillingPermission } from './billing-permissions';
import { validateRecurringBilling } from './billing-validation';
import { RecurringBilling, RecurringFrequency } from './billing-types';

/**
 * Calculate next billing date based on frequency
 */
export function calculateNextBillingDate(
  lastBillingDate: string,
  frequency: RecurringFrequency
): string {
  const date = new Date(lastBillingDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return date.toISOString();
}

/**
 * Create recurring billing
 */
export async function createRecurringBilling(
  billing: Omit<RecurringBilling, 'id' | 'created_at' | 'updated_at'>
): Promise<RecurringBilling> {
  await validateRecurringBillingPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateRecurringBilling(billing.frequency, billing.amount);

    const { data, error } = await supabase
      .from('recurring_billing')
      .insert({
        ...billing,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create recurring billing', { error });
      throw new DatabaseError('Failed to create recurring billing', { error });
    }

    logger.info('Recurring billing created successfully', { patientId: billing.patient_id });
    return data as RecurringBilling;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating recurring billing', { error });
    throw new DatabaseError('Failed to create recurring billing', { error });
  }
}

/**
 * Get recurring billing by ID
 */
export async function getRecurringBilling(billingId: string): Promise<RecurringBilling> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('recurring_billing')
      .select('*')
      .eq('id', billingId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch recurring billing', { error, billingId });
      throw new DatabaseError('Failed to fetch recurring billing', { error });
    }

    if (!data) {
      throw new NotFoundError('Recurring billing not found');
    }

    return data as RecurringBilling;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching recurring billing', { error, billingId });
    throw new DatabaseError('Failed to fetch recurring billing', { error });
  }
}

/**
 * Get recurring billing by patient
 */
export async function getRecurringBillingByPatient(patientId: string): Promise<RecurringBilling[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('recurring_billing')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('next_billing_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch recurring billing by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch recurring billing by patient', { error });
    }

    return (data || []) as RecurringBilling[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching recurring billing by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch recurring billing by patient', { error });
  }
}

/**
 * Update recurring billing
 */
export async function updateRecurringBilling(
  billingId: string,
  updates: Partial<RecurringBilling>
): Promise<RecurringBilling> {
  await validateRecurringBillingPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    if (updates.frequency && updates.amount) {
      validateRecurringBilling(updates.frequency, updates.amount);
    }

    const { data, error } = await supabase
      .from('recurring_billing')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', billingId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update recurring billing', { error, billingId });
      throw new DatabaseError('Failed to update recurring billing', { error });
    }

    if (!data) {
      throw new NotFoundError('Recurring billing not found');
    }

    logger.info('Recurring billing updated successfully', { billingId });
    return data as RecurringBilling;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating recurring billing', { error, billingId });
    throw new DatabaseError('Failed to update recurring billing', { error });
  }
}

/**
 * Delete recurring billing (soft delete)
 */
export async function deleteRecurringBilling(billingId: string): Promise<void> {
  await validateRecurringBillingPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('recurring_billing')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', billingId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete recurring billing', { error, billingId });
      throw new DatabaseError('Failed to delete recurring billing', { error });
    }

    logger.info('Recurring billing deleted successfully', { billingId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting recurring billing', { error, billingId });
    throw new DatabaseError('Failed to delete recurring billing', { error });
  }
}

/**
 * Get all recurring billing for clinic
 */
export async function getAllRecurringBilling(): Promise<RecurringBilling[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('recurring_billing')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('next_billing_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch recurring billing', { error });
      throw new DatabaseError('Failed to fetch recurring billing', { error });
    }

    return (data || []) as RecurringBilling[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching recurring billing', { error });
    throw new DatabaseError('Failed to fetch recurring billing', { error });
  }
}

/**
 * Get due recurring billing
 */
export async function getDueRecurringBilling(): Promise<RecurringBilling[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('recurring_billing')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .lte('next_billing_date', now)
      .order('next_billing_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch due recurring billing', { error });
      throw new DatabaseError('Failed to fetch due recurring billing', { error });
    }

    return (data || []) as RecurringBilling[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching due recurring billing', { error });
    throw new DatabaseError('Failed to fetch due recurring billing', { error });
  }
}

/**
 * Process recurring billing cycle
 * Placeholder for automation
 */
export async function processRecurringBillingCycle(billingId: string): Promise<{
  processed: boolean;
  invoiceId?: string;
  nextBillingDate?: string;
  errorMessage?: string;
}> {
  // Placeholder for recurring billing cycle processing
  logger.info('Recurring billing cycle processing requested', { billingId });

  return {
    processed: false,
    errorMessage: 'Recurring billing automation not yet implemented',
  };
}

/**
 * Placeholder for subscription billing integration
 * Future integration with subscription management systems
 */
export async function createSubscriptionBilling(
  patientId: string,
  subscriptionPlanId: string
): Promise<RecurringBilling> {
  // Placeholder for subscription billing creation
  logger.info('Subscription billing creation requested', { patientId, subscriptionPlanId });

  throw new Error('Subscription billing integration not yet implemented');
}

/**
 * Placeholder for membership billing integration
 * Future integration with membership management systems
 */
export async function createMembershipBilling(
  patientId: string,
  membershipTierId: string
): Promise<RecurringBilling> {
  // Placeholder for membership billing creation
  logger.info('Membership billing creation requested', { patientId, membershipTierId });

  throw new Error('Membership billing integration not yet implemented');
}
