import { logger } from '../shared/logger';
import { getApiKey, deleteApiKey as deleteApiKeyImpl } from './api-keys';
import { cache } from '../shared/cache';

// ============================================================================
// Delete API Key
// Permanently delete API keys
// ============================================================================

/**
 * Delete API Key Options
 */
export interface DeleteApiKeyOptions {
  keyId: string;
  deletedBy: string;
  reason?: string;
  force?: boolean;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(options: DeleteApiKeyOptions): Promise<boolean> {
  try {
    if (!options.keyId) {
      throw new Error('API key ID is required');
    }

    const apiKey = await getApiKey(options.keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Check if key is in use (unless force is true)
    if (!options.force && apiKey.lastUsedAt) {
      const lastUsed = new Date(apiKey.lastUsedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (lastUsed > thirtyDaysAgo) {
        throw new Error('API key has been used recently. Use force=true to delete anyway.');
      }
    }

    // Delete the key using the implementation from api-keys
    const result = await deleteApiKeyImpl(options.keyId);
    if (!result) {
      throw new Error('Failed to delete API key');
    }

    // Clear cache for this key
    const cacheKey = `api-key:${options.keyId}`;
    cache.delete(cacheKey);

    logger.info('API key deleted', {
      keyId: options.keyId,
      deletedBy: options.deletedBy,
      reason: options.reason,
      force: options.force,
    });

    return true;
  } catch (error) {
    logger.error('API key deletion failed', { error, options });
    throw error;
  }
}

/**
 * Delete API key by key value
 */
export async function deleteApiKeyByKey(
  keyValue: string,
  deletedBy: string,
  reason?: string,
  force?: boolean
): Promise<boolean> {
  try {
    if (!keyValue) {
      throw new Error('API key value is required');
    }

    // Get the API key by its value
    const apiKey = await getApiKeyByKey(keyValue);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    return await deleteApiKey({
      keyId: apiKey.id,
      deletedBy,
      reason,
      force,
    });
  } catch (error) {
    logger.error('API key deletion by key failed', { error, keyValue });
    throw error;
  }
}

/**
 * Get API key by key value (helper function)
 */
async function getApiKeyByKey(keyValue: string) {
  const cacheKey = `api-key-by-value:${keyValue}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  return null;
}

/**
 * Validate delete API key options
 */
export function validateDeleteApiKeyOptions(options: DeleteApiKeyOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.keyId) {
    errors.push('API key ID is required');
  }

  if (!options.deletedBy) {
    errors.push('Deleted by is required');
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
 * Bulk delete API keys
 */
export async function bulkDeleteApiKeys(
  keyIds: string[],
  deletedBy: string,
  reason?: string,
  force?: boolean
): Promise<{ successful: string[]; failed: Array<{ keyId: string; error: string }> }> {
  const successful: string[] = [];
  const failed: Array<{ keyId: string; error: string }> = [];

  for (const keyId of keyIds) {
    try {
      await deleteApiKey({ keyId, deletedBy, reason, force });
      successful.push(keyId);
    } catch (error) {
      failed.push({
        keyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk API key deletion completed', {
    total: keyIds.length,
    successful: successful.length,
    failed: failed.length,
  });

  return { successful, failed };
}

/**
 * Soft delete API key (mark as deleted but keep record)
 */
export async function softDeleteApiKey(options: DeleteApiKeyOptions): Promise<boolean> {
  try {
    if (!options.keyId) {
      throw new Error('API key ID is required');
    }

    const apiKey = await getApiKey(options.keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Update metadata to mark as deleted
    const updatedMetadata = {
      ...apiKey.metadata,
      deletedBy: options.deletedBy,
      deletedAt: new Date().toISOString(),
      reason: options.reason,
    };

    // Cache the updated metadata
    const cacheKey = `api-key-deleted:${options.keyId}`;
    cache.set(cacheKey, JSON.stringify(updatedMetadata), 86400000);

    logger.info('API key soft deleted', {
      keyId: options.keyId,
      deletedBy: options.deletedBy,
      reason: options.reason,
    });

    return true;
  } catch (error) {
    logger.error('API key soft deletion failed', { error, options });
    throw error;
  }
}
