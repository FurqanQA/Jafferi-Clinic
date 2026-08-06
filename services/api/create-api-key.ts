import { logger } from '../shared/logger';
import { generateApiKey, hashApiKey } from './api-keys';
import { ApiKey, ApiKeyStatus, ApiKeyType, ApiKeyScope } from './api-types';
import { cache } from '../shared/cache';

// ============================================================================
// Create API Key
// Create and register new API keys
// ============================================================================

/**
 * Create API Key Options
 */
export interface CreateApiKeyOptions {
  clinicId: string;
  name: string;
  type: ApiKeyType;
  scopes: ApiKeyScope[];
  rateLimit?: number;
  allowedIps?: string[];
  allowedOrigins?: string[];
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Create API Key Result
 */
export interface CreateApiKeyResult {
  apiKey: ApiKey;
  plainTextKey: string;
  keyPrefix: string;
}

/**
 * Create a new API key
 */
export async function createApiKey(options: CreateApiKeyOptions): Promise<CreateApiKeyResult> {
  try {
    // Validate required fields
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.name) {
      throw new Error('API key name is required');
    }

    if (!options.type) {
      throw new Error('API key type is required');
    }

    if (!options.scopes || options.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    // Generate API key
    const plainTextKey = generateApiKey('jaf');
    const hashedKey = hashApiKey(plainTextKey);
    const keyPrefix = plainTextKey.split('_')[0];

    // Create API key object
    const apiKey: ApiKey = {
      id: generateId(),
      clinicId: options.clinicId,
      name: options.name,
      key: hashedKey,
      keyPrefix,
      status: ApiKeyStatus.ACTIVE,
      scopes: options.scopes,
      type: options.type,
      rateLimit: options.rateLimit || 1000,
      allowedIps: options.allowedIps || [],
      allowedOrigins: options.allowedOrigins || [],
      expiresAt: options.expiresAt?.toISOString() || undefined,
      lastUsedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: options.createdBy,
      metadata: options.metadata || {},
    };

    // Validate API key object structure
    if (!apiKey.id || !apiKey.clinicId || !apiKey.name || !apiKey.key) {
      throw new Error('Invalid API key: missing required fields');
    }

    // Cache the API key
    const cacheKey = `api-key:${apiKey.id}`;
    cache.set(cacheKey, apiKey, 3600000);

    logger.info('API key created', {
      apiKeyId: apiKey.id,
      clinicId: apiKey.clinicId,
      name: apiKey.name,
      type: apiKey.type,
      scopes: apiKey.scopes,
    });

    return {
      apiKey,
      plainTextKey,
      keyPrefix,
    };
  } catch (error) {
    logger.error('API key creation failed', { error, options });
    throw error;
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate create API key options
 */
export function validateCreateApiKeyOptions(options: CreateApiKeyOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.clinicId) {
    errors.push('Clinic ID is required');
  }

  if (!options.name || options.name.trim().length === 0) {
    errors.push('API key name is required');
  }

  if (options.name && options.name.length > 100) {
    errors.push('API key name must be less than 100 characters');
  }

  if (!options.type) {
    errors.push('API key type is required');
  }

  if (!options.scopes || options.scopes.length === 0) {
    errors.push('At least one scope is required');
  }

  if (options.rateLimit && options.rateLimit < 1) {
    errors.push('Rate limit must be at least 1');
  }

  if (options.allowedIps) {
    for (const ip of options.allowedIps) {
      if (!isValidIp(ip)) {
        errors.push(`Invalid IP address: ${ip}`);
      }
    }
  }

  if (options.allowedOrigins) {
    for (const origin of options.allowedOrigins) {
      if (!isValidOrigin(origin)) {
        errors.push(`Invalid origin: ${origin}`);
      }
    }
  }

  if (options.expiresAt && new Date(options.expiresAt) < new Date()) {
    errors.push('Expiration date must be in the future');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate IP address
 */
function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate origin
 */
function isValidOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
