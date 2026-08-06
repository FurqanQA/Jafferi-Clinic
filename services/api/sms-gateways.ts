import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// SMS Gateways
// SMS gateway integration for sending text messages
// ============================================================================

/**
 * SMS Gateway
 */
export interface SmsGateway {
  id: string;
  name: string;
  code: string;
  apiUrl: string;
  senderId: string;
  isActive: boolean;
  supportsUnicode: boolean;
}

/**
 * SMS Message
 */
export interface SmsMessage {
  messageId: string;
  to: string;
  from?: string;
  body: string;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * SMS Response
 */
export interface SmsResponse {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  gatewayMessageId?: string;
  sentAt: string;
  deliveredAt?: string;
  failureReason?: string;
}

/**
 * SMS gateways registry
 */
const smsGateways: Map<string, SmsGateway> = new Map();

/**
 * Register SMS gateway
 */
export function registerSmsGateway(gateway: SmsGateway): void {
  smsGateways.set(gateway.code, gateway);
  logger.info('SMS gateway registered', { code: gateway.code, name: gateway.name });
}

/**
 * Get SMS gateway
 */
export function getSmsGateway(code: string): SmsGateway | null {
  return smsGateways.get(code) || null;
}

/**
 * Get all SMS gateways
 */
export function getAllSmsGateways(): SmsGateway[] {
  return Array.from(smsGateways.values());
}

/**
 * Send SMS
 */
export async function sendSms(
  message: SmsMessage,
  gatewayCode: string
): Promise<SmsResponse> {
  const gateway = getSmsGateway(gatewayCode);
  if (!gateway) {
    throw new Error(`SMS gateway not found: ${gatewayCode}`);
  }

  if (!gateway.isActive) {
    throw new Error(`SMS gateway is not active: ${gatewayCode}`);
  }

  try {
    // Placeholder for actual API call
    // In production, this would make a real API call to the SMS gateway
    await new Promise((resolve) => setTimeout(resolve, 500));

    const response: SmsResponse = {
      messageId: message.messageId,
      status: 'sent',
      gatewayMessageId: generateGatewayMessageId(),
      sentAt: new Date().toISOString(),
    };

    // Cache the SMS response
    cache.set(`sms:${message.messageId}`, JSON.stringify(response), 86400000);

    logger.info('SMS sent', { 
      messageId: message.messageId,
      gatewayCode,
      to: message.to,
      status: response.status,
    });

    return response;
  } catch (error) {
    logger.error('SMS sending failed', { error, gatewayCode });
    throw error;
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSms(
  messages: SmsMessage[],
  gatewayCode: string
): Promise<Map<string, SmsResponse>> {
  const results = new Map<string, SmsResponse>();

  for (const message of messages) {
    try {
      const response = await sendSms(message, gatewayCode);
      results.set(message.messageId, response);
    } catch (error) {
      logger.error('Bulk SMS sending failed for message', { 
        messageId: message.messageId,
        error,
      });
      results.set(message.messageId, {
        messageId: message.messageId,
        status: 'failed',
        sentAt: new Date().toISOString(),
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get SMS status
 */
export async function getSmsStatus(messageId: string): Promise<SmsResponse | null> {
  const cached = cache.get<string>(`sms:${messageId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // In production, this would query the SMS gateway API
  return null;
}

/**
 * Update SMS status
 */
export async function updateSmsStatus(
  messageId: string,
  status: SmsResponse
): Promise<void> {
  cache.set(`sms:${messageId}`, JSON.stringify(status), 86400000);
  logger.info('SMS status updated', { messageId, status: status.status });
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Basic phone number validation (E.164 format)
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phoneNumber);
}

/**
 * Format phone number to E.164
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // If already in E.164 format, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // Add country code if missing
  if (!cleaned.startsWith(countryCode.replace('+', ''))) {
    return `${countryCode}${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Validate SMS message
 */
export function validateSmsMessage(message: SmsMessage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.messageId) errors.push('Message ID is required');
  if (!message.to) errors.push('Recipient phone number is required');
  if (!message.body) errors.push('Message body is required');

  // Validate phone number format
  if (message.to && !validatePhoneNumber(message.to)) {
    errors.push('Invalid phone number format (use E.164 format: +1234567890)');
  }

  // Validate message length (standard SMS is 160 characters)
  if (message.body && message.body.length > 160) {
    errors.push('Message body exceeds 160 characters (will be split into multiple SMS)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate gateway message ID
 */
function generateGatewayMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `sms_${timestamp}_${random}`.toUpperCase();
}

/**
 * Get SMS statistics
 */
export async function getSmsStatistics(clinicId: string): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  pendingMessages: number;
  totalCost: number;
}> {
  // Placeholder for statistics
  // In production, this would query the database
  return {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    pendingMessages: 0,
    totalCost: 0,
  };
}

/**
 * Schedule SMS
 */
export async function scheduleSms(
  message: SmsMessage,
  gatewayCode: string,
  scheduledAt: string
): Promise<SmsResponse> {
  const gateway = getSmsGateway(gatewayCode);
  if (!gateway) {
    throw new Error(`SMS gateway not found: ${gatewayCode}`);
  }

  message.scheduledAt = scheduledAt;

  // Cache the scheduled message
  cache.set(`sms:scheduled:${message.messageId}`, JSON.stringify(message), 86400000 * 7);

  logger.info('SMS scheduled', { 
    messageId: message.messageId,
    gatewayCode,
    scheduledAt,
  });

  return {
    messageId: message.messageId,
    status: 'pending',
    sentAt: new Date().toISOString(),
  };
}

/**
 * Cancel scheduled SMS
 */
export async function cancelScheduledSms(messageId: string): Promise<boolean> {
  const cached = cache.get<string>(`sms:scheduled:${messageId}`);
  if (!cached) {
    return false;
  }

  cache.delete(`sms:scheduled:${messageId}`);
  logger.info('Scheduled SMS cancelled', { messageId });
  return true;
}

/**
 * Get scheduled SMS
 */
export async function getScheduledSms(clinicId?: string): Promise<SmsMessage[]> {
  const messages: SmsMessage[] = [];

  // In production, this would query the database for scheduled messages
  return messages;
}

/**
 * Webhook handler for SMS gateway
 */
export async function handleSmsWebhook(
  gatewayCode: string,
  payload: Record<string, unknown>,
  signature: string
): Promise<boolean> {
  const gateway = getSmsGateway(gatewayCode);
  if (!gateway) {
    logger.error('SMS gateway not found for webhook', { gatewayCode });
    return false;
  }

  // Placeholder for signature verification
  // In production, this would verify the webhook signature
  logger.info('SMS webhook received', { gatewayCode, payload });
  
  return true;
}
