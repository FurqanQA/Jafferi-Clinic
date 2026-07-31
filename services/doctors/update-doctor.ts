import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { checkDuplicateEmail, checkDuplicatePhone, checkDuplicateLicenseNumber } from '../core/duplicate-checker';
import { buildUpdateObject } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateUpdateDoctor, validateDoctorId } from './doctor-validation';
import { validateUpdateDoctorPermission, validateDoctorClinicAccess } from './doctor-permissions';
import { UpdateDoctorInput, Doctor } from './doctor-types';

/**
 * Update an existing doctor
 */
export async function updateDoctor(doctorId: string, input: UpdateDoctorInput): Promise<Doctor> {
  // Validate permissions
  await validateUpdateDoctorPermission();

  // Validate doctor ID
  const validatedDoctorId = validateDoctorId(doctorId);

  // Validate clinic access
  await validateDoctorClinicAccess(validatedDoctorId);

  // Validate input
  const validatedInput = validateUpdateDoctor(input);

  const supabase = getSupabaseClient();

  try {
    // Check for duplicate email, phone, and license number if being updated
    await checkDuplicateEmail('doctors', validatedInput.email, validatedDoctorId);
    await checkDuplicatePhone('doctors', validatedInput.phone, validatedDoctorId);
    await checkDuplicateLicenseNumber('doctors', validatedInput.license_number, validatedDoctorId);

    // Build update object with only provided fields
    const updateData = buildUpdateObject(validatedInput as Record<string, unknown>, [
      'first_name',
      'last_name',
      'email',
      'phone',
      'license_number',
      'specialization',
      'department',
      'qualification',
      'experience_years',
      'gender',
      'date_of_birth',
      'consultation_fee',
      'biography',
      'languages_spoken',
      'working_hours',
      'avatar_url',
      'status',
      'availability',
    ]);

    // Update doctor
    const { data, error } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('id', validatedDoctorId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update doctor', { error, doctorId: validatedDoctorId });
      throw new DatabaseError('Failed to update doctor', { error });
    }

    if (!data) {
      throw new NotFoundError('Doctor not found');
    }

    logger.info('Doctor updated successfully', { doctorId: validatedDoctorId });
    return data as Doctor;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating doctor', { error, doctorId: validatedDoctorId });
    throw new DatabaseError('Failed to update doctor', { error });
  }
}
