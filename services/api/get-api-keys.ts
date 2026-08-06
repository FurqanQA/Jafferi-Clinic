import { logger } from '../shared/logger';
import { getApiKeysByClinic } from './api-keys';
import { ApiKey, ApiKeyStatus, ApiKeyType } from './api-types';
import { cache } from '../shared/cache';

// ============================================================================
// Get API Keys
// Retrieve multiple API keys with filtering and pagination
// ============================================================================

/**
 * Get API Keys Options
 */
export interface GetApiKeysOptions {
  clinicId: string;
  status?: ApiKeyStatus;
  type?: ApiKeyType;
  scope?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'lastUsedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get API Keys Result
 */
export interface GetApiKeysResult {
  keys: ApiKey[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Get API keys with filtering and pagination
 */
export async function getApiKeys(options: GetApiKeysOptions): Promise<GetApiKeysResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    const cacheKey = `api-keys:${JSON.stringify(options)}`;
    const cached = cache.get<string>(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get all keys for the clinic
    let keys = await getApiKeysByClinic(options.clinicId);

    // Apply filters
    if (options.status) {
      keys = keys.filter((key) => key.status === options.status);
    }

    if (options.type) {
      keys = keys.filter((key) => key.type === options.type);
    }

    if (options.scope) {
      keys = keys.filter((key) => key.scopes.includes(options.scope as any));
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      keys = keys.filter(
        (key) =>
          key.name.toLowerCase().includes(searchLower) ||
          key.keyPrefix.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    keys.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (!aValue || !bValue) return 0;

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate total before pagination
    const total = keys.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const paginatedKeys = keys.slice(offset, offset + limit);

    const result: GetApiKeysResult = {
      keys: paginatedKeys,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    // Cache the result
    cache.set(cacheKey, JSON.stringify(result), 300000);

    logger.info('API keys retrieved', {
      clinicId: options.clinicId,
      count: paginatedKeys.length,
      total,
      filters: {
        status: options.status,
        type: options.type,
        scope: options.scope,
      },
    });

    return result;
  } catch (error) {
    logger.error('API keys retrieval failed', { error, options });
    throw error;
  }
}

/**
 * Get API keys count by status
 */
export async function getApiKeysCountByStatus(clinicId: string): Promise<Record<ApiKeyStatus, number>> {
  try {
    const cacheKey = `api-keys-count-by-status:${clinicId}`;
    const cached = cache.get<string>(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const keys = await getApiKeysByClinic(clinicId);

    const counts: Record<ApiKeyStatus, number> = {
      [ApiKeyStatus.ACTIVE]: 0,
      [ApiKeyStatus.INACTIVE]: 0,
      [ApiKeyStatus.REVOKED]: 0,
      [ApiKeyStatus.EXPIRED]: 0,
    };

    for (const key of keys) {
      counts[key.status]++;
    }

    cache.set(cacheKey, JSON.stringify(counts), 300000);

    return counts;
  } catch (error) {
    logger.error('API keys count by status failed', { error, clinicId });
    throw error;
  }
}

/**
 * Get API keys count by type
 */
export async function getApiKeysCountByType(clinicId: string): Promise<Record<ApiKeyType, number>> {
  try {
    const cacheKey = `api-keys-count-by-type:${clinicId}`;
    const cached = cache.get<string>(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const keys = await getApiKeysByClinic(clinicId);

    const counts: Record<ApiKeyType, number> = {
      [ApiKeyType.PRODUCTION]: 0,
      [ApiKeyType.DEVELOPMENT]: 0,
      [ApiKeyType.TESTING]: 0,
    };

    for (const key of keys) {
      counts[key.type]++;
    }

    cache.set(cacheKey, JSON.stringify(counts), 300000);

    return counts;
  } catch (error) {
    logger.error('API keys count by type failed', { error, clinicId });
    throw error;
  }
}

/**
 * Validate get API keys options
 */
export function validateGetApiKeysOptions(options: GetApiKeysOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.clinicId) {
    errors.push('Clinic ID is required');
  }

  if (options.limit && options.limit < 1) {
    errors.push('Limit must be at least 1');
  }

  if (options.limit && options.limit > 100) {
    errors.push('Limit cannot exceed 100');
  }

  if (options.offset && options.offset < 0) {
    errors.push('Offset cannot be negative');
  }

  const validSortFields = ['createdAt', 'updatedAt', 'name', 'lastUsedAt'];
  if (options.sortBy && !validSortFields.includes(options.sortBy)) {
    errors.push(`Invalid sort field: ${options.sortBy}`);
  }

  const validSortOrders = ['asc', 'desc'];
  if (options.sortOrder && !validSortOrders.includes(options.sortOrder)) {
    errors.push(`Invalid sort order: ${options.sortOrder}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
