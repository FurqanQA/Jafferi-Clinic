import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { PrintableLabReport, LabOrder, LabResult, ReferenceRange } from './laboratory-types';

/**
 * Generate printable lab report data
 */
export async function generatePrintableLabReport(labOrderId: string): Promise<PrintableLabReport> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch lab order with related data
    const { data: labOrder, error: orderError } = await supabase
      .from('lab_orders')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*),
        clinic:clinics(*)
      `)
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (orderError || !labOrder) {
      logger.error('Failed to fetch lab order for print', { error: orderError, labOrderId });
      throw new DatabaseError('Failed to fetch lab order for print', { error: orderError });
    }

    // Fetch lab results
    const { data: results, error: resultsError } = await supabase
      .from('lab_results')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('test_name', { ascending: true });

    if (resultsError) {
      logger.error('Failed to fetch lab results for print', { error: resultsError, labOrderId });
      throw new DatabaseError('Failed to fetch lab results for print', { error: resultsError });
    }

    // Fetch reference ranges
    const { data: referenceRanges, error: rangesError } = await supabase
      .from('reference_ranges')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (rangesError) {
      logger.error('Failed to fetch reference ranges for print', { error: rangesError });
      throw new DatabaseError('Failed to fetch reference ranges for print', { error: rangesError });
    }

    // Fetch result review
    const { data: review, error: reviewError } = await supabase
      .from('result_reviews')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    const clinic = labOrder.clinic as any;
    const patient = labOrder.patient as any;
    const doctor = labOrder.doctor as any;

    const printableReport: PrintableLabReport = {
      order_number: labOrder.order_number,
      order_date: labOrder.order_date,
      collection_date: labOrder.collection_date,
      completion_date: labOrder.completion_date,
      clinic_name: clinic?.name || '',
      clinic_address: clinic?.address || '',
      clinic_phone: clinic?.phone || '',
      doctor_name: doctor?.name || '',
      doctor_license: doctor?.license_number || '',
      doctor_signature: review?.electronic_signature,
      patient_name: patient?.name || '',
      patient_age: patient?.date_of_birth ? calculateAge(patient.date_of_birth) : undefined,
      patient_gender: patient?.gender,
      category: labOrder.category,
      department: labOrder.department,
      specimen: labOrder.specimen,
      tests: labOrder.tests,
      results: (results || []) as LabResult[],
      reference_ranges: (referenceRanges || []) as ReferenceRange[],
      reviewed_by: review?.reviewed_by,
      approved_by: review?.approved_by,
      approval_date: review?.approved_at,
      qr_code: generateQRCode(labOrder.order_number),
    };

    return printableReport;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error generating printable lab report', { error, labOrderId });
    throw new DatabaseError('Failed to generate printable lab report', { error });
  }
}

/**
 * Format lab report for plain text printing
 */
export function formatLabReportForPlainText(report: PrintableLabReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push(report.clinic_name.toUpperCase());
  lines.push(report.clinic_address);
  lines.push(`Phone: ${report.clinic_phone}`);
  lines.push('='.repeat(80));
  lines.push('');
  lines.push('LABORATORY REPORT');
  lines.push('');
  lines.push(`Order Number: ${report.order_number}`);
  lines.push(`Order Date: ${formatDate(report.order_date)}`);
  lines.push(`Collection Date: ${report.collection_date ? formatDate(report.collection_date) : 'N/A'}`);
  lines.push(`Completion Date: ${report.completion_date ? formatDate(report.completion_date) : 'N/A'}`);
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('PATIENT INFORMATION');
  lines.push('-'.repeat(80));
  lines.push(`Name: ${report.patient_name}`);
  lines.push(`Age: ${report.patient_age || 'N/A'}`);
  lines.push(`Gender: ${report.patient_gender || 'N/A'}`);
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('TEST RESULTS');
  lines.push('-'.repeat(80));
  lines.push('');

  report.results.forEach((result, index) => {
    lines.push(`${index + 1}. ${result.test_name}`);
    lines.push(`   Result: ${formatResultValue(result.result_value, result.unit)}`);
    lines.push(`   Reference Range: ${result.reference_range || 'N/A'}`);
    if (result.result_flag && result.result_flag !== 'normal') {
      lines.push(`   Flag: ${result.result_flag.toUpperCase()}`);
    }
    lines.push('');
  });

  lines.push('-'.repeat(80));
  lines.push('REVIEW & APPROVAL');
  lines.push('-'.repeat(80));
  lines.push(`Reviewed By: ${report.reviewed_by || 'N/A'}`);
  lines.push(`Approved By: ${report.approved_by || 'N/A'}`);
  lines.push(`Approval Date: ${report.approval_date ? formatDate(report.approval_date) : 'N/A'}`);
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('End of Report');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Generate lab report summary
 */
export function generateLabReportSummary(report: PrintableLabReport): string {
  const abnormalResults = report.results.filter(r => r.is_abnormal);
  const criticalResults = report.results.filter(r => r.is_critical);

  let summary = `Lab Report ${report.order_number}\n`;
  summary += `Patient: ${report.patient_name}\n`;
  summary += `Total Tests: ${report.results.length}\n`;
  summary += `Abnormal Results: ${abnormalResults.length}\n`;
  summary += `Critical Results: ${criticalResults.length}\n`;

  if (criticalResults.length > 0) {
    summary += '\nCRITICAL VALUES:\n';
    criticalResults.forEach(r => {
      summary += `- ${r.test_name}: ${formatResultValue(r.result_value, r.unit)}\n`;
    });
  }

  return summary;
}

/**
 * Generate pharmacy label (for lab samples)
 */
export function generatePharmacyLabel(labOrderId: string): string {
  // TODO: Implement pharmacy label generation
  logger.info('Pharmacy label generation placeholder', { labOrderId });
  return `LABEL-${labOrderId}`;
}

/**
 * Generate PDF report (placeholder)
 */
export async function generatePDFReport(report: PrintableLabReport): Promise<Buffer> {
  // TODO: Implement PDF generation using a library like PDFKit or jsPDF
  logger.info('PDF report generation placeholder', { orderNumber: report.order_number });
  return Buffer.from('');
}

/**
 * Generate barcode (placeholder)
 */
export function generateBarcode(orderNumber: string): string {
  // TODO: Implement barcode generation using a library like bwip-js
  logger.info('Barcode generation placeholder', { orderNumber });
  return `BARCODE-${orderNumber}`;
}

/**
 * Generate QR code
 */
export function generateQRCode(orderNumber: string): string {
  // TODO: Implement QR code generation using a library like qrcode
  logger.info('QR code generation placeholder', { orderNumber });
  return `QR-${orderNumber}`;
}

/**
 * Verify digital signature (placeholder)
 */
export function verifyDigitalSignature(signature: string): boolean {
  // TODO: Implement digital signature verification
  logger.info('Digital signature verification placeholder', { signature });
  return true;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return `${age} years`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format result value for display
 */
function formatResultValue(value: string | number | boolean, unit?: string): string {
  if (typeof value === 'boolean') {
    return value ? 'Positive' : 'Negative';
  }
  
  if (typeof value === 'number') {
    return `${value} ${unit || ''}`.trim();
  }
  
  return `${value} ${unit || ''}`.trim();
}
