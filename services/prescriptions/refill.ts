import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionClinicAccess, validateUpdatePrescriptionPermission } from './prescription-permissions';
import { validatePrescriptionNotExpired } from './prescription-validation';
import { RefillInfo, Prescription } from './prescription-types';

/**
 * Process a prescription refill
 */
export async function processRefill(prescriptionId: string): Promise<RefillInfo> {
  await validateUpdatePrescriptionPermission();

  await validatePrescriptionClinicAccess(prescriptionId);

  const clinicId = await getUserClinicId();
  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    // Get prescription
    const { data: prescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !prescription) {
      throw new Error('Prescription not found');
    }

    // Validate refill is allowed
    if (!prescription.refill_allowed) {
      throw new Error('Refills are not allowed for this prescription');
    }

    // Validate refills remaining
    if (prescription.refill_remaining <= 0) {
      throw new Error('No refills remaining for this prescription');
    }

    // Validate prescription not expired
    validatePrescriptionNotExpired(prescription.expiry_date);

    // Calculate refill number
    const refillNumber = prescription.refill_count - prescription.refill_remaining + 1;

    // Create refill record
    const { data: refill, error: refillError } = await supabase
      .from('prescription_refills')
      .insert({
        prescription_id: prescriptionId,
        refill_number: refillNumber,
        refill_date: new Date().toISOString(),
        dispensed_by: user.id,
      })
      .select()
      .single();

    if (refillError) {
      logger.error('Failed to create refill record', { error: refillError, prescriptionId });
      throw new DatabaseError('Failed to create refill record', { error: refillError });
    }

    // Update prescription refill remaining
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({
        refill_remaining: prescription.refill_remaining - 1,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prescriptionId);

    if (updateError) {
      logger.error('Failed to update prescription refill count', { error: updateError, prescriptionId });
      throw new DatabaseError('Failed to update prescription refill count', { error: updateError });
    }

    logger.info('Prescription refill processed successfully', { refillId: refill.id, prescriptionId });
    return refill as RefillInfo;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error processing refill', { error, prescriptionId });
    throw new DatabaseError('Failed to process refill', { error });
  }
}

/**
 * Get refill history for a prescription
 */
export async function getRefillHistory(prescriptionId: string): Promise<RefillInfo[]> {
  await validateUpdatePrescriptionPermission();

  await validatePrescriptionClinicAccess(prescriptionId);

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('prescription_refills')
      .select('*')
      .eq('prescription_id', prescriptionId)
      .order('refill_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch refill history', { error, prescriptionId });
      throw new DatabaseError('Failed to fetch refill history', { error });
    }

    return (data || []) as RefillInfo[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching refill history', { error, prescriptionId });
    throw new DatabaseError('Failed to fetch refill history', { error });
  }
}

/**
 * Validate refill eligibility
 */
export async function validateRefillEligibility(prescriptionId: string): Promise<{
  eligible: boolean;
  reason?: string;
  refillsRemaining: number;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('refill_allowed, refill_remaining, expiry_date, status')
      .eq('id', prescriptionId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !prescription) {
      return {
        eligible: false,
        reason: 'Prescription not found',
        refillsRemaining: 0,
      };
    }

    // Check if refill is allowed
    if (!prescription.refill_allowed) {
      return {
        eligible: false,
        reason: 'Refills are not allowed for this prescription',
        refillsRemaining: 0,
      };
    }

    // Check refills remaining
    if (prescription.refill_remaining <= 0) {
      return {
        eligible: false,
        reason: 'No refills remaining',
        refillsRemaining: 0,
      };
    }

    // Check if prescription is expired
    const expiryDate = new Date(prescription.expiry_date);
    const today = new Date();
    if (expiryDate < today) {
      return {
        eligible: false,
        reason: 'Prescription has expired',
        refillsRemaining: prescription.refill_remaining,
      };
    }

    // Check if prescription is in a valid status for refill
    const validStatuses = ['signed', 'dispensed', 'completed'];
    if (!validStatuses.includes(prescription.status)) {
      return {
        eligible: false,
        reason: `Prescription status (${prescription.status}) does not allow refills`,
        refillsRemaining: prescription.refill_remaining,
      };
    }

    return {
      eligible: true,
      refillsRemaining: prescription.refill_remaining,
    };
  } catch (error) {
    logger.error('Unexpected error validating refill eligibility', { error, prescriptionId });
    return {
      eligible: false,
      reason: 'Error validating refill eligibility',
      refillsRemaining: 0,
    };
  }
}

/**
 * Get all prescriptions eligible for refill for a patient
 */
export async function getEligibleRefills(patientId: string): Promise<Prescription[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .eq('refill_allowed', true)
      .gt('refill_remaining', 0)
      .gt('expiry_date', today)
      .in('status', ['signed', 'dispensed', 'completed'])
      .is('deleted_at', null)
      .order('expiry_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch eligible refills', { error, patientId });
      throw new DatabaseError('Failed to fetch eligible refills', { error });
    }

    return (data || []) as Prescription[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching eligible refills', { error, patientId });
    throw new DatabaseError('Failed to fetch eligible refills', { error });
  }
}

/**
 * Calculate refill expiration date
 */
export function calculateRefillExpiryDate(originalExpiryDate: string): string {
  const originalExpiry = new Date(originalExpiryDate);
  const today = new Date();
  
  // Refills expire 30 days from original expiry or today, whichever is later
  const thirtyDaysFromToday = new Date(today);
  thirtyDaysFromToday.setDate(today.getDate() + 30);
  
  const refillExpiry = originalExpiry > thirtyDaysFromToday ? originalExpiry : thirtyDaysFromToday;
  
  return refillExpiry.toISOString().split('T')[0];
}

/**
 * Update prescription refill settings
 */
export async function updateRefillSettings(
  prescriptionId: string,
  settings: {
    refill_allowed: boolean;
    refill_count: number;
  }
): Promise<void> {
  await validateUpdatePrescriptionPermission();

  await validatePrescriptionClinicAccess(prescriptionId);

  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('prescriptions')
      .update({
        refill_allowed: settings.refill_allowed,
        refill_count: settings.refill_count,
        refill_remaining: settings.refill_allowed ? settings.refill_count : 0,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prescriptionId);

    if (error) {
      logger.error('Failed to update refill settings', { error, prescriptionId });
      throw new DatabaseError('Failed to update refill settings', { error });
    }

    logger.info('Refill settings updated successfully', { prescriptionId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating refill settings', { error, prescriptionId });
    throw new DatabaseError('Failed to update refill settings', { error });
  }
}
