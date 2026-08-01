import { InvoiceItem, InvoiceCalculationResult, DiscountType } from './billing-types';

/**
 * Calculate invoice item subtotal
 */
export function calculateItemSubtotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * Calculate item discount amount
 */
export function calculateItemDiscount(
  subtotal: number,
  discount: number,
  discountType: DiscountType
): number {
  if (!discount || discount <= 0) {
    return 0;
  }

  if (discountType === 'percentage') {
    return (subtotal * discount) / 100;
  }

  return discount; // fixed_amount
}

/**
 * Calculate item tax amount
 */
export function calculateItemTax(subtotal: number, discountAmount: number, taxRate: number): number {
  if (!taxRate || taxRate <= 0) {
    return 0;
  }

  const taxableAmount = subtotal - discountAmount;
  return (taxableAmount * taxRate) / 100;
}

/**
 * Calculate item total
 */
export function calculateItemTotal(subtotal: number, discountAmount: number, taxAmount: number): number {
  return subtotal - discountAmount + taxAmount;
}

/**
 * Calculate invoice subtotal
 */
export function calculateInvoiceSubtotal(items: InvoiceItem[]): number {
  return items.reduce((total, item) => {
    const subtotal = calculateItemSubtotal(item.quantity, item.unit_price);
    return total + subtotal;
  }, 0);
}

/**
 * Calculate total discount
 */
export function calculateTotalDiscount(items: InvoiceItem[]): number {
  return items.reduce((total, item) => {
    const subtotal = calculateItemSubtotal(item.quantity, item.unit_price);
    const discount = calculateItemDiscount(subtotal, item.discount || 0, item.discount_type || 'fixed_amount');
    return total + discount;
  }, 0);
}

/**
 * Calculate total tax
 */
export function calculateTotalTax(items: InvoiceItem[]): number {
  return items.reduce((total, item) => {
    const subtotal = calculateItemSubtotal(item.quantity, item.unit_price);
    const discount = calculateItemDiscount(subtotal, item.discount || 0, item.discount_type || 'fixed_amount');
    const tax = calculateItemTax(subtotal, discount, item.tax_rate || 0);
    return total + tax;
  }, 0);
}

/**
 * Calculate grand total
 */
export function calculateGrandTotal(subtotal: number, discountTotal: number, taxTotal: number): number {
  return subtotal - discountTotal + taxTotal;
}

/**
 * Calculate remaining balance
 */
export function calculateRemainingBalance(grandTotal: number, paidAmount: number): number {
  return Math.max(0, grandTotal - paidAmount);
}

/**
 * Calculate refund amount
 */
export function calculateRefundAmount(paidAmount: number, grandTotal: number): number {
  return Math.max(0, paidAmount - grandTotal);
}

/**
 * Calculate round off amount
 */
export function calculateRoundOff(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Process invoice items with calculations
 */
export function processInvoiceItems(items: Omit<InvoiceItem, 'subtotal' | 'tax_amount' | 'total'>[]): InvoiceItem[] {
  return items.map((item) => {
    const subtotal = calculateItemSubtotal(item.quantity, item.unit_price);
    const discountAmount = calculateItemDiscount(subtotal, item.discount || 0, item.discount_type || 'fixed_amount');
    const taxAmount = calculateItemTax(subtotal, discountAmount, item.tax_rate || 0);
    const total = calculateItemTotal(subtotal, discountAmount, taxAmount);

    return {
      ...item,
      subtotal,
      tax_amount: taxAmount,
      total,
    };
  });
}

/**
 * Calculate complete invoice
 */
export function calculateInvoice(
  items: Omit<InvoiceItem, 'subtotal' | 'tax_amount' | 'total'>[],
  paidAmount: number = 0,
  applyRoundOff: boolean = true
): InvoiceCalculationResult {
  const processedItems = processInvoiceItems(items);
  const subtotal = calculateInvoiceSubtotal(processedItems);
  const discountTotal = calculateTotalDiscount(processedItems);
  const taxTotal = calculateTotalTax(processedItems);
  let grandTotal = calculateGrandTotal(subtotal, discountTotal, taxTotal);
  const remainingBalance = calculateRemainingBalance(grandTotal, paidAmount);
  const refundAmount = calculateRefundAmount(paidAmount, grandTotal);

  let roundOff = 0;
  if (applyRoundOff) {
    const roundedTotal = calculateRoundOff(grandTotal);
    roundOff = roundedTotal - grandTotal;
    grandTotal = roundedTotal;
  }

  return {
    subtotal,
    discount_total: discountTotal,
    tax_total: taxTotal,
    grand_total: grandTotal,
    paid_amount: paidAmount,
    remaining_balance: remainingBalance,
    refund_amount: refundAmount,
    round_off: roundOff,
    items: processedItems,
  };
}

/**
 * Calculate invoice with insurance coverage
 */
export function calculateInvoiceWithInsurance(
  items: Omit<InvoiceItem, 'subtotal' | 'tax_amount' | 'total'>[],
  paidAmount: number = 0,
  insuranceCoveragePercentage: number = 0,
  applyRoundOff: boolean = true
): InvoiceCalculationResult & {
  insurance_covered_amount: number;
  patient_responsibility: number;
} {
  const calculation = calculateInvoice(items, paidAmount, applyRoundOff);
  const insuranceCoveredAmount = (calculation.grand_total * insuranceCoveragePercentage) / 100;
  const patientResponsibility = calculation.grand_total - insuranceCoveredAmount;

  return {
    ...calculation,
    insurance_covered_amount: insuranceCoveredAmount,
    patient_responsibility: patientResponsibility,
  };
}

/**
 * Validate invoice calculation
 */
export function validateInvoiceCalculation(calculation: InvoiceCalculationResult): boolean {
  const { subtotal, discount_total, tax_total, grand_total, items } = calculation;

  // Validate subtotal matches items
  const calculatedSubtotal = calculateInvoiceSubtotal(items);
  if (Math.abs(subtotal - calculatedSubtotal) > 0.01) {
    return false;
  }

  // Validate discount total matches items
  const calculatedDiscount = calculateTotalDiscount(items);
  if (Math.abs(discount_total - calculatedDiscount) > 0.01) {
    return false;
  }

  // Validate tax total matches items
  const calculatedTax = calculateTotalTax(items);
  if (Math.abs(tax_total - calculatedTax) > 0.01) {
    return false;
  }

  // Validate grand total
  const calculatedGrandTotal = calculateGrandTotal(subtotal, discount_total, tax_total);
  if (Math.abs(grand_total - calculatedGrandTotal) > 0.01) {
    return false;
  }

  return true;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned);
}
