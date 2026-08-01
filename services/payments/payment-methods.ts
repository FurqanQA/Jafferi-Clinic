import { PaymentMethod, PaymentGateway } from './payment-types';

// ============================================================================
// Payment Method Configuration
// ============================================================================

/**
 * Payment method metadata
 */
export interface PaymentMethodConfig {
  method: PaymentMethod;
  name: string;
  description: string;
  supportedGateways: PaymentGateway[];
  requiresCardDetails: boolean;
  requiresBankDetails: boolean;
  requiresChequeDetails: boolean;
  supportsRefund: boolean;
  supportsPartialRefund: boolean;
  supportsAuthorization: boolean;
  supportsCapture: boolean;
  supportsVoid: boolean;
  isOnline: boolean;
  isOffline: boolean;
}

/**
 * Payment method configurations
 */
export const PAYMENT_METHOD_CONFIGS: Record<PaymentMethod, PaymentMethodConfig> = {
  cash: {
    method: 'cash',
    name: 'Cash',
    description: 'Physical cash payment',
    supportedGateways: ['manual'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: false,
    isOffline: true,
  },
  credit_card: {
    method: 'credit_card',
    name: 'Credit Card',
    description: 'Credit card payment',
    supportedGateways: ['stripe', 'paypal', 'square', 'adyen', 'authorize_net'],
    requiresCardDetails: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: true,
    isOffline: false,
  },
  debit_card: {
    method: 'debit_card',
    name: 'Debit Card',
    description: 'Debit card payment',
    supportedGateways: ['stripe', 'paypal', 'square', 'adyen', 'authorize_net'],
    requiresCardDetails: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: true,
    isOffline: false,
  },
  bank_transfer: {
    method: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Bank transfer payment',
    supportedGateways: ['bank_api', 'manual'],
    requiresCardDetails: false,
    requiresBankDetails: true,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: true,
    isOffline: true,
  },
  cheque: {
    method: 'cheque',
    name: 'Cheque',
    description: 'Cheque payment',
    supportedGateways: ['manual'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: true,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: false,
    isOffline: true,
  },
  insurance: {
    method: 'insurance',
    name: 'Insurance',
    description: 'Insurance payment',
    supportedGateways: ['manual'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: false,
    isOffline: true,
  },
  jazzcash: {
    method: 'jazzcash',
    name: 'JazzCash',
    description: 'JazzCash mobile wallet payment',
    supportedGateways: ['jazzcash'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: true,
    isOffline: false,
  },
  easypaisa: {
    method: 'easypaisa',
    name: 'EasyPaisa',
    description: 'EasyPaisa mobile wallet payment',
    supportedGateways: ['easypaisa'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: true,
    isOffline: false,
  },
  stripe: {
    method: 'stripe',
    name: 'Stripe',
    description: 'Stripe payment',
    supportedGateways: ['stripe'],
    requiresCardDetails: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: true,
    isOffline: false,
  },
  paypal: {
    method: 'paypal',
    name: 'PayPal',
    description: 'PayPal payment',
    supportedGateways: ['paypal'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: true,
    isOffline: false,
  },
  apple_pay: {
    method: 'apple_pay',
    name: 'Apple Pay',
    description: 'Apple Pay payment',
    supportedGateways: ['stripe', 'paypal'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: true,
    isOffline: false,
  },
  google_pay: {
    method: 'google_pay',
    name: 'Google Pay',
    description: 'Google Pay payment',
    supportedGateways: ['stripe', 'paypal'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: true,
    isOffline: false,
  },
  pos_terminal: {
    method: 'pos_terminal',
    name: 'POS Terminal',
    description: 'Point of Sale terminal payment',
    supportedGateways: ['manual'],
    requiresCardDetails: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: true,
    supportsCapture: true,
    supportsVoid: true,
    isOnline: false,
    isOffline: true,
  },
  wallet: {
    method: 'wallet',
    name: 'Wallet',
    description: 'Digital wallet payment',
    supportedGateways: ['jazzcash', 'easypaisa'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: true,
    isOffline: false,
  },
  mixed_payment: {
    method: 'mixed_payment',
    name: 'Mixed Payment',
    description: 'Multiple payment methods combined',
    supportedGateways: ['manual'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: true,
    supportsPartialRefund: true,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: false,
    isOffline: true,
  },
  custom: {
    method: 'custom',
    name: 'Custom',
    description: 'Custom payment method',
    supportedGateways: ['manual'],
    requiresCardDetails: false,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    supportsRefund: false,
    supportsPartialRefund: false,
    supportsAuthorization: false,
    supportsCapture: false,
    supportsVoid: false,
    isOnline: false,
    isOffline: true,
  },
};

// ============================================================================
// Payment Method Utilities
// ============================================================================

/**
 * Get payment method configuration
 */
export function getPaymentMethodConfig(method: PaymentMethod): PaymentMethodConfig {
  const config = PAYMENT_METHOD_CONFIGS[method];
  if (!config) {
    throw new Error(`Unsupported payment method: ${method}`);
  }
  return config;
}

/**
 * Check if gateway is supported for payment method
 */
export function isGatewaySupported(method: PaymentMethod, gateway: PaymentGateway): boolean {
  const config = getPaymentMethodConfig(method);
  return config.supportedGateways.includes(gateway);
}

/**
 * Get supported gateways for payment method
 */
export function getSupportedGateways(method: PaymentMethod): PaymentGateway[] {
  const config = getPaymentMethodConfig(method);
  return config.supportedGateways;
}

/**
 * Check if payment method requires card details
 */
export function requiresCardDetails(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.requiresCardDetails;
}

/**
 * Check if payment method requires bank details
 */
export function requiresBankDetails(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.requiresBankDetails;
}

/**
 * Check if payment method requires cheque details
 */
export function requiresChequeDetails(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.requiresChequeDetails;
}

/**
 * Check if payment method supports refund
 */
export function supportsRefund(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.supportsRefund;
}

/**
 * Check if payment method supports partial refund
 */
export function supportsPartialRefund(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.supportsPartialRefund;
}

/**
 * Check if payment method supports authorization
 */
export function supportsAuthorization(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.supportsAuthorization;
}

/**
 * Check if payment method supports capture
 */
export function supportsCapture(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.supportsCapture;
}

/**
 * Check if payment method supports void
 */
export function supportsVoid(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.supportsVoid;
}

/**
 * Check if payment method is online
 */
export function isOnlinePayment(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.isOnline;
}

/**
 * Check if payment method is offline
 */
export function isOfflinePayment(method: PaymentMethod): boolean {
  const config = getPaymentMethodConfig(method);
  return config.isOffline;
}

/**
 * Get all online payment methods
 */
export function getOnlinePaymentMethods(): PaymentMethod[] {
  return Object.values(PAYMENT_METHOD_CONFIGS)
    .filter(config => config.isOnline)
    .map(config => config.method);
}

/**
 * Get all offline payment methods
 */
export function getOfflinePaymentMethods(): PaymentMethod[] {
  return Object.values(PAYMENT_METHOD_CONFIGS)
    .filter(config => config.isOffline)
    .map(config => config.method);
}

/**
 * Get all refundable payment methods
 */
export function getRefundablePaymentMethods(): PaymentMethod[] {
  return Object.values(PAYMENT_METHOD_CONFIGS)
    .filter(config => config.supportsRefund)
    .map(config => config.method);
}

/**
 * Validate payment method with gateway
 */
export function validatePaymentMethodWithGateway(method: PaymentMethod, gateway: PaymentGateway): void {
  if (!isGatewaySupported(method, gateway)) {
    throw new Error(`Gateway ${gateway} is not supported for payment method ${method}`);
  }
}
