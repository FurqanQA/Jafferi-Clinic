import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// Payment Gateways
// Payment gateway integration for processing payments
// ============================================================================

/**
 * Payment Gateway
 */
export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  apiUrl: string;
  isActive: boolean;
  supportsRefunds: boolean;
  supportsRecurring: boolean;
}

/**
 * Payment Request
 */
export interface PaymentRequest {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  currency: string;
  processedAt: string;
  failureReason?: string;
}

/**
 * Refund Request
 */
export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}

/**
 * Refund Response
 */
export interface RefundResponse {
  refundId: string;
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  processedAt: string;
  failureReason?: string;
}

/**
 * Payment gateways registry
 */
const paymentGateways: Map<string, PaymentGateway> = new Map();

/**
 * Register payment gateway
 */
export function registerPaymentGateway(gateway: PaymentGateway): void {
  paymentGateways.set(gateway.code, gateway);
  logger.info('Payment gateway registered', { code: gateway.code, name: gateway.name });
}

/**
 * Get payment gateway
 */
export function getPaymentGateway(code: string): PaymentGateway | null {
  return paymentGateways.get(code) || null;
}

/**
 * Get all payment gateways
 */
export function getAllPaymentGateways(): PaymentGateway[] {
  return Array.from(paymentGateways.values());
}

/**
 * Process payment
 */
export async function processPayment(
  request: PaymentRequest,
  gatewayCode: string
): Promise<PaymentResponse> {
  const gateway = getPaymentGateway(gatewayCode);
  if (!gateway) {
    throw new Error(`Payment gateway not found: ${gatewayCode}`);
  }

  if (!gateway.isActive) {
    throw new Error(`Payment gateway is not active: ${gatewayCode}`);
  }

  try {
    // Placeholder for actual API call
    // In production, this would make a real API call to the payment gateway
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response: PaymentResponse = {
      paymentId: request.paymentId,
      status: 'completed',
      transactionId: generateTransactionId(),
      amount: request.amount,
      currency: request.currency,
      processedAt: new Date().toISOString(),
    };

    // Cache the payment response
    cache.set(`payment:${request.paymentId}`, JSON.stringify(response), 86400000);

    logger.info('Payment processed', { 
      paymentId: request.paymentId,
      gatewayCode,
      amount: request.amount,
      status: response.status,
    });

    return response;
  } catch (error) {
    logger.error('Payment processing failed', { error, gatewayCode });
    throw error;
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse | null> {
  const cached = cache.get<string>(`payment:${paymentId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // In production, this would query the payment gateway API
  return null;
}

/**
 * Process refund
 */
export async function processRefund(
  request: RefundRequest,
  gatewayCode: string
): Promise<RefundResponse> {
  const gateway = getPaymentGateway(gatewayCode);
  if (!gateway) {
    throw new Error(`Payment gateway not found: ${gatewayCode}`);
  }

  if (!gateway.supportsRefunds) {
    throw new Error(`Payment gateway does not support refunds: ${gatewayCode}`);
  }

  try {
    // Placeholder for actual API call
    // In production, this would make a real API call to the payment gateway
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response: RefundResponse = {
      refundId: crypto.randomUUID(),
      paymentId: request.paymentId,
      status: 'completed',
      amount: request.amount,
      currency: 'USD',
      processedAt: new Date().toISOString(),
    };

    // Cache the refund response
    cache.set(`refund:${response.refundId}`, JSON.stringify(response), 86400000);

    logger.info('Refund processed', { 
      refundId: response.refundId,
      paymentId: request.paymentId,
      gatewayCode,
      amount: request.amount,
    });

    return response;
  } catch (error) {
    logger.error('Refund processing failed', { error, gatewayCode });
    throw error;
  }
}

/**
 * Get refund status
 */
export async function getRefundStatus(refundId: string): Promise<RefundResponse | null> {
  const cached = cache.get<string>(`refund:${refundId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // In production, this would query the payment gateway API
  return null;
}

/**
 * Validate payment request
 */
export function validatePaymentRequest(request: PaymentRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.paymentId) errors.push('Payment ID is required');
  if (!request.amount || request.amount <= 0) errors.push('Amount must be greater than 0');
  if (!request.currency) errors.push('Currency is required');
  if (!request.description) errors.push('Description is required');
  if (!request.customerId) errors.push('Customer ID is required');

  // Validate currency code (3-letter ISO code)
  if (request.currency && !/^[A-Z]{3}$/.test(request.currency)) {
    errors.push('Invalid currency code format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate refund request
 */
export function validateRefundRequest(request: RefundRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.paymentId) errors.push('Payment ID is required');
  if (!request.amount || request.amount <= 0) errors.push('Amount must be greater than 0');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `txn_${timestamp}_${random}`.toUpperCase();
}

/**
 * Get payment statistics
 */
export async function getPaymentStatistics(clinicId: string): Promise<{
  totalPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalAmount: number;
  refundedAmount: number;
}> {
  // Placeholder for statistics
  // In production, this would query the database
  return {
    totalPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalAmount: 0,
    refundedAmount: 0,
  };
}

/**
 * Create payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId: string,
  gatewayCode: string
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> {
  const gateway = getPaymentGateway(gatewayCode);
  if (!gateway) {
    throw new Error(`Payment gateway not found: ${gatewayCode}`);
  }

  // Placeholder for actual API call
  // In production, this would create a payment intent with the gateway
  const paymentIntentId = crypto.randomUUID();
  const clientSecret = generateTransactionId();

  logger.info('Payment intent created', { 
    paymentIntentId,
    gatewayCode,
    amount,
    currency,
  });

  return {
    clientSecret,
    paymentIntentId,
  };
}

/**
 * Webhook handler for payment gateway
 */
export async function handlePaymentWebhook(
  gatewayCode: string,
  payload: Record<string, unknown>,
  signature: string
): Promise<boolean> {
  const gateway = getPaymentGateway(gatewayCode);
  if (!gateway) {
    logger.error('Payment gateway not found for webhook', { gatewayCode });
    return false;
  }

  // Placeholder for signature verification
  // In production, this would verify the webhook signature
  logger.info('Payment webhook received', { gatewayCode, payload });
  
  return true;
}
