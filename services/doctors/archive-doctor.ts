import { archiveRecord } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateDoctorId } from './doctor-validation';
import { validateArchiveDoctorPermission, validateDoctorClinicAccess } from './doctor-permissions';
import { Doctor } from './doctor-types';

/**
 * Archive a doctor (set status to archived)
 */
export async function archiveDoctor(doctorId: string): Promise<Doctor> {
  // Validate permissions
  await validateArchiveDoctorPermission();

  // Validate doctor ID
  const validatedDoctorId = validateDoctorId(doctorId);

  // Validate clinic access
  await validateDoctorClinicAccess(validatedDoctorId);

  const data = await archiveRecord('doctors', validatedDoctorId);
  logger.info('Doctor archived successfully', { doctorId: validatedDoctorId });
  return data as Doctor;
}
