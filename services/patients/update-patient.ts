import { getSupabaseClient } from '../core/client';
import { NotFoundError, DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { checkDuplicateEmail, checkDuplicatePhone } from '../core/duplicate-checker';
import { logger } from '../shared/logger';
import { validateUpdatePatient, validatePatientId } from './patient-validation';
import { validateUpdatePatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { UpdatePatientInput, Patient } from './patient-types';

/**
 * Update an existing patient
 */
export async function updatePatient(patientId: string, input: UpdatePatientInput): Promise<Patient> {
  // Validate permissions
  await validateUpdatePatientPermission();

  // Validate patient ID
  validatePatientId(patientId);

  // Validate input
  const validatedInput = validateUpdatePatient(input);

  // Validate clinic access
  await validatePatientClinicAccess(patientId);

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    // Check for duplicate email and phone if being updated
    await checkDuplicateEmail('patients', validatedInput.email, patientId);
    await checkDuplicatePhone('patients', validatedInput.phone, patientId);

    // Update patient
    const { data, error } = await supabase
      .from('patients')
      .update({
        first_name: validatedInput.first_name,
        last_name: validatedInput.last_name,
        date_of_birth: validatedInput.date_of_birth,
        gender: validatedInput.gender,
        blood_type: validatedInput.blood_type,
        phone: validatedInput.phone,
        email: validatedInput.email,
        address: validatedInput.address,
        city: validatedInput.city,
        state: validatedInput.state,
        postal_code: validatedInput.postal_code,
        country: validatedInput.country,
        national_id: validatedInput.national_id,
        insurance_provider: validatedInput.insurance_provider,
        insurance_number: validatedInput.insurance_number,
        emergency_contact_name: validatedInput.emergency_contact_name,
        emergency_contact_phone: validatedInput.emergency_contact_phone,
        emergency_contact_relationship: validatedInput.emergency_contact_relationship,
        allergies: validatedInput.allergies,
        chronic_conditions: validatedInput.chronic_conditions,
        medications: validatedInput.medications,
        notes: validatedInput.notes,
        avatar_url: validatedInput.avatar_url,
      })
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update patient', { error, patientId, clinicId });
      throw new DatabaseError('Failed to update patient', { error });
    }

    if (!data) {
      throw new NotFoundError('Patient not found');
    }

    logger.info('Patient updated successfully', { patientId, clinicId });
    return data as Patient;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating patient', { error, patientId, clinicId });
    throw new DatabaseError('Failed to update patient', { error });
  }
}
