import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { randomString } from '../shared/helpers';
import { validateCreatePrescription, validateExpiryDateAfterIssueDate, validatePrescriptionDateNotPast, validateRefillCount } from './prescription-validation';
import { validateCreatePrescriptionPermission } from './prescription-permissions';
import { calculateDosage } from './dosage';
import { validateMedicationAllergies, checkContraindications } from './allergies';
import { checkAllInteractions } from './interactions';
import { CreatePrescriptionInput, Prescription } from './prescription-types';

/**
 * Create a new prescription
 */
export async function createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
  // Validate permissions
  await validateCreatePrescriptionPermission();

  // Validate input
  const validatedInput = validateCreatePrescription(input) as CreatePrescriptionInput;

  // Get clinic ID and user
  const clinicId = await getUserClinicId();
  const user = await getCurrentUser();

  // Validate dates
  validatePrescriptionDateNotPast(validatedInput.prescription_date);
  validateExpiryDateAfterIssueDate(validatedInput.issue_date, validatedInput.expiry_date);

  // Validate refill count
  const refillAllowed = validatedInput.refill_allowed ?? false;
  const refillCount = validatedInput.refill_count ?? 0;
  validateRefillCount(refillCount, refillAllowed);

  // Validate medicines
  for (const medicine of validatedInput.medicines) {
    const dosageCalc = calculateDosage(medicine);
    if (!dosageCalc.is_valid) {
      throw new Error(`Invalid dosage for ${medicine.medicine_name}: ${dosageCalc.errors?.join(', ')}`);
    }
  }

  // Check allergies
  const medicineNames = validatedInput.medicines.map(m => m.medicine_name);
  const allergyCheck = await validateMedicationAllergies(medicineNames, validatedInput.patient_id);
  if (allergyCheck.hasAllergies) {
    const warnings = allergyCheck.warnings.map(w => `${w.medicine} - ${w.allergen} (${w.severity})`).join(', ');
    throw new Error(`Allergy conflicts detected: ${warnings}`);
  }

  // Generate prescription number
  const prescriptionNumber = generatePrescriptionNumber();

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

    // Validate that appointment exists and belongs to same clinic
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

    // Validate that medical record exists and belongs to same clinic
    const { data: medicalRecord, error: medicalRecordError } = await supabase
      .from('medical_records')
      .select('id, clinic_id, patient_id, doctor_id')
      .eq('id', validatedInput.medical_record_id)
      .single();

    if (medicalRecordError || !medicalRecord) {
      throw new Error('Medical record not found');
    }

    if (medicalRecord.clinic_id !== clinicId) {
      throw new Error('Medical record belongs to another clinic');
    }

    if (medicalRecord.patient_id !== validatedInput.patient_id) {
      throw new Error('Medical record belongs to a different patient');
    }

    if (medicalRecord.doctor_id !== validatedInput.doctor_id) {
      throw new Error('Medical record belongs to a different doctor');
    }

    // Create prescription
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        clinic_id: clinicId,
        patient_id: validatedInput.patient_id,
        doctor_id: validatedInput.doctor_id,
        appointment_id: validatedInput.appointment_id,
        medical_record_id: validatedInput.medical_record_id,
        prescription_number: prescriptionNumber,
        prescription_date: validatedInput.prescription_date,
        issue_date: validatedInput.issue_date,
        expiry_date: validatedInput.expiry_date,
        status: 'draft',
        priority: validatedInput.priority || 'routine',
        medicines: validatedInput.medicines,
        notes: validatedInput.notes,
        instructions: validatedInput.instructions,
        internal_notes: validatedInput.internal_notes,
        follow_up_required: validatedInput.follow_up_required || false,
        refill_allowed: refillAllowed,
        refill_count: refillCount,
        refill_remaining: refillAllowed ? refillCount : 0,
        created_by: user.id,
        updated_by: user.id,
        version_number: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create prescription', { error, clinicId });
      throw new DatabaseError('Failed to create prescription', { error });
    }

    logger.info('Prescription created successfully', { prescriptionId: data.id, clinicId });
    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating prescription', { error, clinicId });
    throw new DatabaseError('Failed to create prescription', { error });
  }
}

/**
 * Generate a unique prescription number
 */
function generatePrescriptionNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(6).toUpperCase();
  return `RX-${timestamp}-${random}`;
}
