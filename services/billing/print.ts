import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReceiptPermission } from './billing-permissions';
import { Invoice, PrintableInvoice, Receipt } from './billing-types';
import { formatCurrency } from './invoice-calculator';

/**
 * Generate printable invoice data
 */
export async function generatePrintableInvoice(invoiceId: string): Promise<PrintableInvoice> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(name, address, phone),
        doctor:doctors(name),
        clinic:clinics(name, address, phone, email)
      `)
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .single();

    if (invoiceError || !invoice) {
      throw new DatabaseError('Failed to fetch invoice for printing', { error: invoiceError });
    }

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new DatabaseError('Failed to fetch invoice items for printing', { error: itemsError });
    }

    const printableInvoice: PrintableInvoice = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      clinic_name: invoice.clinic?.name || '',
      clinic_address: invoice.clinic?.address || '',
      clinic_phone: invoice.clinic?.phone || '',
      clinic_email: invoice.clinic?.email,
      patient_name: invoice.patient?.name || '',
      patient_address: invoice.patient?.address,
      patient_phone: invoice.patient?.phone,
      doctor_name: invoice.doctor?.name || '',
      items: (items || []) as any[],
      subtotal: invoice.subtotal,
      discount_total: invoice.discount_total,
      tax_total: invoice.tax_total,
      grand_total: invoice.grand_total,
      paid_amount: invoice.paid_amount,
      remaining_balance: invoice.remaining_balance,
      payment_terms: invoice.payment_terms,
      billing_notes: invoice.billing_notes,
      currency: invoice.currency,
      qr_code: '', // Placeholder for QR code generation
      barcode: '', // Placeholder for barcode generation
      digital_signature: '', // Placeholder for digital signature
    };

    return printableInvoice;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error generating printable invoice', { error, invoiceId });
    throw new DatabaseError('Failed to generate printable invoice', { error });
  }
}

/**
 * Format invoice for plain text printing
 */
export function formatInvoiceForPrint(invoice: PrintableInvoice): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(60));
  lines.push(invoice.clinic_name);
  lines.push(invoice.clinic_address);
  lines.push(`Phone: ${invoice.clinic_phone}`);
  if (invoice.clinic_email) {
    lines.push(`Email: ${invoice.clinic_email}`);
  }
  lines.push('='.repeat(60));
  lines.push('');

  // Invoice Details
  lines.push(`INVOICE #: ${invoice.invoice_number}`);
  lines.push(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`);
  lines.push(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`);
  lines.push('');

  // Patient Details
  lines.push('BILL TO:');
  lines.push(invoice.patient_name);
  if (invoice.patient_address) {
    lines.push(invoice.patient_address);
  }
  if (invoice.patient_phone) {
    lines.push(`Phone: ${invoice.patient_phone}`);
  }
  lines.push('');

  // Doctor
  lines.push(`Doctor: ${invoice.doctor_name}`);
  lines.push('');

  // Items
  lines.push('-'.repeat(60));
  lines.push('DESCRIPTION'.padEnd(30) + 'QTY'.padEnd(8) + 'PRICE'.padEnd(12) + 'TOTAL');
  lines.push('-'.repeat(60));

  invoice.items.forEach((item) => {
    const description = item.description.substring(0, 28);
    const qty = item.quantity.toString();
    const price = formatCurrency(item.unit_price, invoice.currency);
    const total = formatCurrency(item.total, invoice.currency);
    lines.push(`${description.padEnd(30)}${qty.padEnd(8)}${price.padEnd(12)}${total}`);
  });

  lines.push('-'.repeat(60));
  lines.push('');

  // Totals
  lines.push(`Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`);
  if (invoice.discount_total > 0) {
    lines.push(`Discount: -${formatCurrency(invoice.discount_total, invoice.currency)}`);
  }
  if (invoice.tax_total > 0) {
    lines.push(`Tax: ${formatCurrency(invoice.tax_total, invoice.currency)}`);
  }
  lines.push('='.repeat(60));
  lines.push(`GRAND TOTAL: ${formatCurrency(invoice.grand_total, invoice.currency)}`);
  lines.push('='.repeat(60));
  lines.push('');

  // Payment Status
  lines.push(`Paid Amount: ${formatCurrency(invoice.paid_amount, invoice.currency)}`);
  lines.push(`Remaining Balance: ${formatCurrency(invoice.remaining_balance, invoice.currency)}`);
  lines.push('');

  // Payment Terms
  lines.push(`Payment Terms: ${invoice.payment_terms.toUpperCase()}`);
  lines.push('');

  // Notes
  if (invoice.billing_notes) {
    lines.push('NOTES:');
    lines.push(invoice.billing_notes);
    lines.push('');
  }

  // Footer
  lines.push('='.repeat(60));
  lines.push('Thank you for your business!');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Generate printable receipt data
 */
export async function generatePrintableReceipt(receiptId: string): Promise<{
  receipt_number: string;
  receipt_date: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  patient_name: string;
  invoice_number: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
  currency: string;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: receipt, error } = await supabase
      .from('receipts')
      .select(`
        *,
        invoice:invoices(invoice_number, patient_id, currency),
        clinic:clinics(name, address, phone)
      `)
      .eq('id', receiptId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !receipt) {
      throw new DatabaseError('Failed to fetch receipt for printing', { error });
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('name')
      .eq('id', receipt.invoice?.patient_id)
      .single();

    return {
      receipt_number: receipt.receipt_number,
      receipt_date: receipt.receipt_date,
      clinic_name: receipt.clinic?.name || '',
      clinic_address: receipt.clinic?.address || '',
      clinic_phone: receipt.clinic?.phone || '',
      patient_name: patient?.name || '',
      invoice_number: receipt.invoice?.invoice_number || '',
      amount: receipt.amount,
      payment_method: receipt.payment_method,
      payment_reference: receipt.payment_reference,
      notes: receipt.notes,
      currency: receipt.invoice?.currency || 'USD',
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error generating printable receipt', { error, receiptId });
    throw new DatabaseError('Failed to generate printable receipt', { error });
  }
}

/**
 * Format receipt for plain text printing
 */
export function formatReceiptForPrint(receipt: any): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(50));
  lines.push('PAYMENT RECEIPT');
  lines.push('='.repeat(50));
  lines.push('');

  // Receipt Details
  lines.push(`Receipt #: ${receipt.receipt_number}`);
  lines.push(`Date: ${new Date(receipt.receipt_date).toLocaleDateString()}`);
  lines.push('');

  // Clinic
  lines.push(receipt.clinic_name);
  lines.push(receipt.clinic_address);
  lines.push(`Phone: ${receipt.clinic_phone}`);
  lines.push('');

  // Patient
  lines.push(`Received from: ${receipt.patient_name}`);
  lines.push('');

  // Payment Details
  lines.push(`Invoice #: ${receipt.invoice_number}`);
  lines.push(`Amount: ${formatCurrency(receipt.amount, receipt.currency)}`);
  lines.push(`Payment Method: ${receipt.payment_method.toUpperCase()}`);
  if (receipt.payment_reference) {
    lines.push(`Reference: ${receipt.payment_reference}`);
  }
  lines.push('');

  // Notes
  if (receipt.notes) {
    lines.push('Notes:');
    lines.push(receipt.notes);
    lines.push('');
  }

  // Footer
  lines.push('='.repeat(50));
  lines.push('Payment received successfully');
  lines.push('='.repeat(50));

  return lines.join('\n');
}

/**
 * Placeholder for PDF generation
 * Future integration with PDF generation libraries
 */
export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  // Placeholder for PDF generation
  logger.info('PDF generation requested', { invoiceId });

  throw new Error('PDF generation not yet implemented');
}

/**
 * Placeholder for QR code generation
 * Future integration with QR code libraries
 */
export async function generateInvoiceQRCode(invoiceId: string): Promise<string> {
  // Placeholder for QR code generation
  logger.info('QR code generation requested', { invoiceId });

  return '';
}

/**
 * Placeholder for barcode generation
 * Future integration with barcode libraries
 */
export async function generateInvoiceBarcode(invoiceId: string): Promise<string> {
  // Placeholder for barcode generation
  logger.info('Barcode generation requested', { invoiceId });

  return '';
}

/**
 * Placeholder for digital signature generation
 * Future integration with digital signature libraries
 */
export async function generateDigitalSignature(invoiceId: string): Promise<string> {
  // Placeholder for digital signature generation
  logger.info('Digital signature generation requested', { invoiceId });

  return '';
}

/**
 * Placeholder for quotation generation
 * Future support for quotation/estimate printing
 */
export async function generateQuotation(invoiceId: string): Promise<string> {
  // Placeholder for quotation generation
  logger.info('Quotation generation requested', { invoiceId });

  throw new Error('Quotation generation not yet implemented');
}

/**
 * Placeholder for estimate generation
 * Future support for estimate printing
 */
export async function generateEstimate(invoiceId: string): Promise<string> {
  // Placeholder for estimate generation
  logger.info('Estimate generation requested', { invoiceId });

  throw new Error('Estimate generation not yet implemented');
}
