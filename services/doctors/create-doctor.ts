import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { checkDuplicateEmail, checkDuplicatePhone, checkDuplicateLicenseNumber } from '../core/duplicate-checker';
import { logger } from '../shared/logger';
import { randomString } from '../shared/helpers';
import { validateCreateDoctor } from './doctor-validation';
import { validateCreateDoctorPermission } from './doctor-permissions';
import { CreateDoctorInput, Doctor } from './doctor-types';

/**
 * Create a new doctor
 */
export async function createDoctor(input: CreateDoctorInput): Promise<Doctor> {
  // Validate permissions
  await validateCreateDoctorPermission();

  // Validate input
  const validatedInput = validateCreateDoctor(input);

  // Get clinic ID
  const clinicId = await getUserClinicId();

  // Generate doctor number
  const doctorNumber = generateDoctorNumber();

  const supabase = getSupabaseClient();

  try {
    // Check for duplicate email, phone, and license number
    await checkDuplicateEmail('doctors', validatedInput.email);
    await checkDuplicatePhone('doctors', validatedInput.phone);
    await checkDuplicateLicenseNumber('doctors', validatedInput.license_number);

    // Create doctor
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        clinic_id: clinicId,
        doctor_number: doctorNumber,
        first_name: validatedInput.first_name,
        last_name: validatedInput.last_name,
        email: validatedInput.email,
        phone: validatedInput.phone,
        license_number: validatedInput.license_number,
        specialization: validatedInput.specialization,
        department: validatedInput.department || null,
        qualification: validatedInput.qualification || null,
        experience_years: validatedInput.experience_years || null,
        gender: validatedInput.gender || null,
        date_of_birth: validatedInput.date_of_birth || null,
        consultation_fee: validatedInput.consultation_fee || null,
        biography: validatedInput.biography || null,
        languages_spoken: validatedInput.languages_spoken || null,
        working_hours: validatedInput.working_hours || null,
        status: 'active',
        availability: 'available',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create doctor', { error, clinicId });
      throw new DatabaseError('Failed to create doctor', { error });
    }

    logger.info('Doctor created successfully', { doctorId: data.id, clinicId });
    return data as Doctor;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating doctor', { error, clinicId });
    throw new DatabaseError('Failed to create doctor', { error });
  }
}

/**
 * Generate a unique doctor number
 */
function generateDoctorNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(6).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}
