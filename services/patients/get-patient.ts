import { getSupabaseClient } from '../core/client';
import { NotFoundError, DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateReadPatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Get a patient by ID
 */
export async function getPatient(patientId: string): Promise<Patient> {
  // Validate permissions
  await validateReadPatientPermission();

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
      .select('*')
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch patient', { error, patientId, clinicId });
      throw new DatabaseError('Failed to fetch patient', { error });
    }

    if (!data) {
      throw new NotFoundError('Patient not found');
    }

    return data as Patient;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching patient', { error, patientId, clinicId });
    throw new DatabaseError('Failed to fetch patient', { error });
  }
}
