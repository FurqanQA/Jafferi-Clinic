import { getSupabaseClient } from '../core/client';
import { NotFoundError, DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateDeletePatientPermission, validatePatientClinicAccess } from './patient-permissions';

/**
 * Soft delete a patient
 */
export async function deletePatient(patientId: string): Promise<void> {
  // Validate permissions
  await validateDeletePatientPermission();

  // Validate patient ID
  validatePatientId(patientId);

  // Validate clinic access
  await validatePatientClinicAccess(patientId);

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('patients')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        status: 'inactive',
      })
      .eq('id', patientId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete patient', { error, patientId, clinicId });
      throw new DatabaseError('Failed to delete patient', { error });
    }

    logger.info('Patient deleted successfully', { patientId, clinicId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting patient', { error, patientId, clinicId });
    throw new DatabaseError('Failed to delete patient', { error });
  }
}
