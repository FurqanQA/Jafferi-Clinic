import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrintReceiptPermission } from './payment-permissions';
import { PrintableReceipt, Currency } from './payment-types';

// ============================================================================
// Print Engine
// ============================================================================

/**
 * Format currency for printing
 */
function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date for printing
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for printing
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate printable payment receipt
 */
export async function generatePrintablePaymentReceipt(paymentId: string): Promise<PrintableReceipt> {
  await validatePrintReceiptPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch payment with clinic, patient, and invoice details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        clinic:clinics!inner(name, address, phone, email),
        patient:patients!inner(first_name, last_name, address, phone),
        invoice:invoices!inner(invoice_number),
        doctor:doctors(first_name, last_name)
      `)
      .eq('id', paymentId)
      .eq('clinic_id', clinicId)
      .single();

    if (paymentError || !payment) {
      throw new NotFoundError('Payment not found');
    }

    const clinic = payment.clinic;
    const patient = payment.patient;
    const invoice = payment.invoice;
    const doctor = payment.doctor;

    const receipt: PrintableReceipt = {
      receipt_number: `RCP-${payment.payment_number}`,
      receipt_date: formatDate(payment.payment_date),
      clinic_name: clinic.name,
      clinic_address: clinic.address,
      clinic_phone: clinic.phone,
      clinic_email: clinic.email || undefined,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_address: patient.address || undefined,
      patient_phone: patient.phone || undefined,
      payment_number: payment.payment_number,
      payment_date: formatDate(payment.payment_date),
      payment_time: formatTime(payment.payment_time),
      amount: payment.amount,
      payment_method: payment.method.replace('_', ' ').toUpperCase(),
      reference_number: payment.reference_number || undefined,
      currency: payment.currency,
      notes: payment.notes || undefined,
    };

    logger.info('Printable payment receipt generated', { paymentId });
    return receipt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error generating printable receipt', { error, paymentId });
    throw new DatabaseError('Failed to generate printable receipt', { error });
  }
}

/**
 * Generate printable refund receipt
 */
export async function generatePrintableRefundReceipt(refundId: string): Promise<PrintableReceipt> {
  await validatePrintReceiptPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch refund with payment, clinic, and patient details
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .select(`
        *,
        payment:payments!inner(
          *,
          clinic:clinics!inner(name, address, phone, email),
          patient:patients!inner(first_name, last_name, address, phone),
          invoice:invoices!inner(invoice_number)
        )
      `)
      .eq('id', refundId)
      .single();

    if (refundError || !refund) {
      throw new NotFoundError('Refund not found');
    }

    const payment = refund.payment;
    const clinic = payment.clinic;
    const patient = payment.patient;
    const invoice = payment.invoice;

    const receipt: PrintableReceipt = {
      receipt_number: `REF-${refund.refund_number}`,
      receipt_date: formatDate(refund.created_at),
      clinic_name: clinic.name,
      clinic_address: clinic.address,
      clinic_phone: clinic.phone,
      clinic_email: clinic.email || undefined,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_address: patient.address || undefined,
      patient_phone: patient.phone || undefined,
      payment_number: payment.payment_number,
      payment_date: formatDate(payment.payment_date),
      payment_time: formatTime(payment.payment_time),
      amount: refund.amount,
      payment_method: 'REFUND',
      reference_number: refund.refund_number,
      currency: refund.currency,
      notes: refund.reason,
    };

    logger.info('Printable refund receipt generated', { refundId });
    return receipt;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error generating printable refund receipt', { error, refundId });
    throw new DatabaseError('Failed to generate printable refund receipt', { error });
  }
}

/**
 * Generate POS receipt format (80mm thermal printer)
 */
export function formatPOSReceipt(receipt: PrintableReceipt): string {
  const lines: string[] = [];

  lines.push('='.repeat(40));
  lines.push(receipt.clinic_name);
  lines.push(receipt.clinic_address);
  lines.push(receipt.clinic_phone);
  lines.push('='.repeat(40));
  lines.push('');
  lines.push('PAYMENT RECEIPT');
  lines.push('');
  lines.push(`Receipt No: ${receipt.receipt_number}`);
  lines.push(`Date: ${receipt.receipt_date}`);
  lines.push(`Time: ${receipt.payment_time}`);
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('PATIENT');
  lines.push('-'.repeat(40));
  lines.push(receipt.patient_name);
  if (receipt.patient_address) lines.push(receipt.patient_address);
  if (receipt.patient_phone) lines.push(receipt.patient_phone);
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('PAYMENT DETAILS');
  lines.push('-'.repeat(40));
  lines.push(`Payment No: ${receipt.payment_number}`);
  lines.push(`Method: ${receipt.payment_method}`);
  lines.push('');
  lines.push(`Amount: ${formatCurrency(receipt.amount, receipt.currency as Currency)}`);
  if (receipt.reference_number) {
    lines.push(`Reference: ${receipt.reference_number}`);
  }
  lines.push('');
  if (receipt.notes) {
    lines.push('-'.repeat(40));
    lines.push('NOTES');
    lines.push('-'.repeat(40));
    lines.push(receipt.notes);
    lines.push('');
  }
  lines.push('='.repeat(40));
  lines.push('Thank you for your payment!');
  lines.push('='.repeat(40));

  return lines.join('\n');
}

/**
 * Generate A4 receipt format
 */
export function formatA4Receipt(receipt: PrintableReceipt): string {
  const lines: string[] = [];

  lines.push(receipt.clinic_name);
  lines.push(receipt.clinic_address);
  lines.push(receipt.clinic_phone);
  if (receipt.clinic_email) lines.push(receipt.clinic_email);
  lines.push('');
  lines.push('PAYMENT RECEIPT');
  lines.push('');
  lines.push(`Receipt Number: ${receipt.receipt_number}`);
  lines.push(`Date: ${receipt.receipt_date}`);
  lines.push(`Time: ${receipt.payment_time}`);
  lines.push('');
  lines.push('Patient Information');
  lines.push(`Name: ${receipt.patient_name}`);
  if (receipt.patient_address) lines.push(`Address: ${receipt.patient_address}`);
  if (receipt.patient_phone) lines.push(`Phone: ${receipt.patient_phone}`);
  lines.push('');
  lines.push('Payment Details');
  lines.push(`Payment Number: ${receipt.payment_number}`);
  lines.push(`Payment Method: ${receipt.payment_method}`);
  lines.push(`Amount: ${formatCurrency(receipt.amount, receipt.currency as Currency)}`);
  if (receipt.reference_number) {
    lines.push(`Reference Number: ${receipt.reference_number}`);
  }
  lines.push('');
  if (receipt.notes) {
    lines.push('Notes');
    lines.push(receipt.notes);
    lines.push('');
  }
  lines.push('Thank you for your payment!');

  return lines.join('\n');
}

/**
 * Generate PDF receipt (placeholder)
 */
export async function generatePDFReceipt(receipt: PrintableReceipt): Promise<Buffer> {
  // Placeholder for PDF generation
  logger.info('PDF receipt generation requested');

  // Placeholder: Implement actual PDF generation using a library like pdfkit
  return Buffer.from('');
}

/**
 * Generate barcode (placeholder)
 */
export async function generateBarcode(text: string): Promise<string> {
  // Placeholder for barcode generation
  logger.info('Barcode generation requested', { text });

  // Placeholder: Implement actual barcode generation using a library like bwip-js
  return '';
}

/**
 * Generate QR code (placeholder)
 */
export async function generateQRCode(text: string): Promise<string> {
  // Placeholder for QR code generation
  logger.info('QR code generation requested', { text });

  // Placeholder: Implement actual QR code generation using a library like qrcode
  return '';
}

/**
 * Generate digital signature (placeholder)
 */
export async function generateDigitalSignature(): Promise<string> {
  // Placeholder for digital signature generation
  logger.info('Digital signature generation requested');

  // Placeholder: Implement actual digital signature generation
  return '';
}

/**
 * Generate settlement report (placeholder)
 */
export async function generateSettlementReport(settlementId: string): Promise<string> {
  // Placeholder for settlement report generation
  logger.info('Settlement report generation requested', { settlementId });

  // Placeholder: Implement actual settlement report generation
  return '';
}

/**
 * Generate quotation (placeholder)
 */
export async function generateQuotation(invoiceId: string): Promise<string> {
  // Placeholder for quotation generation
  logger.info('Quotation generation requested', { invoiceId });

  // Placeholder: Implement actual quotation generation
  return '';
}

/**
 * Generate estimate (placeholder)
 */
export async function generateEstimate(invoiceId: string): Promise<string> {
  // Placeholder for estimate generation
  logger.info('Estimate generation requested', { invoiceId });

  // Placeholder: Implement actual estimate generation
  return '';
}
