import { logger } from '../shared/logger';
import { getApiKey, updateApiKey } from './api-keys';
import { ApiKey, ApiKeyStatus } from './api-types';
import { cache } from '../shared/cache';

// ============================================================================
// Revoke API Key
// Revoke and deactivate API keys
// ============================================================================

/**
 * Revoke API Key Options
 */
export interface RevokeApiKeyOptions {
  keyId: string;
  revokedBy: string;
  reason?: string;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(options: RevokeApiKeyOptions): Promise<ApiKey | null> {
  try {
    if (!options.keyId) {
      throw new Error('API key ID is required');
    }

    const apiKey = await getApiKey(options.keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    if (apiKey.status === ApiKeyStatus.REVOKED) {
      logger.warn('API key already revoked', { keyId: options.keyId });
      return apiKey;
    }

    // Update API key status to revoked
    const updatedKey: Partial<ApiKey> = {
      status: ApiKeyStatus.REVOKED,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...apiKey.metadata,
        revokedBy: options.revokedBy,
        revokedAt: new Date().toISOString(),
        reason: options.reason,
      },
    };

    const result = await updateApiKey(options.keyId, updatedKey);
    if (!result) {
      throw new Error('Failed to revoke API key');
    }

    // Clear cache for this key
    const cacheKey = `api-key:${options.keyId}`;
    cache.delete(cacheKey);

    logger.info('API key revoked', {
      keyId: options.keyId,
      revokedBy: options.revokedBy,
      reason: options.reason,
    });

    return result;
  } catch (error) {
    logger.error('API key revocation failed', { error, options });
    throw error;
  }
}

/**
 * Revoke API key by key value
 */
export async function revokeApiKeyByKey(
  keyValue: string,
  revokedBy: string,
  reason?: string
): Promise<ApiKey | null> {
  try {
    if (!keyValue) {
      throw new Error('API key value is required');
    }

    // Get the API key by its value
    const apiKey = await getApiKeyByKey(keyValue);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    return await revokeApiKey({
      keyId: apiKey.id,
      revokedBy,
      reason,
    });
  } catch (error) {
    logger.error('API key revocation by key failed', { error, keyValue });
    throw error;
  }
}

/**
 * Get API key by key value (helper function)
 */
async function getApiKeyByKey(keyValue: string): Promise<ApiKey | null> {
  // This would typically look up the key by its hash
  // For now, we'll implement a simple lookup
  const cacheKey = `api-key-by-value:${keyValue}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // In a real implementation, this would query the database
  // For now, return null
  return null;
}

/**
 * Validate revoke API key options
 */
export function validateRevokeApiKeyOptions(options: RevokeApiKeyOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.keyId) {
    errors.push('API key ID is required');
  }

  if (!options.revokedBy) {
    errors.push('Revoked by is required');
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
 * Bulk revoke API keys
 */
export async function bulkRevokeApiKeys(
  keyIds: string[],
  revokedBy: string,
  reason?: string
): Promise<{ successful: string[]; failed: Array<{ keyId: string; error: string }> }> {
  const successful: string[] = [];
  const failed: Array<{ keyId: string; error: string }> = [];

  for (const keyId of keyIds) {
    try {
      await revokeApiKey({ keyId, revokedBy, reason });
      successful.push(keyId);
    } catch (error) {
      failed.push({
        keyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk API key revocation completed', {
    total: keyIds.length,
    successful: successful.length,
    failed: failed.length,
  });

  return { successful, failed };
}
