import { z } from 'zod';
import {
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PAYMENT_GATEWAY,
  CURRENCY,
  REFUND_STATUS,
  INSTALLMENT_STATUS,
  PAYMENT_LINK_STATUS,
  SETTLEMENT_STATUS,
  SETTLEMENT_FREQUENCY,
  CASH_DRAWER_STATUS,
  VALID_PAYMENT_STATUS_TRANSITIONS,
  type PaymentStatus,
  type PaymentMethod,
  type PaymentGateway,
  type Currency,
  type RefundStatus,
  type InstallmentStatus,
  type PaymentLinkStatus,
  type SettlementStatus,
  type SettlementFrequency,
  type CashDrawerStatus,
} from './payment-types';

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Create Payment Schema
 */
export const createPaymentSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  patient_id: z.string().uuid('Invalid patient ID'),
  doctor_id: z.string().uuid('Invalid doctor ID').optional(),
  appointment_id: z.string().uuid('Invalid appointment ID').optional(),
  method: z.nativeEnum(PAYMENT_METHOD),
  gateway: z.nativeEnum(PAYMENT_GATEWAY).optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.nativeEnum(CURRENCY).default('USD'),
  exchange_rate: z.number().positive('Exchange rate must be greater than 0').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  internal_notes: z.string().max(1000, 'Internal notes must be less than 1000 characters').optional(),
  reference_number: z.string().max(100, 'Reference number must be less than 100 characters').optional(),
  card_last_four: z.string().length(4, 'Card last four must be exactly 4 digits').optional(),
  card_brand: z.string().max(50, 'Card brand must be less than 50 characters').optional(),
  bank_name: z.string().max(100, 'Bank name must be less than 100 characters').optional(),
  cheque_number: z.string().max(50, 'Cheque number must be less than 50 characters').optional(),
  cheque_date: z.string().optional(),
  drawer_id: z.string().uuid('Invalid drawer ID').optional(),
  installment_id: z.string().uuid('Invalid installment ID').optional(),
  payment_link_id: z.string().uuid('Invalid payment link ID').optional(),
});

/**
 * Update Payment Schema
 */
export const updatePaymentSchema = z.object({
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  internal_notes: z.string().max(1000, 'Internal notes must be less than 1000 characters').optional(),
  reference_number: z.string().max(100, 'Reference number must be less than 100 characters').optional(),
  gateway_reference: z.string().max(255, 'Gateway reference must be less than 255 characters').optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate payment status transition
 */
export function validatePaymentStatusTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): void {
  const validTransitions = VALID_PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];
  if (!validTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number, currency: Currency = 'USD'): void {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  if (amount > 999999999.99) {
    throw new Error('Payment amount exceeds maximum allowed value');
  }
}

/**
 * Validate refund amount
 */
export function validateRefundAmount(refundAmount: number, originalAmount: number, alreadyRefunded: number = 0): void {
  if (refundAmount <= 0) {
    throw new Error('Refund amount must be greater than 0');
  }
  const remainingRefundable = originalAmount - alreadyRefunded;
  if (refundAmount > remainingRefundable) {
    throw new Error(`Refund amount (${refundAmount}) cannot exceed remaining refundable amount (${remainingRefundable})`);
  }
}

/**
 * Validate installment amount
 */
export function validateInstallmentAmount(installmentAmount: number, totalAmount: number): void {
  if (installmentAmount <= 0) {
    throw new Error('Installment amount must be greater than 0');
  }
  if (installmentAmount > totalAmount) {
    throw new Error('Installment amount cannot exceed total amount');
  }
}

/**
 * Validate installment totals
 */
export function validateInstallmentTotals(installments: Array<{ amount: number }>, totalAmount: number): void {
  const totalInstallments = installments.reduce((sum, installment) => sum + installment.amount, 0);
  if (Math.abs(totalInstallments - totalAmount) > 0.01) {
    throw new Error(`Installment totals (${totalInstallments}) must equal total amount (${totalAmount})`);
  }
}

/**
 * Validate payment method
 */
export function validatePaymentMethod(method: PaymentMethod, gateway?: PaymentGateway): void {
  const gatewaysByMethod: Record<PaymentMethod, PaymentGateway[]> = {
    cash: [],
    credit_card: ['stripe', 'paypal', 'square', 'adyen', 'authorize_net'],
    debit_card: ['stripe', 'paypal', 'square', 'adyen', 'authorize_net'],
    bank_transfer: ['bank_api', 'manual'],
    cheque: ['manual'],
    insurance: ['manual'],
    jazzcash: ['jazzcash'],
    easypaisa: ['easypaisa'],
    stripe: ['stripe'],
    paypal: ['paypal'],
    apple_pay: ['stripe', 'paypal'],
    google_pay: ['stripe', 'paypal'],
    pos_terminal: ['manual'],
    wallet: ['jazzcash', 'easypaisa'],
    mixed_payment: [],
    custom: ['manual'],
  };

  if (gateway) {
    const validGateways = gatewaysByMethod[method] || [];
    if (validGateways.length > 0 && !validGateways.includes(gateway)) {
      throw new Error(`Gateway ${gateway} is not valid for payment method ${method}`);
    }
  }
}

/**
 * Validate card details
 */
export function validateCardDetails(cardLastFour?: string, cardBrand?: string): void {
  if (cardLastFour && !/^\d{4}$/.test(cardLastFour)) {
    throw new Error('Card last four must be exactly 4 digits');
  }
  if (cardBrand && cardBrand.length > 50) {
    throw new Error('Card brand must be less than 50 characters');
  }
}

/**
 * Validate cheque details
 */
export function validateChequeDetails(chequeNumber?: string, chequeDate?: string): void {
  if (chequeNumber && chequeNumber.length > 50) {
    throw new Error('Cheque number must be less than 50 characters');
  }
  if (chequeDate && isNaN(Date.parse(chequeDate))) {
    throw new Error('Cheque date must be a valid date');
  }
}

/**
 * Validate cash drawer status
 */
export function validateCashDrawerStatus(status: CashDrawerStatus): void {
  if (!Object.values(CASH_DRAWER_STATUS).includes(status)) {
    throw new Error(`Invalid cash drawer status: ${status}`);
  }
}

/**
 * Validate cash drawer balance
 */
export function validateCashDrawerBalance(balance: number): void {
  if (balance < 0) {
    throw new Error('Cash drawer balance cannot be negative');
  }
}

/**
 * Validate settlement status
 */
export function validateSettlementStatus(status: SettlementStatus): void {
  if (!Object.values(SETTLEMENT_STATUS).includes(status)) {
    throw new Error(`Invalid settlement status: ${status}`);
  }
}

/**
 * Validate refund status
 */
export function validateRefundStatus(status: RefundStatus): void {
  if (!Object.values(REFUND_STATUS).includes(status)) {
    throw new Error(`Invalid refund status: ${status}`);
  }
}

/**
 * Validate installment status
 */
export function validateInstallmentStatus(status: InstallmentStatus): void {
  if (!Object.values(INSTALLMENT_STATUS).includes(status)) {
    throw new Error(`Invalid installment status: ${status}`);
  }
}

/**
 * Validate payment link status
 */
export function validatePaymentLinkStatus(status: PaymentLinkStatus): void {
  if (!Object.values(PAYMENT_LINK_STATUS).includes(status)) {
    throw new Error(`Invalid payment link status: ${status}`);
  }
}

/**
 * Validate payment link expiry
 */
export function validatePaymentLinkExpiry(expiryDate?: string): void {
  if (expiryDate && new Date(expiryDate) < new Date()) {
    throw new Error('Payment link expiry date must be in the future');
  }
}

/**
 * Validate settlement frequency
 */
export function validateSettlementFrequency(frequency: SettlementFrequency): void {
  if (!Object.values(SETTLEMENT_FREQUENCY).includes(frequency)) {
    throw new Error(`Invalid settlement frequency: ${frequency}`);
  }
}

/**
 * Validate overpayment prevention
 */
export function validateOverpayment(paymentAmount: number, invoiceTotal: number, alreadyPaid: number = 0): void {
  const remainingBalance = invoiceTotal - alreadyPaid;
  if (paymentAmount > remainingBalance) {
    throw new Error(`Payment amount (${paymentAmount}) exceeds remaining balance (${remainingBalance})`);
  }
}

/**
 * Validate transaction number uniqueness (placeholder for actual implementation)
 */
export function validateTransactionNumberUniqueness(transactionNumber: string): void {
  // Placeholder for duplicate transaction detection
  // This would typically check the database for existing transaction numbers
}

/**
 * Validate payment date
 */
export function validatePaymentDate(paymentDate: string): void {
  const date = new Date(paymentDate);
  if (isNaN(date.getTime())) {
    throw new Error('Payment date must be a valid date');
  }
  if (date > new Date()) {
    throw new Error('Payment date cannot be in the future');
  }
}

/**
 * Validate exchange rate
 */
export function validateExchangeRate(exchangeRate?: number): void {
  if (exchangeRate !== undefined && exchangeRate <= 0) {
    throw new Error('Exchange rate must be greater than 0');
  }
}

/**
 * Validate currency
 */
export function validateCurrency(currency: Currency): void {
  if (!Object.values(CURRENCY).includes(currency)) {
    throw new Error(`Invalid currency: ${currency}`);
  }
}

/**
 * Validate reference number format
 */
export function validateReferenceNumber(referenceNumber?: string): void {
  if (referenceNumber && referenceNumber.length > 100) {
    throw new Error('Reference number must be less than 100 characters');
  }
}

/**
 * Validate notes length
 */
export function validateNotes(notes?: string): void {
  if (notes && notes.length > 1000) {
    throw new Error('Notes must be less than 1000 characters');
  }
}
