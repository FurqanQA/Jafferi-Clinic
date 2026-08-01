/**
 * Enterprise Payment Management Service - Types
 * Comprehensive type definitions for payment processing, gateways, transactions, refunds, settlements, and reconciliation
 */

// ============================================================================
// Payment Status Enum
// ============================================================================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CHARGEBACK: 'chargeback',
  EXPIRED: 'expired',
  DELETED: 'deleted',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const VALID_PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['authorized', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'deleted'],
  authorized: ['processing', 'completed', 'cancelled', 'expired'],
  processing: ['completed', 'failed', 'cancelled'],
  completed: ['refunded', 'partially_refunded', 'chargeback'],
  failed: ['pending', 'deleted'],
  cancelled: ['deleted'],
  refunded: [],
  partially_refunded: ['refunded', 'chargeback'],
  chargeback: [],
  expired: ['deleted'],
  deleted: [],
};

// ============================================================================
// Payment Method Enum
// ============================================================================

export const PAYMENT_METHOD = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  INSURANCE: 'insurance',
  JAZZCASH: 'jazzcash',
  EASYPAYSA: 'easypaisa',
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  POS_TERMINAL: 'pos_terminal',
  WALLET: 'wallet',
  MIXED_PAYMENT: 'mixed_payment',
  CUSTOM: 'custom',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ============================================================================
// Payment Gateway Enum
// ============================================================================

export const PAYMENT_GATEWAY = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  JAZZCASH: 'jazzcash',
  EASYPAYSA: 'easypaisa',
  SQUARE: 'square',
  ADYEN: 'adyen',
  AUTHORIZE_NET: 'authorize_net',
  BANK_API: 'bank_api',
  GOVERNMENT_API: 'government_api',
  MANUAL: 'manual',
} as const;

export type PaymentGateway = (typeof PAYMENT_GATEWAY)[keyof typeof PAYMENT_GATEWAY];

// ============================================================================
// Currency Enum
// ============================================================================

export const CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  PKR: 'PKR',
  INR: 'INR',
  AED: 'AED',
  SAR: 'SAR',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

// ============================================================================
// Settlement Status Enum
// ============================================================================

export const SETTLEMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type SettlementStatus = (typeof SETTLEMENT_STATUS)[keyof typeof SETTLEMENT_STATUS];

// ============================================================================
// Settlement Frequency Enum
// ============================================================================

export const SETTLEMENT_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

export type SettlementFrequency = (typeof SETTLEMENT_FREQUENCY)[keyof typeof SETTLEMENT_FREQUENCY];

// ============================================================================
// Cash Drawer Status Enum
// ============================================================================

export const CASH_DRAWER_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  LOCKED: 'locked',
} as const;

export type CashDrawerStatus = (typeof CASH_DRAWER_STATUS)[keyof typeof CASH_DRAWER_STATUS];

// ============================================================================
// Refund Status Enum
// ============================================================================

export const REFUND_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type RefundStatus = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];

// ============================================================================
// Installment Status Enum
// ============================================================================

export const INSTALLMENT_STATUS = {
  PENDING: 'pending',
  DUE: 'due',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUS)[keyof typeof INSTALLMENT_STATUS];

// ============================================================================
// Payment Link Status Enum
// ============================================================================

export const PAYMENT_LINK_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  USED: 'used',
  CANCELLED: 'cancelled',
} as const;

export type PaymentLinkStatus = (typeof PAYMENT_LINK_STATUS)[keyof typeof PAYMENT_LINK_STATUS];

// ============================================================================
// Reconciliation Status Enum
// ============================================================================

export const RECONCILIATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ADJUSTED: 'adjusted',
} as const;

export type ReconciliationStatus = (typeof RECONCILIATION_STATUS)[keyof typeof RECONCILIATION_STATUS];

// ============================================================================
// Payment Interface
// ============================================================================

export interface Payment {
  id: string;
  clinic_id: string;
  invoice_id: string;
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  payment_number: string;
  transaction_number: string;
  gateway_reference?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  gateway?: PaymentGateway;
  payment_date: string;
  payment_time: string;
  amount: number;
  currency: Currency;
  exchange_rate?: number;
  notes?: string;
  internal_notes?: string;
  reference_number?: string;
  card_last_four?: string;
  card_brand?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  drawer_id?: string;
  settlement_id?: string;
  installment_id?: string;
  payment_link_id?: string;
  created_by: string;
  updated_by?: string;
  authorized_by?: string;
  captured_by?: string;
  refunded_by?: string;
  cancelled_by?: string;
  created_at: string;
  updated_at: string;
  authorized_at?: string;
  completed_at?: string;
  refunded_at?: string;
  cancelled_at?: string;
  version_number: number;
  is_active: boolean;
  deleted_at?: string;
}

// ============================================================================
// Payment Filters Interface
// ============================================================================

export interface PaymentFilters {
  clinic_id?: string;
  patient_id?: string;
  doctor_id?: string;
  invoice_id?: string;
  appointment_id?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  gateway?: PaymentGateway;
  date_from?: string;
  date_to?: string;
  amount_from?: number;
  amount_to?: number;
  drawer_id?: string;
  settlement_id?: string;
  installment_id?: string;
  payment_link_id?: string;
  today?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  this_year?: boolean;
}

// ============================================================================
// Payment Search Params Interface
// ============================================================================

export interface PaymentSearchParams {
  query?: string;
  filters?: PaymentFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Payment Sort By Enum
// ============================================================================

export const PAYMENT_SORT_BY = {
  PAYMENT_DATE: 'payment_date',
  AMOUNT: 'amount',
  PAYMENT_NUMBER: 'payment_number',
  PATIENT_NAME: 'patient_name',
  DOCTOR_NAME: 'doctor_name',
  STATUS: 'status',
  METHOD: 'method',
  CREATED_AT: 'created_at',
} as const;

export type PaymentSortBy = (typeof PAYMENT_SORT_BY)[keyof typeof PAYMENT_SORT_BY];

// ============================================================================
// Create Payment Input Interface
// ============================================================================

export interface CreatePaymentInput {
  invoice_id: string;
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  method: PaymentMethod;
  gateway?: PaymentGateway;
  amount: number;
  currency?: Currency;
  exchange_rate?: number;
  notes?: string;
  internal_notes?: string;
  reference_number?: string;
  card_last_four?: string;
  card_brand?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  drawer_id?: string;
  installment_id?: string;
  payment_link_id?: string;
}

// ============================================================================
// Update Payment Input Interface
// ============================================================================

export interface UpdatePaymentInput {
  notes?: string;
  internal_notes?: string;
  reference_number?: string;
  gateway_reference?: string;
}

// ============================================================================
// Payment Gateway Interface
// ============================================================================

export interface PaymentGatewayConfig {
  id: string;
  clinic_id: string;
  gateway: PaymentGateway;
  is_active: boolean;
  config: Record<string, any>;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Transaction Interface
// ============================================================================

export interface Transaction {
  id: string;
  payment_id: string;
  transaction_type: 'authorization' | 'capture' | 'void' | 'refund' | 'chargeback';
  amount: number;
  currency: Currency;
  gateway_reference: string;
  status: PaymentStatus;
  gateway_response?: Record<string, any>;
  created_at: string;
  processed_at?: string;
}

// ============================================================================
// Refund Interface
// ============================================================================

export interface Refund {
  id: string;
  payment_id: string;
  refund_number: string;
  amount: number;
  currency: Currency;
  reason: string;
  status: RefundStatus;
  approved_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Settlement Interface
// ============================================================================

export interface Settlement {
  id: string;
  clinic_id: string;
  settlement_number: string;
  gateway: PaymentGateway;
  status: SettlementStatus;
  frequency: SettlementFrequency;
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: Currency;
  transaction_count: number;
  fee_amount: number;
  net_amount: number;
  settlement_date?: string;
  gateway_reference?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Cash Drawer Interface
// ============================================================================

export interface CashDrawer {
  id: string;
  clinic_id: string;
  drawer_number: string;
  status: CashDrawerStatus;
  opened_by: string;
  closed_by?: string;
  opening_balance: number;
  closing_balance?: number;
  current_balance: number;
  currency: Currency;
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

// ============================================================================
// Cash Transaction Interface
// ============================================================================

export interface CashTransaction {
  id: string;
  drawer_id: string;
  type: 'cash_in' | 'cash_out' | 'payment' | 'refund';
  amount: number;
  currency: Currency;
  description?: string;
  reference_id?: string;
  created_at: string;
  created_by: string;
}

// ============================================================================
// Installment Interface
// ============================================================================

export interface Installment {
  id: string;
  clinic_id: string;
  invoice_id: string;
  patient_id: string;
  installment_number: string;
  total_amount: number;
  currency: Currency;
  paid_amount: number;
  remaining_balance: number;
  due_date: string;
  status: InstallmentStatus;
  late_fee?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Payment Link Interface
// ============================================================================

export interface PaymentLink {
  id: string;
  clinic_id: string;
  invoice_id: string;
  link_number: string;
  url: string;
  amount: number;
  currency: Currency;
  expiry_date?: string;
  is_one_time: boolean;
  status: PaymentLinkStatus;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Reconciliation Interface
// ============================================================================

export interface Reconciliation {
  id: string;
  clinic_id: string;
  reconciliation_number: string;
  type: 'bank' | 'gateway' | 'insurance';
  start_date: string;
  end_date: string;
  status: ReconciliationStatus;
  total_transactions: number;
  matched_transactions: number;
  unmatched_transactions: number;
  total_amount: number;
  matched_amount: number;
  unmatched_amount: number;
  difference_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Receipt Interface
// ============================================================================

export interface Receipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  currency: Currency;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  created_by: string;
}

// ============================================================================
// Printable Receipt Interface
// ============================================================================

export interface PrintableReceipt {
  receipt_number: string;
  receipt_date: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email?: string;
  patient_name: string;
  patient_address?: string;
  patient_phone?: string;
  payment_number: string;
  payment_date: string;
  payment_time: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  currency: string;
  notes?: string;
  qr_code?: string;
  barcode?: string;
  digital_signature?: string;
}

// ============================================================================
// Payment Export Data Interface
// ============================================================================

export interface PaymentExportData {
  payment_number: string;
  payment_date: string;
  patient_name: string;
  doctor_name?: string;
  invoice_number: string;
  status: string;
  method: string;
  gateway?: string;
  amount: number;
  currency: string;
  reference_number?: string;
}

// ============================================================================
// AI Payment Extensions Interface (Placeholders)
// ============================================================================

export interface AIPaymentExtensions {
  fraud_detection?: {
    risk_score: number;
    is_suspicious: boolean;
    reasons: string[];
  };
  revenue_prediction?: {
    predicted_amount: number;
    confidence: number;
    timeframe: string;
  };
  payment_risk_analysis?: {
    risk_level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  late_payment_prediction?: {
    probability: number;
    expected_delay_days: number;
  };
  cash_flow_forecasting?: {
    daily_forecast: Array<{ date: string; inflow: number; outflow: number }>;
    weekly_forecast: Array<{ week: string; inflow: number; outflow: number }>;
  };
  reconciliation_assistance?: {
    suggested_matches: Array<{ local_id: string; remote_id: string; confidence: number }>;
    anomalies: string[];
  };
  collection_recommendations?: {
    priority: 'high' | 'medium' | 'low';
    method: string;
    timing: string;
    message: string;
  };
}

// ============================================================================
// Payment Integrations Interface (Placeholders)
// ============================================================================

export interface PaymentIntegrations {
  stripe?: {
    webhook_endpoint: string;
    api_version: string;
  };
  paypal?: {
    webhook_endpoint: string;
    api_version: string;
  };
  jazzcash?: {
    merchant_id: string;
    api_endpoint: string;
  };
  easypaisa?: {
    merchant_id: string;
    api_endpoint: string;
  };
  bank_apis?: {
    bank_name: string;
    api_endpoint: string;
  };
  open_banking?: {
    provider: string;
    api_endpoint: string;
  };
  quickbooks?: {
    company_id: string;
    api_endpoint: string;
  };
  xero?: {
    organization_id: string;
    api_endpoint: string;
  };
  government_epayment?: {
    api_endpoint: string;
    country: string;
  };
  fhir?: {
    payment_notice_endpoint: string;
    payment_reconciliation_endpoint: string;
  };
  hl7?: {
    financial_message_endpoint: string;
  };
  pos_devices?: {
    device_id: string;
    device_type: string;
  };
  receipt_printers?: {
    printer_id: string;
    printer_type: string;
  };
  barcode_scanners?: {
    scanner_id: string;
  };
  qr_scanners?: {
    scanner_id: string;
  };
}
