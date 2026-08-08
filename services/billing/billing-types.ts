/**
 * Invoice Status
 * Represents the lifecycle state of an invoice
 */
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ISSUED: 'issued',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  OVERDUE: 'overdue',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

/**
 * Valid status transitions for invoices
 */
export const VALID_INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['pending', 'cancelled', 'deleted'],
  pending: ['issued', 'cancelled', 'deleted'],
  issued: ['partially_paid', 'paid', 'overdue', 'cancelled', 'deleted'],
  partially_paid: ['paid', 'overdue', 'cancelled', 'deleted'],
  paid: ['refunded', 'archived'],
  cancelled: ['archived', 'deleted'],
  refunded: ['archived'],
  overdue: ['partially_paid', 'paid', 'cancelled', 'deleted'],
  archived: ['deleted'],
  deleted: [],
};

/**
 * Invoice Priority
 */
export const INVOICE_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type InvoicePriority = typeof INVOICE_PRIORITY[keyof typeof INVOICE_PRIORITY];

/**
 * Invoice Source
 * Where the invoice originated from
 */
export const INVOICE_SOURCE = {
  APPOINTMENT_CONSULTATION: 'appointment_consultation',
  DOCTOR_CONSULTATION: 'doctor_consultation',
  MEDICAL_PROCEDURE: 'medical_procedure',
  PRESCRIPTION: 'prescription',
  MEDICINES: 'medicines',
  LABORATORY_TESTS: 'laboratory_tests',
  DIAGNOSTIC_IMAGING: 'diagnostic_imaging',
  VACCINATION: 'vaccination',
  CERTIFICATES: 'certificates',
  CUSTOM_SERVICE: 'custom_service',
  PHARMACY_SALES: 'pharmacy_sales',
} as const;

export type InvoiceSource = typeof INVOICE_SOURCE[keyof typeof INVOICE_SOURCE];

/**
 * Invoice Item Category
 */
export const INVOICE_ITEM_CATEGORY = {
  CONSULTATION_FEE: 'consultation_fee',
  DOCTOR_FEE: 'doctor_fee',
  PROCEDURE_FEE: 'procedure_fee',
  MEDICINE_FEE: 'medicine_fee',
  LABORATORY_FEE: 'laboratory_fee',
  IMAGING_FEE: 'imaging_fee',
  VACCINATION_FEE: 'vaccination_fee',
  REGISTRATION_FEE: 'registration_fee',
  ROOM_CHARGES: 'room_charges',
  NURSING_CHARGES: 'nursing_charges',
  CUSTOM_CHARGES: 'custom_charges',
} as const;

export type InvoiceItemCategory = typeof INVOICE_ITEM_CATEGORY[keyof typeof INVOICE_ITEM_CATEGORY];

/**
 * Discount Type
 */
export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  INSURANCE_DISCOUNT: 'insurance_discount',
  MEMBERSHIP_DISCOUNT: 'membership_discount',
  COUPON: 'coupon',
  CAMPAIGN: 'campaign',
} as const;

export type DiscountType = typeof DISCOUNT_TYPE[keyof typeof DISCOUNT_TYPE];

/**
 * Tax Type
 */
export const TAX_TYPE = {
  GST: 'gst',
  VAT: 'vat',
  SALES_TAX: 'sales_tax',
  SERVICE_TAX: 'service_tax',
} as const;

export type TaxType = typeof TAX_TYPE[keyof typeof TAX_TYPE];

/**
 * Payment Terms
 */
export const PAYMENT_TERMS = {
  IMMEDIATE: 'immediate',
  NET_7: 'net_7',
  NET_15: 'net_15',
  NET_30: 'net_30',
  NET_45: 'net_45',
  NET_60: 'net_60',
  NET_90: 'net_90',
} as const;

export type PaymentTerms = typeof PAYMENT_TERMS[keyof typeof PAYMENT_TERMS];

/**
 * Currency
 */
export const CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  PKR: 'PKR',
  INR: 'INR',
  AED: 'AED',
  SAR: 'SAR',
} as const;

export type Currency = typeof CURRENCY[keyof typeof CURRENCY];

/**
 * Recurring Billing Frequency
 */
export const RECURRING_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export type RecurringFrequency = typeof RECURRING_FREQUENCY[keyof typeof RECURRING_FREQUENCY];

/**
 * Credit Note Status
 */
export const CREDIT_NOTE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  APPLIED: 'applied',
  CANCELLED: 'cancelled',
} as const;

export type CreditNoteStatus = typeof CREDIT_NOTE_STATUS[keyof typeof CREDIT_NOTE_STATUS];

/**
 * Invoice Item Interface
 */
export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  category: InvoiceItemCategory;
  quantity: number;
  unit_price: number;
  discount?: number;
  discount_type?: DiscountType;
  tax_rate?: number;
  tax_type?: TaxType;
  subtotal: number;
  tax_amount?: number;
  total: number;
  reference_id?: string;
  reference_type?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Invoice Interface
 */
export interface Invoice {
  id?: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medical_record_id?: string;
  prescription_id?: string;
  laboratory_order_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  priority: InvoicePriority;
  currency: Currency;
  exchange_rate?: number;
  payment_terms: PaymentTerms;
  source: InvoiceSource;
  source_reference_id?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  remaining_balance: number;
  refund_amount?: number;
  round_off?: number;
  billing_notes?: string;
  internal_notes?: string;
  invoice_reference?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_authorization_number?: string;
  insurance_coverage_percentage?: number;
  insurance_covered_amount?: number;
  patient_responsibility?: number;
  created_by: string;
  updated_by?: string;
  issued_by?: string;
  cancelled_by?: string;
  created_at: string;
  updated_at?: string;
  issued_at?: string;
  cancelled_at?: string;
  version_number?: number;
  is_active?: boolean;
  deleted_at?: string;
}

/**
 * Invoice Filters
 */
export interface InvoiceFilters {
  patient_id?: string;
  doctor_id?: string;
  status?: InvoiceStatus;
  priority?: InvoicePriority;
  source?: InvoiceSource;
  currency?: Currency;
  insurance_provider?: string;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  payment_status?: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  today?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  this_year?: boolean;
}

/**
 * Invoice Search Parameters
 */
export interface InvoiceSearchParams {
  query?: string;
  filters?: InvoiceFilters;
  sortBy?: InvoiceSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Invoice Sort By Options
 */
export type InvoiceSortBy =
  | 'invoice_date'
  | 'invoice_number'
  | 'due_date'
  | 'grand_total'
  | 'remaining_balance'
  | 'status'
  | 'priority'
  | 'patient_name'
  | 'doctor_name';

/**
 * Create Invoice Input
 */
export interface CreateInvoiceInput {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medical_record_id?: string;
  prescription_id?: string;
  laboratory_order_id?: string;
  invoice_date: string;
  due_date: string;
  priority: InvoicePriority;
  currency: Currency;
  exchange_rate?: number;
  payment_terms: PaymentTerms;
  source: InvoiceSource;
  source_reference_id?: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'subtotal' | 'tax_amount' | 'total' | 'created_at' | 'updated_at'>[];
  billing_notes?: string;
  internal_notes?: string;
  invoice_reference?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_authorization_number?: string;
  insurance_coverage_percentage?: number;
}

/**
 * Update Invoice Input
 */
export interface UpdateInvoiceInput {
  due_date?: string;
  priority?: InvoicePriority;
  payment_terms?: PaymentTerms;
  items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'subtotal' | 'tax_amount' | 'total' | 'created_at' | 'updated_at'>[];
  billing_notes?: string;
  internal_notes?: string;
  invoice_reference?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_authorization_number?: string;
  insurance_coverage_percentage?: number;
}

/**
 * Invoice Calculation Result
 */
export interface InvoiceCalculationResult {
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  remaining_balance: number;
  refund_amount?: number;
  round_off?: number;
  items: InvoiceItem[];
}

/**
 * Pricing Rule
 */
export interface PricingRule {
  id?: string;
  clinic_id: string;
  service_type: string;
  service_code?: string;
  default_price: number;
  doctor_id?: string;
  doctor_price?: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Discount Rule
 */
export interface DiscountRule {
  id?: string;
  clinic_id: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount?: number;
  applicable_services?: string[];
  patient_categories?: string[];
  membership_tiers?: string[];
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tax Rule
 */
export interface TaxRule {
  id?: string;
  clinic_id: string;
  tax_type: TaxType;
  tax_rate: number;
  applicable_services?: string[];
  exempt_services?: string[];
  country?: string;
  state?: string;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Insurance Claim
 */
export interface InsuranceClaim {
  id?: string;
  invoice_id: string;
  insurance_provider: string;
  policy_number: string;
  authorization_number?: string;
  claim_amount: number;
  covered_amount: number;
  patient_responsibility: number;
  claim_status: 'pending' | 'approved' | 'rejected' | 'partial';
  submitted_at?: string;
  processed_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Credit Note
 */
export interface CreditNote {
  id?: string;
  clinic_id: string;
  invoice_id: string;
  credit_note_number: string;
  credit_note_date: string;
  status: CreditNoteStatus;
  reason: string;
  amount: number;
  applied_amount?: number;
  remaining_balance?: number;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

/**
 * Recurring Billing
 */
export interface RecurringBilling {
  id?: string;
  clinic_id: string;
  patient_id: string;
  service_name: string;
  frequency: RecurringFrequency;
  amount: number;
  currency: Currency;
  next_billing_date: string;
  last_billing_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Receipt
 */
export interface Receipt {
  id?: string;
  clinic_id: string;
  invoice_id: string;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online' | 'insurance';
  payment_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

/**
 * Invoice Export Data
 */
export interface InvoiceExportData {
  invoice_number: string;
  invoice_date: string;
  patient_name: string;
  doctor_name: string;
  status: string;
  grand_total: number;
  paid_amount: number;
  remaining_balance: number;
  due_date: string;
  payment_terms: string;
  source: string;
}

/**
 * Printable Invoice
 */
export interface PrintableInvoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email?: string;
  patient_name: string;
  patient_address?: string;
  patient_phone?: string;
  doctor_name: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  remaining_balance: number;
  payment_terms: string;
  billing_notes?: string;
  currency: string;
  qr_code?: string;
  barcode?: string;
  digital_signature?: string;
}

/**
 * AI Extension Points (Placeholders)
 */
export interface AIBillingExtensions {
  revenueForecasting?: unknown;
  pricingSuggestions?: unknown;
  outstandingInvoicePrediction?: unknown;
  billingErrorDetection?: unknown;
  fraudDetection?: unknown;
  insuranceClaimAssistance?: unknown;
  financialInsights?: unknown;
}

/**
 * Future Integration Points (Placeholders)
 */
export interface BillingIntegrations {
  stripe?: unknown;
  paypal?: unknown;
  jazzCash?: unknown;
  easyPaisa?: unknown;
  bankAPIs?: unknown;
  quickBooks?: unknown;
  xero?: unknown;
  insuranceAPIs?: unknown;
  taxAPIs?: unknown;
  governmentEInvoicing?: unknown;
  fhirClaim?: unknown;
  fhirInvoice?: unknown;
  hl7FinancialMessages?: unknown;
}
