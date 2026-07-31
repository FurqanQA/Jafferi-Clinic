import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateMedicalRecordId, validateMedicalRecordStatusTransition } from './medical-record-validation';
import { validateArchiveMedicalRecordPermission, validateMedicalRecordClinicAccess } from './medical-record-permissions';
import { MedicalRecord } from './medical-record-types';

/**
 * Archive a medical record
 * Transitions status from 'completed' to 'archived'
 */
export async function archiveMedicalRecord(medicalRecordId: string): Promise<MedicalRecord> {
  // Validate permissions
  await validateArchiveMedicalRecordPermission();

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

    // Validate status transition
    validateMedicalRecordStatusTransition(currentRecord.status, 'archived');

    // Update medical record to archived status
    const { data, error } = await supabase
      .from('medical_records')
      .update({
        status: 'archived',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to archive medical record', { error, medicalRecordId: validatedId });
      throw new DatabaseError('Failed to archive medical record', { error });
    }

    logger.info('Medical record archived successfully', { medicalRecordId: validatedId });
    return data as MedicalRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error archiving medical record', { error, medicalRecordId: validatedId });
    throw new DatabaseError('Failed to archive medical record', { error });
  }
}
