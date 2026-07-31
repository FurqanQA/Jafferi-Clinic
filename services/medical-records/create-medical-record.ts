import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { randomString } from '../shared/helpers';
import { validateCreateMedicalRecord, validateVisitDateNotFuture } from './medical-record-validation';
import { validateCreateMedicalRecordPermission } from './medical-record-permissions';
import { calculateCompleteVitals } from './vitals';
import { CreateMedicalRecordInput, MedicalRecord } from './medical-record-types';

/**
 * Create a new medical record
 */
export async function createMedicalRecord(input: CreateMedicalRecordInput): Promise<MedicalRecord> {
  // Validate permissions
  await validateCreateMedicalRecordPermission();

  // Validate input
  const validatedInput = validateCreateMedicalRecord(input) as CreateMedicalRecordInput;

  // Get clinic ID and user
  const clinicId = await getUserClinicId();
  const user = await getCurrentUser();

  // Validate visit date is not in the past (for new records)
  validateVisitDateNotFuture(validatedInput.visit_date, true);

  // Calculate vitals with BMI if provided
  const processedVitals = validatedInput.vitals 
    ? calculateCompleteVitals(validatedInput.vitals)
    : undefined;

  // Generate medical record number
  const medicalRecordNumber = generateMedicalRecordNumber();

  const supabase = getSupabaseClient();

  try {
    // Validate that patient exists and belongs to same clinic
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id')
      .eq('id', validatedInput.patient_id)
      .single();

    if (patientError || !patient) {
      throw new Error('Patient not found');
    }

    if (patient.clinic_id !== clinicId) {
      throw new Error('Patient belongs to another clinic');
    }

    // Validate that doctor exists and belongs to same clinic
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, clinic_id')
      .eq('id', validatedInput.doctor_id)
      .single();

    if (doctorError || !doctor) {
      throw new Error('Doctor not found');
    }

    if (doctor.clinic_id !== clinicId) {
      throw new Error('Doctor belongs to another clinic');
    }

    // Validate appointment if provided
    if (validatedInput.appointment_id) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, clinic_id, patient_id, doctor_id')
        .eq('id', validatedInput.appointment_id)
        .single();

      if (appointmentError || !appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.clinic_id !== clinicId) {
        throw new Error('Appointment belongs to another clinic');
      }

      if (appointment.patient_id !== validatedInput.patient_id) {
        throw new Error('Appointment belongs to a different patient');
      }

      if (appointment.doctor_id !== validatedInput.doctor_id) {
        throw new Error('Appointment belongs to a different doctor');
      }
    }

    // Create medical record
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        clinic_id: clinicId,
        patient_id: validatedInput.patient_id,
        doctor_id: validatedInput.doctor_id,
        appointment_id: validatedInput.appointment_id,
        medical_record_number: medicalRecordNumber,
        status: 'draft',
        visit_date: validatedInput.visit_date,
        visit_time: validatedInput.visit_time,
        visit_type: validatedInput.visit_type,
        department_id: validatedInput.department_id,
        chief_complaint: validatedInput.chief_complaint,
        reason_for_visit: validatedInput.reason_for_visit,
        duration: validatedInput.duration,
        history: validatedInput.history,
        vitals: processedVitals,
        physical_examination: validatedInput.physical_examination,
        soap_notes: validatedInput.soap_notes,
        diagnosis: validatedInput.diagnosis,
        treatment_plan: validatedInput.treatment_plan,
        follow_up: validatedInput.follow_up,
        created_by: user.id,
        version_number: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create medical record', { error, clinicId });
      throw new DatabaseError('Failed to create medical record', { error });
    }

    logger.info('Medical record created successfully', { medicalRecordId: data.id, clinicId });
    return data as MedicalRecord;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating medical record', { error, clinicId });
    throw new DatabaseError('Failed to create medical record', { error });
  }
}

/**
 * Generate a unique medical record number
 */
function generateMedicalRecordNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(6).toUpperCase();
  return `MR-${timestamp}-${random}`;
}
