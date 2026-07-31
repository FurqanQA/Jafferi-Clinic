import { restoreRecord } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateDoctorId } from './doctor-validation';
import { validateRestoreDoctorPermission, validateDoctorClinicAccess } from './doctor-permissions';
import { Doctor } from './doctor-types';

/**
 * Restore a soft-deleted doctor
 */
export async function restoreDoctor(doctorId: string): Promise<Doctor> {
  // Validate permissions
  await validateRestoreDoctorPermission();

  // Validate doctor ID
  const validatedDoctorId = validateDoctorId(doctorId);

  // Validate clinic access
  await validateDoctorClinicAccess(validatedDoctorId);

  const data = await restoreRecord('doctors', validatedDoctorId);
  logger.info('Doctor restored successfully', { doctorId: validatedDoctorId });
  return data as Doctor;
}
