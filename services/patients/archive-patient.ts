import { getSupabaseClient } from '../core/client';
import { NotFoundError, DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateArchivePatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Archive a patient (sets status to archived)
 */
export async function archivePatient(patientId: string): Promise<Patient> {
  // Validate permissions
  await validateArchivePatientPermission();

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
        status: 'archived',
        is_active: false,
      })
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .eq('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to archive patient', { error, patientId, clinicId });
      throw new DatabaseError('Failed to archive patient', { error });
    }

    if (!data) {
      throw new NotFoundError('Patient not found');
    }

    logger.info('Patient archived successfully', { patientId, clinicId });
    return data as Patient;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error archiving patient', { error, patientId, clinicId });
    throw new DatabaseError('Failed to archive patient', { error });
  }
}
