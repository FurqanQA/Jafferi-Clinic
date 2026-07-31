import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionId } from './prescription-validation';
import { validateReadPrescriptionPermission, validatePrescriptionClinicAccess } from './prescription-permissions';
import { Prescription } from './prescription-types';

/**
 * Get a single prescription by ID
 */
export async function getPrescription(
  prescriptionId: string,
  options?: { includeDeleted?: boolean }
): Promise<Prescription> {
  // Validate permissions
  await validateReadPrescriptionPermission();

  // Validate prescription ID
  const validatedId = validatePrescriptionId(prescriptionId);

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('prescriptions')
      .select('*')
      .eq('id', validatedId)
      .eq('clinic_id', clinicId);

    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch prescription', { error, prescriptionId: validatedId });
      throw new DatabaseError('Failed to fetch prescription', { error });
    }

    if (!data) {
      throw new NotFoundError('Prescription not found');
    }

    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching prescription', { error, prescriptionId: validatedId });
    throw new DatabaseError('Failed to fetch prescription', { error });
  }
}
