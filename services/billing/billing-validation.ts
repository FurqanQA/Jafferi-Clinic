import { z } from 'zod';
import {
  INVOICE_STATUS,
  INVOICE_PRIORITY,
  INVOICE_SOURCE,
  INVOICE_ITEM_CATEGORY,
  DISCOUNT_TYPE,
  TAX_TYPE,
  PAYMENT_TERMS,
  CURRENCY,
  RECURRING_FREQUENCY,
  CREDIT_NOTE_STATUS,
  VALID_INVOICE_STATUS_TRANSITIONS,
  type InvoiceStatus,
  type InvoiceItemCategory,
  type DiscountType,
  type TaxType,
  type RecurringFrequency,
} from './billing-types';

/**
 * Zod schema for creating an invoice
 */
export const createInvoiceSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID format'),
  doctor_id: z.string().uuid('Invalid doctor ID format'),
  appointment_id: z.string().uuid('Invalid appointment ID format').optional(),
  medical_record_id: z.string().uuid('Invalid medical record ID format').optional(),
  prescription_id: z.string().uuid('Invalid prescription ID format').optional(),
  laboratory_order_id: z.string().uuid('Invalid laboratory order ID format').optional(),
  invoice_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), 'Invalid invoice date'),
  due_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), 'Invalid due date'),
  priority: z.nativeEnum(INVOICE_PRIORITY, { message: 'Invalid priority value' }),
  currency: z.nativeEnum(CURRENCY, { message: 'Invalid currency value' }),
  exchange_rate: z.number().positive('Exchange rate must be positive').optional(),
  payment_terms: z.nativeEnum(PAYMENT_TERMS, { message: 'Invalid payment terms' }),
  source: z.nativeEnum(INVOICE_SOURCE, { message: 'Invalid invoice source' }),
  source_reference_id: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      category: z.nativeEnum(INVOICE_ITEM_CATEGORY, { message: 'Invalid item category' }),
      quantity: z.number().positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive'),
      discount: z.number().min(0, 'Discount cannot be negative').optional(),
      discount_type: z.nativeEnum(DISCOUNT_TYPE, { message: 'Invalid discount type' }).optional(),
      tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
      tax_type: z.nativeEnum(TAX_TYPE, { message: 'Invalid tax type' }).optional(),
      reference_id: z.string().optional(),
      reference_type: z.string().optional(),
    })
  ).min(1, 'At least one invoice item is required'),
  billing_notes: z.string().optional(),
  internal_notes: z.string().optional(),
  invoice_reference: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_authorization_number: z.string().optional(),
  insurance_coverage_percentage: z.number().min(0).max(100).optional(),
});

/**
 * Zod schema for updating an invoice
 */
export const updateInvoiceSchema = z.object({
  due_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), 'Invalid due date').optional(),
  priority: z.nativeEnum(INVOICE_PRIORITY, { message: 'Invalid priority value' }).optional(),
  payment_terms: z.nativeEnum(PAYMENT_TERMS, { message: 'Invalid payment terms' }).optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      category: z.nativeEnum(INVOICE_ITEM_CATEGORY, { message: 'Invalid item category' }),
      quantity: z.number().positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive'),
      discount: z.number().min(0, 'Discount cannot be negative').optional(),
      discount_type: z.nativeEnum(DISCOUNT_TYPE, { message: 'Invalid discount type' }).optional(),
      tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
      tax_type: z.nativeEnum(TAX_TYPE, { message: 'Invalid tax type' }).optional(),
      reference_id: z.string().optional(),
      reference_type: z.string().optional(),
    })
  ).optional(),
  billing_notes: z.string().optional(),
  internal_notes: z.string().optional(),
  invoice_reference: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_authorization_number: z.string().optional(),
  insurance_coverage_percentage: z.number().min(0).max(100).optional(),
});

/**
 * Validate invoice status transition
 */
export function validateInvoiceStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): void {
  const validTransitions = VALID_INVOICE_STATUS_TRANSITIONS[currentStatus];

  if (!validTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions are: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validate invoice can be issued
 */
export function validateCanIssueInvoice(status: InvoiceStatus): void {
  if (status !== 'pending') {
    throw new Error(`Cannot issue invoice with status: ${status}. Invoice must be in pending status.`);
  }
}

/**
 * Validate invoice can be cancelled
 */
export function validateCanCancelInvoice(status: InvoiceStatus): void {
  const cancellableStatuses: InvoiceStatus[] = ['draft', 'pending', 'issued', 'partially_paid', 'overdue'];

  if (!cancellableStatuses.includes(status)) {
    throw new Error(`Cannot cancel invoice with status: ${status}. Invoice must be in draft, pending, issued, partially_paid, or overdue status.`);
  }
}

/**
 * Validate invoice can be archived
 */
export function validateCanArchiveInvoice(status: InvoiceStatus): void {
  const archivableStatuses: InvoiceStatus[] = ['paid', 'cancelled', 'refunded'];

  if (!archivableStatuses.includes(status)) {
    throw new Error(`Cannot archive invoice with status: ${status}. Invoice must be paid, cancelled, or refunded.`);
  }
}

/**
 * Validate invoice can be refunded
 */
export function validateCanRefundInvoice(status: InvoiceStatus): void {
  if (status !== 'paid') {
    throw new Error(`Cannot refund invoice with status: ${status}. Invoice must be paid.`);
  }
}

/**
 * Validate invoice date is not in the past
 */
export function validateInvoiceDateNotPast(invoiceDate: string): void {
  const invoiceDateTime = new Date(invoiceDate);
  const now = new Date();

  if (invoiceDateTime < now) {
    throw new Error('Invoice date cannot be in the past');
  }
}

/**
 * Validate due date is after invoice date
 */
export function validateDueDateAfterInvoiceDate(invoiceDate: string, dueDate: string): void {
  const invoiceDateTime = new Date(invoiceDate);
  const dueDateTime = new Date(dueDate);

  if (dueDateTime <= invoiceDateTime) {
    throw new Error('Due date must be after invoice date');
  }
}

/**
 * Validate discount amount
 */
export function validateDiscountAmount(discount: number, subtotal: number, discountType: DiscountType): void {
  if (discountType === 'percentage' && discount > 100) {
    throw new Error('Percentage discount cannot exceed 100%');
  }

  if (discountType === 'fixed_amount' && discount > subtotal) {
    throw new Error('Fixed discount amount cannot exceed subtotal');
  }
}

/**
 * Validate tax amount
 */
export function validateTaxAmount(tax: number, subtotal: number): void {
  if (tax > subtotal) {
    throw new Error('Tax amount cannot exceed subtotal');
  }
}

/**
 * Validate insurance coverage
 */
export function validateInsuranceCoverage(coveragePercentage: number, coveredAmount: number, grandTotal: number): void {
  if (coveragePercentage < 0 || coveragePercentage > 100) {
    throw new Error('Insurance coverage percentage must be between 0 and 100');
  }

  if (coveredAmount > grandTotal) {
    throw new Error('Insurance covered amount cannot exceed invoice total');
  }
}

/**
 * Validate invoice item
 */
export function validateInvoiceItem(item: any): void {
  if (!item.description || item.description.trim() === '') {
    throw new Error('Item description is required');
  }

  if (item.quantity <= 0) {
    throw new Error('Item quantity must be positive');
  }

  if (item.unit_price <= 0) {
    throw new Error('Item unit price must be positive');
  }

  if (item.discount && item.discount < 0) {
    throw new Error('Item discount cannot be negative');
  }

  if (item.tax_rate && (item.tax_rate < 0 || item.tax_rate > 100)) {
    throw new Error('Item tax rate must be between 0 and 100');
  }
}

/**
 * Validate credit note amount
 */
export function validateCreditNoteAmount(creditAmount: number, invoicePaidAmount: number): void {
  if (creditAmount > invoicePaidAmount) {
    throw new Error('Credit note amount cannot exceed the paid amount of the invoice');
  }
}

/**
 * Validate recurring billing frequency
 */
export function validateRecurringBilling(frequency: RecurringFrequency, amount: number): void {
  if (amount <= 0) {
    throw new Error('Recurring billing amount must be positive');
  }

  if (!Object.values(RECURRING_FREQUENCY).includes(frequency)) {
    throw new Error('Invalid recurring billing frequency');
  }
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(paymentAmount: number, remainingBalance: number): void {
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  if (paymentAmount > remainingBalance) {
    throw new Error('Payment amount cannot exceed remaining balance');
  }
}
