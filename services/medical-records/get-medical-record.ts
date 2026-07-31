import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { logger } from '../shared/logger';
import { validateMedicalRecordId } from './medical-record-validation';
import { validateReadMedicalRecordPermission, validateMedicalRecordClinicAccess } from './medical-record-permissions';
import { MedicalRecord } from './medical-record-types';

/**
 * Get a single medical record by ID
 */
export async function getMedicalRecord(
  medicalRecordId: string,
  options?: { includeDeleted?: boolean }
): Promise<MedicalRecord> {
  // Validate permissions
  await validateReadMedicalRecordPermission();

  // Validate medical record ID
  const validatedId = validateMedicalRecordId(medicalRecordId);

  // Validate clinic access
  await validateMedicalRecordClinicAccess(validatedId);

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('medical_records')
      .select('*')
      .eq('id', validatedId);

    // Apply soft delete filter
    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch medical record', { error, medicalRecordId: validatedId });
      throw new DatabaseError('Failed to fetch medical record', { error });
    }

    if (!data) {
      throw new NotFoundError('Medical record not found');
    }

    return data as MedicalRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching medical record', { error, medicalRecordId: validatedId });
    throw new DatabaseError('Failed to fetch medical record', { error });
  }
}
