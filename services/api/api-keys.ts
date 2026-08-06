import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { ApiKey, ApiKeyStatus, ApiKeyType, ApiKeyScope } from './api-types';

// ============================================================================
// API Keys
// API key management and validation
// ============================================================================

/**
 * API Key Storage
 */
interface ApiKeyStorage {
  keys: Map<string, ApiKey>;
  keyToId: Map<string, string>;
}

/**
 * API key registry
 */
const apiKeyRegistry: ApiKeyStorage = {
  keys: new Map(),
  keyToId: new Map(),
};

/**
 * Generate a secure API key
 */
export function generateApiKey(prefix: string = 'jaf'): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${randomString}`;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(key: string): string {
  // Simple hash for demonstration - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Create API key
 */
export async function createApiKey(
  clinicId: string,
  name: string,
  createdBy: string,
  type: ApiKeyType = ApiKeyType.PRODUCTION,
  scopes: ApiKeyScope[] = [ApiKeyScope.READ],
  expiresIn?: number
): Promise<ApiKey> {
  const key = generateApiKey();
  const keyId = crypto.randomUUID();
  const prefix = key.split('_')[0];
  const now = new Date();

  const apiKey: ApiKey = {
    id: keyId,
    clinicId,
    name,
    key: hashApiKey(key),
    keyPrefix: prefix,
    type,
    scopes,
    status: ApiKeyStatus.ACTIVE,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastUsedAt: undefined,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : undefined,
    createdBy,
    rateLimit: type === ApiKeyType.PRODUCTION ? 1000 : 100,
    allowedIps: [],
    allowedOrigins: [],
  };

  // Store the key
  apiKeyRegistry.keys.set(keyId, apiKey);
  apiKeyRegistry.keyToId.set(key, keyId);

  // Cache the key
  cache.set(`apikey:${keyId}`, JSON.stringify(apiKey), 86400000);
  cache.set(`apikey:hash:${apiKey.key}`, keyId, 86400000);

  logger.info('API key created', { keyId, clinicId, name, type });
  return { ...apiKey, key }; // Return actual key only on creation
}

/**
 * Get API key by ID
 */
export async function getApiKey(keyId: string): Promise<ApiKey | null> {
  // Check cache first
  const cached = cache.get<string>(`apikey:${keyId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Check registry
  const apiKey = apiKeyRegistry.keys.get(keyId);
  if (apiKey) {
    cache.set(`apikey:${keyId}`, JSON.stringify(apiKey), 86400000);
    return apiKey;
  }

  return null;
}

/**
 * Get API key by key value
 */
export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
  const keyId = apiKeyRegistry.keyToId.get(key);
  if (!keyId) {
    return null;
  }

  return await getApiKey(keyId);
}

/**
 * Get API keys by clinic
 */
export async function getApiKeysByClinic(
  clinicId: string
): Promise<ApiKey[]> {
  const keys: ApiKey[] = [];

  for (const apiKey of apiKeyRegistry.keys.values()) {
    if (apiKey.clinicId === clinicId) {
      keys.push(apiKey);
    }
  }

  return keys;
}

/**
 * Update API key
 */
export async function updateApiKey(
  keyId: string,
  updates: Partial<Omit<ApiKey, 'id' | 'clinicId' | 'key' | 'createdAt'>>
): Promise<ApiKey | null> {
  const apiKey = apiKeyRegistry.keys.get(keyId);
  if (!apiKey) {
    return null;
  }

  const updated: ApiKey = {
    ...apiKey,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  apiKeyRegistry.keys.set(keyId, updated);
  cache.set(`apikey:${keyId}`, JSON.stringify(updated), 86400000);

  logger.info('API key updated', { keyId });
  return updated;
}

/**
 * Revoke API key
 */
export async function revokeApiKey(keyId: string): Promise<boolean> {
  const apiKey = apiKeyRegistry.keys.get(keyId);
  if (!apiKey) {
    return false;
  }

  apiKey.status = ApiKeyStatus.REVOKED;
  apiKey.updatedAt = new Date().toISOString();

  apiKeyRegistry.keys.set(keyId, apiKey);
  cache.set(`apikey:${keyId}`, JSON.stringify(apiKey), 86400000);

  // Remove from key-to-id mapping
  apiKeyRegistry.keyToId.forEach((id, key) => {
    if (id === keyId) {
      apiKeyRegistry.keyToId.delete(key);
    }
  });

  logger.info('API key revoked', { keyId });
  return true;
}

/**
 * Delete API key
 */
export async function deleteApiKey(keyId: string): Promise<boolean> {
  const apiKey = apiKeyRegistry.keys.get(keyId);
  if (!apiKey) {
    return false;
  }

  apiKeyRegistry.keys.delete(keyId);
  cache.delete(`apikey:${keyId}`);
  cache.delete(`apikey:hash:${apiKey.key}`);

  // Remove from key-to-id mapping
  apiKeyRegistry.keyToId.forEach((id, key) => {
    if (id === keyId) {
      apiKeyRegistry.keyToId.delete(key);
    }
  });

  logger.info('API key deleted', { keyId });
  return true;
}

/**
 * Rotate API key
 */
export async function rotateApiKey(keyId: string): Promise<ApiKey | null> {
  const apiKey = apiKeyRegistry.keys.get(keyId);
  if (!apiKey) {
    return null;
  }

  const newKey = generateApiKey();
  const newHash = hashApiKey(newKey);

  // Update key
  apiKey.key = newHash;
  apiKey.updatedAt = new Date().toISOString();

  apiKeyRegistry.keys.set(keyId, apiKey);
  cache.set(`apikey:${keyId}`, JSON.stringify(apiKey), 86400000);
  cache.set(`apikey:hash:${newHash}`, keyId, 86400000);

  // Remove old hash mapping
  apiKeyRegistry.keyToId.forEach((id, key) => {
    if (id === keyId) {
      apiKeyRegistry.keyToId.delete(key);
    }
  });
  apiKeyRegistry.keyToId.set(newKey, keyId);

  logger.info('API key rotated', { keyId });
  return { ...apiKey, key: newKey };
}

/**
 * Validate API key
 */
export async function validateApiKey(
  key: string,
  requiredScopes?: ApiKeyScope[]
): Promise<ApiKey | null> {
  const keyId = apiKeyRegistry.keyToId.get(key);
  if (!keyId) {
    return null;
  }

  const apiKey = await getApiKey(keyId);
  if (!apiKey) {
    return null;
  }

  // Check status
  if (apiKey.status !== ApiKeyStatus.ACTIVE) {
    return null;
  }

  // Check expiration
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    apiKey.status = ApiKeyStatus.EXPIRED;
    apiKeyRegistry.keys.set(keyId, apiKey);
    return null;
  }

  // Check scopes
  if (requiredScopes && requiredScopes.length > 0) {
    const hasAllScopes = requiredScopes.every((scope) =>
      apiKey.scopes.includes(scope)
    );
    if (!hasAllScopes) {
      return null;
    }
  }

  // Update last used
  apiKey.lastUsedAt = new Date().toISOString();
  apiKeyRegistry.keys.set(keyId, apiKey);

  return apiKey;
}

/**
 * Record API key usage
 */
export async function recordApiKeyUsage(keyId: string): Promise<void> {
  const apiKey = apiKeyRegistry.keys.get(keyId);
  if (apiKey) {
    apiKey.lastUsedAt = new Date().toISOString();
    apiKeyRegistry.keys.set(keyId, apiKey);
    cache.set(`apikey:${keyId}`, JSON.stringify(apiKey), 86400000);
  }
}

/**
 * Get API key statistics
 */
export async function getApiKeyStats(clinicId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  revoked: number;
  expired: number;
}> {
  const keys = await getApiKeysByClinic(clinicId);

  return {
    total: keys.length,
    active: keys.filter((k) => k.status === ApiKeyStatus.ACTIVE).length,
    inactive: keys.filter((k) => k.status === ApiKeyStatus.INACTIVE).length,
    revoked: keys.filter((k) => k.status === ApiKeyStatus.REVOKED).length,
    expired: keys.filter((k) => k.status === ApiKeyStatus.EXPIRED).length,
  };
}
