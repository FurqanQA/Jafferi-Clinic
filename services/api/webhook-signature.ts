import { logger } from '../shared/logger';

// ============================================================================
// Webhook Signature
// Webhook signature generation and verification (HMAC-SHA256)
// ============================================================================

/**
 * Signature Algorithm
 */
export type SignatureAlgorithm = 'sha256' | 'sha512';

/**
 * Signature Configuration
 */
export interface SignatureConfig {
  algorithm: SignatureAlgorithm;
  includeTimestamp: boolean;
  headerName: string;
}

/**
 * Default signature configuration
 */
const DEFAULT_SIGNATURE_CONFIG: SignatureConfig = {
  algorithm: 'sha256',
  includeTimestamp: true,
  headerName: 'X-Webhook-Signature',
};

/**
 * Generate webhook signature
 */
export async function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: SignatureAlgorithm = 'sha256',
  timestamp?: number
): Promise<string> {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  
  // Include timestamp if provided
  const dataToSign = timestamp !== undefined ? `${timestamp}.${payload}` : payload;
  const messageData = encoder.encode(dataToSign);

  const hashAlgorithm = algorithm === 'sha256' ? 'SHA-256' : 'SHA-512';
  const key = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'HMAC', hash: hashAlgorithm },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex;
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: SignatureAlgorithm = 'sha256',
  timestamp?: number
): Promise<boolean> {
  const expectedSignature = await generateWebhookSignature(payload, secret, algorithm, timestamp);
  
  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(signature, expectedSignature);
}

/**
 * Constant-time string comparison
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate signature header
 */
export async function generateSignatureHeader(
  payload: string,
  secret: string,
  config: SignatureConfig = DEFAULT_SIGNATURE_CONFIG
): Promise<string> {
  const timestamp = config.includeTimestamp ? Date.now() : undefined;
  const signature = await generateWebhookSignature(payload, secret, config.algorithm, timestamp);

  if (config.includeTimestamp && timestamp !== undefined) {
    return `t=${timestamp},v1=${signature}`;
  }

  return `v1=${signature}`;
}

/**
 * Parse signature header
 */
export function parseSignatureHeader(header: string): {
  timestamp?: number;
  signature: string;
  version: string;
} | null {
  const parts = header.split(',');
  const result: { timestamp?: number; signature: string; version: string } = {
    signature: '',
    version: 'v1',
  };

  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 't') {
      result.timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      result.signature = value;
      result.version = 'v1';
    } else if (key.startsWith('v')) {
      result.signature = value;
      result.version = key;
    }
  }

  if (!result.signature) {
    return null;
  }

  return result;
}

/**
 * Verify webhook request
 */
export async function verifyWebhookRequest(
  payload: string,
  signatureHeader: string,
  secret: string,
  config: SignatureConfig = DEFAULT_SIGNATURE_CONFIG,
  tolerance: number = 300000 // 5 minutes
): Promise<boolean> {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    return false;
  }

  // Check timestamp if included
  if (config.includeTimestamp && parsed.timestamp !== undefined) {
    const now = Date.now();
    if (Math.abs(now - parsed.timestamp) > tolerance) {
      logger.warn('Webhook timestamp outside tolerance window', { 
        timestamp: parsed.timestamp,
        now,
        tolerance,
      });
      return false;
    }
  }

  return await verifyWebhookSignature(
    payload,
    parsed.signature,
    secret,
    config.algorithm,
    parsed.timestamp
  );
}

/**
 * Get signature configuration
 */
export function getSignatureConfig(): SignatureConfig {
  return { ...DEFAULT_SIGNATURE_CONFIG };
}

/**
 * Update signature configuration
 */
export function updateSignatureConfig(config: Partial<SignatureConfig>): SignatureConfig {
  Object.assign(DEFAULT_SIGNATURE_CONFIG, config);
  logger.info('Signature configuration updated', { config: DEFAULT_SIGNATURE_CONFIG });
  return { ...DEFAULT_SIGNATURE_CONFIG };
}

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate webhook secret format
 */
export function validateWebhookSecret(secret: string): boolean {
  // Secret should be at least 32 characters (hex encoded 16 bytes)
  return secret.length >= 32 && /^[a-f0-9]+$/i.test(secret);
}

/**
 * Hash webhook secret (for storage)
 */
export async function hashWebhookSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign webhook payload with timestamp
 */
export async function signWebhookPayload(
  payload: Record<string, unknown>,
  secret: string,
  config: SignatureConfig = DEFAULT_SIGNATURE_CONFIG
): Promise<{
  signature: string;
  timestamp?: number;
  headerName: string;
}> {
  const payloadString = JSON.stringify(payload);
  const timestamp = config.includeTimestamp ? Date.now() : undefined;
  const signature = await generateWebhookSignature(payloadString, secret, config.algorithm, timestamp);

  return {
    signature,
    timestamp,
    headerName: config.headerName,
  };
}
