import { logger } from '../shared/logger';
import { SMSProvider } from './notification-types';

// ============================================================================
// SMS Provider
// Adapters for various SMS service providers
// All implementations are placeholders for future integration
// ============================================================================

/**
 * SMS message interface
 */
export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
  metadata?: Record<string, any>;
}

/**
 * SMS response interface
 */
export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

// ============================================================================
// Twilio Provider (Placeholder)
// ============================================================================

/**
 * Send SMS via Twilio
 */
export async function sendViaTwilio(message: SMSMessage, config: {
  accountSid: string;
  authToken: string;
  from: string;
}): Promise<SMSResponse> {
  try {
    // Placeholder for Twilio API integration
    // In production, use the Twilio SDK
    logger.info('Twilio SMS send requested', { to: message.to, body: message.body });

    return {
      success: true,
      messageId: `twilio_${Date.now()}`,
      provider: 'twilio',
    };
  } catch (error) {
    logger.error('Failed to send SMS via Twilio', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'twilio',
    };
  }
}

// ============================================================================
// Vonage Provider (Placeholder)
// ============================================================================

/**
 * Send SMS via Vonage (formerly Nexmo)
 */
export async function sendViaVonage(message: SMSMessage, config: {
  apiKey: string;
  apiSecret: string;
  from: string;
}): Promise<SMSResponse> {
  try {
    // Placeholder for Vonage API integration
    // In production, use the Vonage SDK
    logger.info('Vonage SMS send requested', { to: message.to, body: message.body });

    return {
      success: true,
      messageId: `vonage_${Date.now()}`,
      provider: 'vonage',
    };
  } catch (error) {
    logger.error('Failed to send SMS via Vonage', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'vonage',
    };
  }
}

// ============================================================================
// AWS SNS Provider (Placeholder)
// ============================================================================

/**
 * Send SMS via AWS SNS
 */
export async function sendViaAWSSNS(message: SMSMessage, config: {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}): Promise<SMSResponse> {
  try {
    // Placeholder for AWS SNS integration
    // In production, use the AWS SDK for JavaScript
    logger.info('AWS SNS SMS send requested', { to: message.to, body: message.body });

    return {
      success: true,
      messageId: `sns_${Date.now()}`,
      provider: 'aws_sns',
    };
  } catch (error) {
    logger.error('Failed to send SMS via AWS SNS', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'aws_sns',
    };
  }
}

// ============================================================================
// Local Provider (Placeholder for development/testing)
// ============================================================================

/**
 * Send SMS via local provider (logs to console)
 */
export async function sendViaLocal(message: SMSMessage): Promise<SMSResponse> {
  try {
    logger.info('Local SMS send', { to: message.to, body: message.body });
    console.log(`[SMS] To: ${message.to}, Body: ${message.body}`);

    return {
      success: true,
      messageId: `local_${Date.now()}`,
      provider: 'local',
    };
  } catch (error) {
    logger.error('Failed to send SMS via local provider', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'local',
    };
  }
}

// ============================================================================
// Unified SMS Sender
// ============================================================================

/**
 * Send SMS using configured provider
 */
export async function sendSMS(
  message: SMSMessage,
  provider: SMSProvider,
  config: any
): Promise<SMSResponse> {
  switch (provider) {
    case 'twilio':
      return await sendViaTwilio(message, config);
    case 'vonage':
      return await sendViaVonage(message, config);
    case 'aws_sns':
      return await sendViaAWSSNS(message, config);
    case 'local':
      return await sendViaLocal(message);
    default:
      logger.error('Unsupported SMS provider', { provider });
      return {
        success: false,
        error: `Unsupported SMS provider: ${provider}`,
      };
  }
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic phone number validation
  // Accepts international format with + and digits
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate SMS message
 */
export function validateSMSMessage(message: SMSMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!message.to) {
    errors.push('Recipient phone number is required');
  } else if (!validatePhoneNumber(message.to)) {
    errors.push('Invalid phone number format (use international format: +1234567890)');
  }

  if (!message.body) {
    errors.push('Message body is required');
  } else if (message.body.length > 1600) {
    errors.push('Message body exceeds maximum length of 1600 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '');

  // Ensure starts with +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }

  return formatted;
}

/**
 * Truncate SMS message to fit within character limit
 */
export function truncateSMSMessage(message: string, maxLength: number = 1600): string {
  if (message.length <= maxLength) {
    return message;
  }

  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Calculate SMS segments (for multi-part messages)
 */
export function calculateSMSSegments(message: string): number {
  const segmentLength = 153; // 160 chars minus 7 for UDH
  if (message.length <= 160) {
    return 1;
  }
  return Math.ceil(message.length / segmentLength);
}

/**
 * Get SMS provider configuration from environment
 */
export function getSMSProviderConfig(provider: SMSProvider): any {
  // Placeholder for loading provider configuration from environment variables
  const configs: Record<SMSProvider, any> = {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_PHONE_NUMBER,
    },
    vonage: {
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
      from: process.env.VONAGE_PHONE_NUMBER,
    },
    aws_sns: {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    },
    local: {},
  };

  return configs[provider] || {};
}

/**
 * Test SMS provider connection
 */
export async function testSMSProvider(provider: SMSProvider): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getSMSProviderConfig(provider);

    const testMessage: SMSMessage = {
      to: '+1234567890',
      body: 'This is a test message to verify SMS provider configuration.',
    };

    const response = await sendSMS(testMessage, provider, config);

    if (response.success) {
      logger.info('SMS provider test successful', { provider });
      return { success: true };
    } else {
      logger.error('SMS provider test failed', { provider, error: response.error });
      return { success: false, error: response.error };
    }
  } catch (error) {
    logger.error('SMS provider test error', { provider, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get SMS delivery status from provider
 */
export async function getSMSDeliveryStatus(provider: SMSProvider, messageId: string): Promise<{
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  error?: string;
}> {
  // Placeholder for fetching delivery status from provider
  // In production, this would call the provider's API to check delivery status
  logger.info('SMS delivery status check requested', { provider, messageId });

  return {
    status: 'delivered',
  };
}
