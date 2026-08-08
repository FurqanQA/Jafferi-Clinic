import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError, ConflictError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { checkDuplicateEmail, checkDuplicatePhone } from '../core/duplicate-checker';
import { logger } from '../shared/logger';
import { randomString } from '../shared/helpers';
import { validateCreatePatient } from './patient-validation';
import { validateCreatePatientPermission } from './patient-permissions';
import { CreatePatientInput, Patient } from './patient-types';

/**
 * Create a new patient
 */
export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  // Validate permissions
  await validateCreatePatientPermission();

  // Validate input
  const validatedInput = validateCreatePatient(input);

  // Get clinic ID
  const clinicId = await getUserClinicId();

  // Generate medical record number
  const medicalRecordNumber = generateMedicalRecordNumber();

  const supabase = getSupabaseClient();

  try {
    // Check for duplicate email and phone
    await checkDuplicateEmail('patients', validatedInput.email);
    await checkDuplicatePhone('patients', validatedInput.phone);

    // Create patient
    const { data, error } = await supabase
      .from('patients')
      .insert({
        clinic_id: clinicId,
        patient_number: medicalRecordNumber,
        first_name: validatedInput.first_name,
        last_name: validatedInput.last_name,
        date_of_birth: validatedInput.date_of_birth,
        gender: validatedInput.gender,
        blood_type: validatedInput.blood_type,
        phone: validatedInput.phone,
        email: validatedInput.email || null,
        address: validatedInput.address || null,
        city: validatedInput.city || null,
        state: validatedInput.state || null,
        postal_code: validatedInput.postal_code || null,
        country: validatedInput.country || null,
        national_id: validatedInput.national_id || null,
        insurance_provider: validatedInput.insurance_provider || null,
        insurance_number: validatedInput.insurance_number || null,
        emergency_contact_name: validatedInput.emergency_contact_name || null,
        emergency_contact_phone: validatedInput.emergency_contact_phone || null,
        emergency_contact_relationship: validatedInput.emergency_contact_relationship || null,
        allergies: validatedInput.allergies || null,
        chronic_conditions: validatedInput.chronic_conditions || null,
        medications: validatedInput.medications || null,
        notes: validatedInput.notes || null,
        status: 'active',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create patient', { error, clinicId });
      throw new DatabaseError('Failed to create patient', { error });
    }

    logger.info('Patient created successfully', { patientId: data.id, clinicId });
    return data as Patient;
  } catch (error) {
    if (error instanceof ConflictError || error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating patient', { error, clinicId });
    throw new DatabaseError('Failed to create patient', { error });
  }
}

/**
 * Generate a unique medical record number
 */
function generateMedicalRecordNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(6).toUpperCase();
  return `MRN-${timestamp}-${random}`;
}
