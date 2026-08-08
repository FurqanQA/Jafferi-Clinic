import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Secrets Manager
// Secure secret storage and management
// ============================================================================

/**
 * Secret interface
 */
export interface Secret {
  id: string;
  name: string;
  value: string;
  type: 'api_key' | 'database' | 'token' | 'certificate' | 'password' | 'custom';
  environment: 'development' | 'staging' | 'production';
  tenantId?: string;
  description?: string;
  expiresAt: string | null;
  lastRotatedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create secret
 */
export async function createSecret(data: {
  name: string;
  value: string;
  type: 'api_key' | 'database' | 'token' | 'certificate' | 'password' | 'custom';
  environment: 'development' | 'staging' | 'production';
  tenantId?: string;
  description?: string;
  expiresAt?: string;
  createdBy: string;
}): Promise<Secret> {
  try {
    await validatePlatformWritePermission(PlatformResource.SECRETS);

    const supabase = getSupabaseClient();

    const secretId = `secret-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: secret, error } = await supabase
      .from('secrets')
      .insert({
        id: secretId,
        name: data.name,
        value: data.value,
        type: data.type,
        environment: data.environment,
        tenant_id: data.tenantId || null,
        description: data.description || null,
        expires_at: data.expiresAt || null,
        last_rotated_at: now,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create secret', { error, data });
      throw new DatabaseError('Failed to create secret', { error });
    }

    logger.info('Secret created', { secretId, name: data.name, type: data.type });

    // Invalidate cache
    cache.delete(`secret:${secretId}`);
    cache.delete(`secrets:${data.environment}`);
    cache.delete('secrets:all');

    return secret as Secret;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating secret', { error, data });
    throw new DatabaseError('Failed to create secret', { error });
  }
}

/**
 * Get secret by ID
 */
export async function getSecret(secretId: string): Promise<Secret> {
  try {
    const supabase = getSupabaseClient();

    const { data: secret, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('id', secretId)
      .single();

    if (error) {
      logger.error('Failed to fetch secret', { error, secretId });
      throw new DatabaseError('Failed to fetch secret', { error });
    }

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    return secret as Secret;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching secret', { error, secretId });
    throw new DatabaseError('Failed to fetch secret', { error });
  }
}

/**
 * Get secret by name and environment
 */
export async function getSecretByName(
  name: string,
  environment: 'development' | 'staging' | 'production'
): Promise<Secret | null> {
  try {
    const cacheKey = `secret:${name}:${environment}`;
    const cached = cache.get<Secret>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: secret, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('name', name)
      .eq('environment', environment)
      .single();

    if (error) {
      logger.error('Failed to fetch secret by name', { error, name, environment });
      throw new DatabaseError('Failed to fetch secret by name', { error });
    }

    if (!secret) {
      return null;
    }

    const secretData = secret as Secret;
    cache.set(cacheKey, secretData, 300000); // 5 minutes

    return secretData;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching secret by name', { error, name, environment });
    throw new DatabaseError('Failed to fetch secret by name', { error });
  }
}

/**
 * List secrets
 */
export async function listSecrets(options: {
  page?: number;
  pageSize?: number;
  environment?: 'development' | 'staging' | 'production';
  type?: 'api_key' | 'database' | 'token' | 'certificate' | 'password' | 'custom';
  tenantId?: string;
}): Promise<{ secrets: Secret[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, environment, type, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('secrets')
      .select('*', { count: 'exact' });

    if (environment) {
      query = query.eq('environment', environment);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: secrets, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list secrets', { error });
      throw new DatabaseError('Failed to list secrets', { error });
    }

    return {
      secrets: (secrets || []) as Secret[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing secrets', { error });
    throw new DatabaseError('Failed to list secrets', { error });
  }
}

/**
 * Update secret
 */
export async function updateSecret(secretId: string, data: {
  value?: string;
  description?: string;
  expiresAt?: string;
}): Promise<Secret> {
  try {
    await validatePlatformWritePermission(PlatformResource.SECRETS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.value !== undefined) {
      updateData.value = data.value;
      updateData.last_rotated_at = now;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;

    const { data: secret, error } = await supabase
      .from('secrets')
      .update(updateData)
      .eq('id', secretId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update secret', { error, secretId });
      throw new DatabaseError('Failed to update secret', { error });
    }

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    logger.info('Secret updated', { secretId });

    // Invalidate cache
    cache.delete(`secret:${secretId}`);
    cache.delete(`secret:${secret.name}:${secret.environment}`);
    cache.delete(`secrets:${secret.environment}`);
    cache.delete('secrets:all');

    return secret as Secret;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating secret', { error, secretId });
    throw new DatabaseError('Failed to update secret', { error });
  }
}

/**
 * Delete secret
 */
export async function deleteSecret(secretId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.SECRETS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('secrets')
      .delete()
      .eq('id', secretId);

    if (error) {
      logger.error('Failed to delete secret', { error, secretId });
      throw new DatabaseError('Failed to delete secret', { error });
    }

    logger.info('Secret deleted', { secretId });

    // Invalidate cache
    cache.delete(`secret:${secretId}`);
    cache.delete('secrets:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting secret', { error, secretId });
    throw new DatabaseError('Failed to delete secret', { error });
  }
}

/**
 * Rotate secret
 */
export async function rotateSecret(secretId: string, newValue: string, rotatedBy: string): Promise<Secret> {
  try {
    await validatePlatformWritePermission(PlatformResource.SECRETS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: secret, error } = await supabase
      .from('secrets')
      .update({
        value: newValue,
        last_rotated_at: now,
        updated_at: now,
      })
      .eq('id', secretId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to rotate secret', { error, secretId });
      throw new DatabaseError('Failed to rotate secret', { error });
    }

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    logger.info('Secret rotated', { secretId, rotatedBy });

    // Invalidate cache
    cache.delete(`secret:${secretId}`);
    cache.delete(`secret:${secret.name}:${secret.environment}`);
    cache.delete(`secrets:${secret.environment}`);

    return secret as Secret;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rotating secret', { error, secretId });
    throw new DatabaseError('Failed to rotate secret', { error });
  }
}

/**
 * Get expired secrets
 */
export async function getExpiredSecrets(): Promise<Secret[]> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: secrets } = await supabase
      .from('secrets')
      .select('*')
      .lt('expires_at', now);

    return (secrets || []) as Secret[];
  } catch (error) {
    logger.error('Failed to get expired secrets', { error });
    throw new DatabaseError('Failed to get expired secrets', { error });
  }
}

/**
 * Get secrets by environment
 */
export async function getSecretsByEnvironment(environment: 'development' | 'staging' | 'production'): Promise<Secret[]> {
  try {
    const { secrets } = await listSecrets({ environment, pageSize: 1000 });
    return secrets;
  } catch (error) {
    logger.error('Failed to get secrets by environment', { error, environment });
    throw new DatabaseError('Failed to get secrets by environment', { error });
  }
}

/**
 * Get secrets by tenant
 */
export async function getSecretsByTenant(tenantId: string): Promise<Secret[]> {
  try {
    const { secrets } = await listSecrets({ tenantId, pageSize: 1000 });
    return secrets;
  } catch (error) {
    logger.error('Failed to get secrets by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get secrets by tenant', { error });
  }
}

/**
 * Get secret statistics
 */
export async function getSecretStatistics(): Promise<{
  total: number;
  byType: Record<string, number>;
  byEnvironment: Record<string, number>;
  expired: number;
  expiringSoon: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: secrets } = await supabase
      .from('secrets')
      .select('type, environment, expires_at');

    if (!secrets || secrets.length === 0) {
      return {
        total: 0,
        byType: {},
        byEnvironment: {},
        expired: 0,
        expiringSoon: 0,
      };
    }

    const byType: Record<string, number> = {};
    const byEnvironment: Record<string, number> = {};
    let expired = 0;
    let expiringSoon = 0;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const secret of secrets) {
      const secretData = secret as any;
      byType[secretData.type] = (byType[secretData.type] || 0) + 1;
      byEnvironment[secretData.environment] = (byEnvironment[secretData.environment] || 0) + 1;

      const expiresAt = secretData.expires_at || secretData.expiresAt;
      if (expiresAt && new Date(expiresAt) < now) {
        expired++;
      } else if (expiresAt && new Date(expiresAt) < weekFromNow) {
        expiringSoon++;
      }
    }

    return {
      total: secrets.length,
      byType,
      byEnvironment,
      expired,
      expiringSoon,
    };
  } catch (error) {
    logger.error('Failed to get secret statistics', { error });
    throw new DatabaseError('Failed to get secret statistics', { error });
  }
}

/**
 * Validate secret access
 */
export async function validateSecretAccess(secretId: string): Promise<boolean> {
  try {
    const secret = await getSecret(secretId);
    
    const expiresAt = (secret as any).expires_at || secret.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to validate secret access', { error, secretId });
    return false;
  }
}

/**
 * Get secret value (without logging)
 */
export async function getSecretValue(secretId: string): Promise<string> {
  try {
    const secret = await getSecret(secretId);
    return secret.value;
  } catch (error) {
    logger.error('Failed to get secret value', { error, secretId });
    throw new DatabaseError('Failed to get secret value', { error });
  }
}
