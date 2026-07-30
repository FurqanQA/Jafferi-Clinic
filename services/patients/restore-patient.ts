import { getSupabaseClient } from '../core/client';
import { NotFoundError, DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateRestorePatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Restore a soft-deleted patient
 */
export async function restorePatient(patientId: string): Promise<Patient> {
  // Validate permissions
  await validateRestorePatientPermission();

  // Validate patient ID
  validatePatientId(patientId);

  // Validate clinic access
  await validatePatientClinicAccess(patientId);

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('patients')
      .update({
        deleted_at: null,
        is_active: true,
        status: 'active',
      })
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to restore patient', { error, patientId, clinicId });
      throw new DatabaseError('Failed to restore patient', { error });
    }

    if (!data) {
      throw new NotFoundError('Patient not found');
    }

    logger.info('Patient restored successfully', { patientId, clinicId });
    return data as Patient;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error restoring patient', { error, patientId, clinicId });
    throw new DatabaseError('Failed to restore patient', { error });
  }
}
