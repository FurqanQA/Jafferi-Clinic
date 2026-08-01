import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCreateInvoicePermission } from './billing-permissions';
import { createInvoiceSchema, validateDueDateAfterInvoiceDate } from './billing-validation';
import { calculateInvoice } from './invoice-calculator';
import { Invoice, CreateInvoiceInput } from './billing-types';

/**
 * Generate invoice number
 */
export async function generateInvoiceNumber(clinicId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('clinic_id', clinicId)
    .like('invoice_number', `INV-${datePrefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    logger.error('Failed to generate invoice number', { error });
    throw new DatabaseError('Failed to generate invoice number', { error });
  }

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }

  return `INV-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Create invoice
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  await validateCreateInvoicePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate input using Zod schema
    const validatedInput = createInvoiceSchema.parse(input);

    // Validate due date is after invoice date
    validateDueDateAfterInvoiceDate(validatedInput.invoice_date, validatedInput.due_date);

    // Validate patient exists and belongs to clinic
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', validatedInput.patient_id)
      .eq('clinic_id', clinicId)
      .single();

    if (patientError || !patient) {
      throw new NotFoundError('Patient not found or does not belong to this clinic');
    }

    // Validate doctor exists and belongs to clinic
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', validatedInput.doctor_id)
      .eq('clinic_id', clinicId)
      .single();

    if (doctorError || !doctor) {
      throw new NotFoundError('Doctor not found or does not belong to this clinic');
    }

    // Validate optional references if provided
    if (validatedInput.appointment_id) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', validatedInput.appointment_id)
        .eq('clinic_id', clinicId)
        .single();

      if (appointmentError || !appointment) {
        throw new NotFoundError('Appointment not found or does not belong to this clinic');
      }
    }

    if (validatedInput.medical_record_id) {
      const { data: medicalRecord, error: medicalRecordError } = await supabase
        .from('medical_records')
        .select('id')
        .eq('id', validatedInput.medical_record_id)
        .eq('clinic_id', clinicId)
        .single();

      if (medicalRecordError || !medicalRecord) {
        throw new NotFoundError('Medical record not found or does not belong to this clinic');
      }
    }

    if (validatedInput.prescription_id) {
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('id', validatedInput.prescription_id)
        .eq('clinic_id', clinicId)
        .single();

      if (prescriptionError || !prescription) {
        throw new NotFoundError('Prescription not found or does not belong to this clinic');
      }
    }

    if (validatedInput.laboratory_order_id) {
      const { data: labOrder, error: labOrderError } = await supabase
        .from('lab_orders')
        .select('id')
        .eq('id', validatedInput.laboratory_order_id)
        .eq('clinic_id', clinicId)
        .single();

      if (labOrderError || !labOrder) {
        throw new NotFoundError('Laboratory order not found or does not belong to this clinic');
      }
    }

    // Calculate invoice totals
    const calculation = calculateInvoice(validatedInput.items, 0, true);

    // Calculate insurance coverage if provided
    let insuranceCoveredAmount = 0;
    let patientResponsibility = calculation.grand_total;

    if (validatedInput.insurance_coverage_percentage) {
      insuranceCoveredAmount = (calculation.grand_total * validatedInput.insurance_coverage_percentage) / 100;
      patientResponsibility = calculation.grand_total - insuranceCoveredAmount;
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(clinicId);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: validatedInput.patient_id,
        doctor_id: validatedInput.doctor_id,
        appointment_id: validatedInput.appointment_id,
        medical_record_id: validatedInput.medical_record_id,
        prescription_id: validatedInput.prescription_id,
        laboratory_order_id: validatedInput.laboratory_order_id,
        invoice_number: invoiceNumber,
        invoice_date: validatedInput.invoice_date,
        due_date: validatedInput.due_date,
        status: 'draft',
        priority: validatedInput.priority,
        currency: validatedInput.currency,
        exchange_rate: validatedInput.exchange_rate,
        payment_terms: validatedInput.payment_terms,
        source: validatedInput.source,
        source_reference_id: validatedInput.source_reference_id,
        items: calculation.items,
        subtotal: calculation.subtotal,
        discount_total: calculation.discount_total,
        tax_total: calculation.tax_total,
        grand_total: calculation.grand_total,
        paid_amount: 0,
        remaining_balance: calculation.grand_total,
        round_off: calculation.round_off,
        billing_notes: validatedInput.billing_notes,
        internal_notes: validatedInput.internal_notes,
        invoice_reference: validatedInput.invoice_reference,
        insurance_provider: validatedInput.insurance_provider,
        insurance_policy_number: validatedInput.insurance_policy_number,
        insurance_authorization_number: validatedInput.insurance_authorization_number,
        insurance_coverage_percentage: validatedInput.insurance_coverage_percentage,
        insurance_covered_amount: insuranceCoveredAmount,
        patient_responsibility: patientResponsibility,
        created_by: user.id,
        created_at: new Date().toISOString(),
        version_number: 1,
        is_active: true,
      })
      .select()
      .single();

    if (invoiceError) {
      logger.error('Failed to create invoice', { error: invoiceError });
      throw new DatabaseError('Failed to create invoice', { error: invoiceError });
    }

    logger.info('Invoice created successfully', { invoiceNumber, patientId: validatedInput.patient_id });
    return invoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating invoice', { error });
    throw new DatabaseError('Failed to create invoice', { error });
  }
}
