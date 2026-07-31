import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateMedicalRecordId, validateUpdateMedicalRecord, validateMedicalRecordStatusTransition } from './medical-record-validation';
import { validateUpdateMedicalRecordPermission, validateMedicalRecordClinicAccess, validateManageMedicalRecordAccess } from './medical-record-permissions';
import { calculateCompleteVitals } from './vitals';
import { UpdateMedicalRecordInput, MedicalRecord } from './medical-record-types';

/**
 * Update an existing medical record
 */
export async function updateMedicalRecord(
  medicalRecordId: string,
  input: UpdateMedicalRecordInput
): Promise<MedicalRecord> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  // Validate medical record ID
  const validatedId = validateMedicalRecordId(medicalRecordId);

  // Validate clinic access
  await validateMedicalRecordClinicAccess(validatedId);

  // Validate user can manage this specific record
  await validateManageMedicalRecordAccess(validatedId);

  // Validate input
  const validatedInput = validateUpdateMedicalRecord(input) as UpdateMedicalRecordInput;

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

    // Check if record can be updated (signed records cannot be updated)
    if (currentRecord.status === 'signed' || currentRecord.status === 'completed') {
      throw new Error('Cannot update signed or completed medical records');
    }

    // Calculate vitals with BMI if provided
    const processedVitals = validatedInput.vitals 
      ? calculateCompleteVitals(validatedInput.vitals)
      : undefined;

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...validatedInput,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Replace vitals with processed version
    if (processedVitals) {
      updateData.vitals = processedVitals;
    }

    // Update medical record
    const { data, error } = await supabase
      .from('medical_records')
      .update(updateData)
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update medical record', { error, medicalRecordId: validatedId });
      throw new DatabaseError('Failed to update medical record', { error });
    }

    logger.info('Medical record updated successfully', { medicalRecordId: validatedId });
    return data as MedicalRecord;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating medical record', { error, medicalRecordId: validatedId });
    throw new DatabaseError('Failed to update medical record', { error });
  }
}
