import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadPrescriptionPermission, validatePrescriptionClinicAccess } from './prescription-permissions';
import { Prescription, PrintablePrescription } from './prescription-types';

/**
 * Generate printable prescription data
 */
export async function generatePrintablePrescription(prescriptionId: string): Promise<PrintablePrescription> {
  await validateReadPrescriptionPermission();

  await validatePrescriptionClinicAccess(prescriptionId);

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get prescription with related data
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patients!inner(first_name, last_name, date_of_birth, gender, weight),
        doctors!inner(first_name, last_name, license_number, signature),
        clinics!inner(name, address, phone)
      `)
      .eq('id', prescriptionId)
      .eq('clinic_id', clinicId)
      .single();

    if (prescriptionError || !prescription) {
      throw new Error('Prescription not found');
    }

    const patient = prescription.patients as any;
    const doctor = prescription.doctors as any;
    const clinic = prescription.clinics as any;

    // Calculate patient age
    const patientAge = calculateAge(patient.date_of_birth);

    // Format medicines for printing
    const printableMedicines = prescription.medicines.map((med: any) => ({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      route: med.route,
      dose: med.dose,
      frequency: med.frequency,
      duration: med.duration,
      quantity: med.quantity,
      instructions: med.instructions,
    }));

    // Generate QR code placeholder
    const qrCode = generateQRCodePlaceholder(prescription.prescription_number);

    const printableData: PrintablePrescription = {
      prescription_number: prescription.prescription_number,
      prescription_date: prescription.prescription_date,
      issue_date: prescription.issue_date,
      expiry_date: prescription.expiry_date,
      clinic_name: clinic.name,
      clinic_address: clinic.address,
      clinic_phone: clinic.phone,
      doctor_name: `${doctor.first_name} ${doctor.last_name}`,
      doctor_license: doctor.license_number,
      doctor_signature: doctor.signature,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_age: patientAge,
      patient_gender: patient.gender,
      patient_weight: patient.weight,
      medicines: printableMedicines,
      instructions: prescription.instructions,
      notes: prescription.notes,
      follow_up_required: prescription.follow_up_required,
      qr_code: qrCode,
    };

    return printableData;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error generating printable prescription', { error, prescriptionId });
    throw new DatabaseError('Failed to generate printable prescription', { error });
  }
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return `${age} years`;
}

/**
 * Generate QR code placeholder
 */
function generateQRCodePlaceholder(prescriptionNumber: string): string {
  // TODO: Integrate with QR code generation library
  // This is a placeholder for future implementation
  return `QR_CODE_${prescriptionNumber}`;
}

/**
 * Format prescription for plain text printing
 */
export function formatPrescriptionForPrint(printable: PrintablePrescription): string {
  const lines: string[] = [];

  // Clinic header
  lines.push('═'.repeat(50));
  lines.push(printable.clinic_name.toUpperCase());
  lines.push(printable.clinic_address);
  lines.push(`Phone: ${printable.clinic_phone}`);
  lines.push('═'.repeat(50));
  lines.push('');

  // Prescription header
  lines.push('PRESCRIPTION');
  lines.push(`Prescription No: ${printable.prescription_number}`);
  lines.push(`Date: ${printable.prescription_date}`);
  lines.push(`Issue Date: ${printable.issue_date}`);
  lines.push(`Expiry Date: ${printable.expiry_date}`);
  lines.push('');

  // Patient information
  lines.push('─'.repeat(50));
  lines.push('PATIENT INFORMATION');
  lines.push(`Name: ${printable.patient_name}`);
  if (printable.patient_age) lines.push(`Age: ${printable.patient_age}`);
  if (printable.patient_gender) lines.push(`Gender: ${printable.patient_gender}`);
  if (printable.patient_weight) lines.push(`Weight: ${printable.patient_weight}`);
  lines.push('─'.repeat(50));
  lines.push('');

  // Doctor information
  lines.push('─'.repeat(50));
  lines.push('DOCTOR INFORMATION');
  lines.push(`Doctor: ${printable.doctor_name}`);
  lines.push(`License: ${printable.doctor_license}`);
  lines.push('─'.repeat(50));
  lines.push('');

  // Medicines
  lines.push('─'.repeat(50));
  lines.push('MEDICINES');
  lines.push('─'.repeat(50));

  printable.medicines.forEach((med, index) => {
    lines.push(`${index + 1}. ${med.medicine_name}`);
    if (med.generic_name) lines.push(`   Generic: ${med.generic_name}`);
    if (med.strength) lines.push(`   Strength: ${med.strength}`);
    lines.push(`   Form: ${med.dosage_form}`);
    lines.push(`   Route: ${med.route}`);
    lines.push(`   Dose: ${med.dose}`);
    lines.push(`   Frequency: ${med.frequency}`);
    lines.push(`   Duration: ${med.duration}`);
    lines.push(`   Quantity: ${med.quantity}`);
    if (med.instructions) lines.push(`   Instructions: ${med.instructions}`);
    lines.push('');
  });

  // Instructions
  if (printable.instructions) {
    lines.push('─'.repeat(50));
    lines.push('INSTRUCTIONS');
    lines.push(printable.instructions);
    lines.push('');
  }

  // Notes
  if (printable.notes) {
    lines.push('─'.repeat(50));
    lines.push('NOTES');
    lines.push(printable.notes);
    lines.push('');
  }

  // Follow-up
  if (printable.follow_up_required) {
    lines.push('─'.repeat(50));
    lines.push('⚠️ FOLLOW-UP REQUIRED');
    lines.push('');
  }

  // Footer
  lines.push('═'.repeat(50));
  lines.push('Doctor Signature: _______________________');
  lines.push(`Date: ${new Date().toISOString().split('T')[0]}`);
  lines.push('═'.repeat(50));

  return lines.join('\n');
}

/**
 * Placeholder for PDF generation
 * This function is prepared for future PDF library integration
 */
export async function generatePrescriptionPDF(printable: PrintablePrescription): Promise<Buffer> {
  // TODO: Integrate with PDF generation library (e.g., jsPDF, PDFKit)
  // This is a placeholder for future implementation
  throw new Error('PDF generation not yet implemented');
}

/**
 * Generate prescription summary for display
 */
export function generatePrescriptionSummary(prescription: Prescription): string {
  const lines: string[] = [];

  lines.push(`Prescription #${prescription.prescription_number}`);
  lines.push(`Status: ${prescription.status}`);
  lines.push(`Priority: ${prescription.priority}`);
  lines.push(`Date: ${prescription.prescription_date}`);
  lines.push(`Expiry: ${prescription.expiry_date}`);
  lines.push(`Medicines: ${prescription.medicines.length}`);
  lines.push(`Refills: ${prescription.refill_allowed ? `${prescription.refill_remaining}/${prescription.refill_count}` : 'Not allowed'}`);

  return lines.join('\n');
}

/**
 * Generate prescription label for pharmacy
 */
export function generatePharmacyLabel(prescription: Prescription): string {
  const lines: string[] = [];

  lines.push('─'.repeat(40));
  lines.push('PHARMACY LABEL');
  lines.push('─'.repeat(40));
  lines.push(`Rx #${prescription.prescription_number}`);
  lines.push(`Patient ID: ${prescription.patient_id}`);
  lines.push(`Date: ${prescription.prescription_date}`);
  lines.push(`Expiry: ${prescription.expiry_date}`);
  lines.push('');

  prescription.medicines.forEach((med, index) => {
    lines.push(`${index + 1}. ${med.medicine_name}`);
    lines.push(`   ${med.dose} - ${med.frequency} - ${med.duration}`);
    lines.push(`   Qty: ${med.quantity}`);
    if (med.instructions) lines.push(`   ${med.instructions}`);
    lines.push('');
  });

  lines.push('─'.repeat(40));

  return lines.join('\n');
}

/**
 * Placeholder for barcode generation
 * This function is prepared for future barcode library integration
 */
export function generateBarcode(prescriptionNumber: string): string {
  // TODO: Integrate with barcode generation library
  // This is a placeholder for future implementation
  return `BARCODE_${prescriptionNumber}`;
}

/**
 * Placeholder for digital signature verification
 * This function is prepared for future digital signature integration
 */
export async function verifyDigitalSignature(prescriptionId: string): Promise<{
  valid: boolean;
  verifiedAt?: string;
  error?: string;
}> {
  // TODO: Integrate with digital signature verification system
  // This is a placeholder for future implementation
  return {
    valid: false,
    error: 'Digital signature verification not yet implemented',
  };
}
