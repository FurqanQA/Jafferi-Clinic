import { logger } from '../shared/logger';
import { getApiKey, getApiKeyByKey } from './api-keys';
import { ApiKey } from './api-types';
import { cache } from '../shared/cache';

// ============================================================================
// Get API Key
// Retrieve API key information
// ============================================================================

/**
 * Get API Key Options
 */
export interface GetApiKeyOptions {
  keyId?: string;
  keyValue?: string;
  includeUsageStats?: boolean;
}

/**
 * Get API Key Result
 */
export interface GetApiKeyResult {
  apiKey: ApiKey;
  usageStats?: {
    totalRequests: number;
    lastUsedAt: string | null;
    averageRequestsPerDay: number;
  };
}

/**
 * Get an API key
 */
export async function getApiKeyInfo(options: GetApiKeyOptions): Promise<GetApiKeyResult | null> {
  try {
    if (!options.keyId && !options.keyValue) {
      throw new Error('Either key ID or key value is required');
    }

    let apiKey: ApiKey | null = null;

    if (options.keyId) {
      apiKey = await getApiKey(options.keyId);
    } else if (options.keyValue) {
      apiKey = await getApiKeyByKey(options.keyValue);
    }

    if (!apiKey) {
      return null;
    }

    const result: GetApiKeyResult = {
      apiKey,
    };

    if (options.includeUsageStats) {
      result.usageStats = await getApiKeyUsageStats(apiKey.id);
    }

    logger.info('API key retrieved', {
      keyId: apiKey.id,
      clinicId: apiKey.clinicId,
      name: apiKey.name,
    });

    return result;
  } catch (error) {
    logger.error('API key retrieval failed', { error, options });
    throw error;
  }
}

/**
 * Get API key usage statistics
 */
async function getApiKeyUsageStats(keyId: string): Promise<{
  totalRequests: number;
  lastUsedAt: string | null;
  averageRequestsPerDay: number;
}> {
  const cacheKey = `api-key-usage:${keyId}`;
  const cached = cache.get<string>(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // In a real implementation, this would query the database for usage statistics
  // For now, return default values
  const stats = {
    totalRequests: 0,
    lastUsedAt: null,
    averageRequestsPerDay: 0,
  };

  cache.set(cacheKey, JSON.stringify(stats), 3600000);
  return stats;
}

/**
 * Validate get API key options
 */
export function validateGetApiKeyOptions(options: GetApiKeyOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.keyId && !options.keyValue) {
    errors.push('Either key ID or key value is required');
  }

  if (options.keyId && options.keyValue) {
    errors.push('Cannot specify both key ID and key value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get API key by clinic
 */
export async function getApiKeysByClinic(
  clinicId: string,
  options?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ApiKey[]> {
  try {
    if (!clinicId) {
      throw new Error('Clinic ID is required');
    }

    const cacheKey = `api-keys-by-clinic:${clinicId}:${JSON.stringify(options || {})}`;
    const cached = cache.get<string>(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // In a real implementation, this would query the database
    // For now, return empty array
    const keys: ApiKey[] = [];

    cache.set(cacheKey, JSON.stringify(keys), 3600000);

    logger.info('API keys by clinic retrieved', {
      clinicId,
      count: keys.length,
    });

    return keys;
  } catch (error) {
    logger.error('API keys by clinic retrieval failed', { error, clinicId });
    throw error;
  }
}

/**
 * Get API key metadata
 */
export async function getApiKeyMetadata(keyId: string): Promise<Record<string, unknown> | null> {
  try {
    const apiKey = await getApiKey(keyId);
    if (!apiKey) {
      return null;
    }

    return apiKey.metadata || {};
  } catch (error) {
    logger.error('API key metadata retrieval failed', { error, keyId });
    throw error;
  }
}
