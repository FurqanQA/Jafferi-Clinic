import { logger } from '../shared/logger';
import { getApiKey, rotateApiKey as rotateApiKeyImpl } from './api-keys';
import { ApiKey } from './api-types';
import { cache } from '../shared/cache';

// ============================================================================
// Rotate API Key
// Rotate and regenerate API keys
// ============================================================================

/**
 * Rotate API Key Options
 */
export interface RotateApiKeyOptions {
  keyId: string;
  rotatedBy: string;
  reason?: string;
}

/**
 * Rotate API Key Result
 */
export interface RotateApiKeyResult {
  apiKey: ApiKey;
  newKey: string;
  oldKeyPrefix: string;
}

/**
 * Rotate an API key
 */
export async function rotateApiKey(options: RotateApiKeyOptions): Promise<RotateApiKeyResult> {
  try {
    if (!options.keyId) {
      throw new Error('API key ID is required');
    }

    const apiKey = await getApiKey(options.keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const oldKeyPrefix = apiKey.keyPrefix;

    // Rotate the key using the implementation from api-keys
    const result = await rotateApiKeyImpl(options.keyId);
    if (!result) {
      throw new Error('Failed to rotate API key');
    }

    // Clear cache for this key
    const cacheKey = `api-key:${options.keyId}`;
    cache.delete(cacheKey);

    // Update metadata
    const updatedMetadata = {
      ...result.metadata,
      rotatedBy: options.rotatedBy,
      rotatedAt: new Date().toISOString(),
      reason: options.reason,
      previousKeyPrefix: oldKeyPrefix,
    };

    logger.info('API key rotated', {
      keyId: options.keyId,
      rotatedBy: options.rotatedBy,
      reason: options.reason,
      oldKeyPrefix,
      newKeyPrefix: result.keyPrefix,
    });

    return {
      apiKey: { ...result, metadata: updatedMetadata },
      newKey: result.key as string,
      oldKeyPrefix,
    };
  } catch (error) {
    logger.error('API key rotation failed', { error, options });
    throw error;
  }
}

/**
 * Rotate API key by key value
 */
export async function rotateApiKeyByKey(
  keyValue: string,
  rotatedBy: string,
  reason?: string
): Promise<RotateApiKeyResult | null> {
  try {
    if (!keyValue) {
      throw new Error('API key value is required');
    }

    // Get the API key by its value
    const apiKey = await getApiKeyByKey(keyValue);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    return await rotateApiKey({
      keyId: apiKey.id,
      rotatedBy,
      reason,
    });
  } catch (error) {
    logger.error('API key rotation by key failed', { error, keyValue });
    throw error;
  }
}

/**
 * Get API key by key value (helper function)
 */
async function getApiKeyByKey(keyValue: string): Promise<ApiKey | null> {
  const cacheKey = `api-key-by-value:${keyValue}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  return null;
}

/**
 * Validate rotate API key options
 */
export function validateRotateApiKeyOptions(options: RotateApiKeyOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.keyId) {
    errors.push('API key ID is required');
  }

  if (!options.rotatedBy) {
    errors.push('Rotated by is required');
  }

  if (options.reason && options.reason.length > 500) {
    errors.push('Reason must be less than 500 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Bulk rotate API keys
 */
export async function bulkRotateApiKeys(
  keyIds: string[],
  rotatedBy: string,
  reason?: string
): Promise<{ successful: Array<{ keyId: string; newKey: string }>; failed: Array<{ keyId: string; error: string }> }> {
  const successful: Array<{ keyId: string; newKey: string }> = [];
  const failed: Array<{ keyId: string; error: string }> = [];

  for (const keyId of keyIds) {
    try {
      const result = await rotateApiKey({ keyId, rotatedBy, reason });
      successful.push({ keyId, newKey: result.newKey });
    } catch (error) {
      failed.push({
        keyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk API key rotation completed', {
    total: keyIds.length,
    successful: successful.length,
    failed: failed.length,
  });

  return { successful, failed };
}
