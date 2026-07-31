import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateMedicalRecordId, validateCanSignRecord } from './medical-record-validation';
import { validateSignMedicalRecordPermission, validateMedicalRecordClinicAccess } from './medical-record-permissions';
import { MedicalRecord } from './medical-record-types';

/**
 * Sign a medical record
 * Transitions status from 'in_progress' to 'signed'
 */
export async function signMedicalRecord(medicalRecordId: string): Promise<MedicalRecord> {
  // Validate permissions
  await validateSignMedicalRecordPermission();

  // Validate medical record ID
  const validatedId = validateMedicalRecordId(medicalRecordId);

  // Validate clinic access
  await validateMedicalRecordClinicAccess(validatedId);

  // Get user
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    // Get current medical record
    const { data: currentRecord, error: fetchError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', validatedId)
      .single();

    if (fetchError || !currentRecord) {
      throw new NotFoundError('Medical record not found');
    }

    // Validate that record can be signed
    validateCanSignRecord(currentRecord.status);

    // Update medical record to signed status
    const { data, error } = await supabase
      .from('medical_records')
      .update({
        status: 'signed',
        signed_by: user.id,
        signed_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to sign medical record', { error, medicalRecordId: validatedId });
      throw new DatabaseError('Failed to sign medical record', { error });
    }

    logger.info('Medical record signed successfully', { medicalRecordId: validatedId, signedBy: user.id });
    return data as MedicalRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error signing medical record', { error, medicalRecordId: validatedId });
    throw new DatabaseError('Failed to sign medical record', { error });
  }
}
