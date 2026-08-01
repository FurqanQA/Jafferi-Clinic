import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCreateLabOrderPermission, validateLabOrderClinicAccess } from './laboratory-permissions';
import { createLabOrderSchema, validateStatusTransition } from './laboratory-validation';
import { CreateLabOrderInput, LabOrder, LAB_ORDER_STATUS } from './laboratory-types';

/**
 * Create a new laboratory order
 */
export async function createLabOrder(input: CreateLabOrderInput): Promise<LabOrder> {
  await validateCreateLabOrderPermission();

  const validatedInput = createLabOrderSchema.parse(input);
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate patient exists and belongs to clinic
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id')
      .eq('id', validatedInput.patient_id)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (patientError || !patient) {
      throw new NotFoundError('Patient not found or does not belong to your clinic');
    }

    // Validate doctor exists and belongs to clinic
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, clinic_id')
      .eq('id', validatedInput.doctor_id)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (doctorError || !doctor) {
      throw new NotFoundError('Doctor not found or does not belong to your clinic');
    }

    // Validate appointment exists and belongs to clinic
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, clinic_id, patient_id, doctor_id')
      .eq('id', validatedInput.appointment_id)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (appointmentError || !appointment) {
      throw new NotFoundError('Appointment not found or does not belong to your clinic');
    }

    // Validate appointment belongs to the same patient and doctor
    if (appointment.patient_id !== validatedInput.patient_id) {
      throw new Error('Appointment does not belong to the specified patient');
    }

    if (appointment.doctor_id !== validatedInput.doctor_id) {
      throw new Error('Appointment does not belong to the specified doctor');
    }

    // Validate medical record exists and belongs to clinic
    const { data: medicalRecord, error: medicalRecordError } = await supabase
      .from('medical_records')
      .select('id, clinic_id, patient_id')
      .eq('id', validatedInput.medical_record_id)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (medicalRecordError || !medicalRecord) {
      throw new NotFoundError('Medical record not found or does not belong to your clinic');
    }

    if (medicalRecord.patient_id !== validatedInput.patient_id) {
      throw new Error('Medical record does not belong to the specified patient');
    }

    // Validate prescription if provided
    if (validatedInput.prescription_id) {
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('id, clinic_id, patient_id, doctor_id')
        .eq('id', validatedInput.prescription_id)
        .eq('clinic_id', clinicId)
        .is('deleted_at', null)
        .single();

      if (prescriptionError || !prescription) {
        throw new NotFoundError('Prescription not found or does not belong to your clinic');
      }

      if (prescription.patient_id !== validatedInput.patient_id) {
        throw new Error('Prescription does not belong to the specified patient');
      }

      if (prescription.doctor_id !== validatedInput.doctor_id) {
        throw new Error('Prescription does not belong to the specified doctor');
      }
    }

    // Generate unique order number
    const orderNumber = await generateOrderNumber(clinicId);

    // Create lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .insert({
        clinic_id: clinicId,
        patient_id: validatedInput.patient_id,
        doctor_id: validatedInput.doctor_id,
        appointment_id: validatedInput.appointment_id,
        medical_record_id: validatedInput.medical_record_id,
        prescription_id: validatedInput.prescription_id,
        order_number: orderNumber,
        order_date: validatedInput.order_date,
        priority: validatedInput.priority,
        status: LAB_ORDER_STATUS.ORDERED,
        category: validatedInput.category,
        department: validatedInput.department,
        clinical_notes: validatedInput.clinical_notes,
        diagnosis: validatedInput.diagnosis,
        reason_for_test: validatedInput.reason_for_test,
        internal_notes: validatedInput.internal_notes,
        expected_completion_date: validatedInput.expected_completion_date,
        specimen: validatedInput.specimen,
        tests: validatedInput.tests,
        imaging: validatedInput.imaging,
        created_by: user.id,
        updated_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version_number: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create lab order', { error, input });
      throw new DatabaseError('Failed to create lab order', { error });
    }

    logger.info('Lab order created successfully', { orderId: data.id, orderNumber });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating lab order', { error, input });
    throw new DatabaseError('Failed to create lab order', { error });
  }
}

/**
 * Generate unique order number
 */
async function generateOrderNumber(clinicId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Get count of orders for today
  const { data, error } = await supabase
    .from('lab_orders')
    .select('id')
    .eq('clinic_id', clinicId)
    .gte('order_date', new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString())
    .lt('order_date', new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString());

  if (error) {
    logger.error('Failed to generate order number', { error });
    // Fallback to timestamp-based number
    return `LAB-${year}${month}${day}-${Date.now()}`;
  }

  const count = (data || []).length + 1;
  const sequence = String(count).padStart(4, '0');
  
  return `LAB-${year}${month}${day}-${sequence}`;
}
