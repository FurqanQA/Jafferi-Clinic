import { softDelete } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateDoctorId } from './doctor-validation';
import { validateDeleteDoctorPermission, validateDoctorClinicAccess } from './doctor-permissions';
import { Doctor } from './doctor-types';

/**
 * Soft delete a doctor
 */
export async function deleteDoctor(doctorId: string): Promise<Doctor> {
  // Validate permissions
  await validateDeleteDoctorPermission();

  // Validate doctor ID
  const validatedDoctorId = validateDoctorId(doctorId);

  // Validate clinic access
  await validateDoctorClinicAccess(validatedDoctorId);

  const data = await softDelete('doctors', validatedDoctorId);
  logger.info('Doctor deleted successfully', { doctorId: validatedDoctorId });
  return data as Doctor;
}
