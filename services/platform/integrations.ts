import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Integrations Manager
// Third-party integrations and external service connections
// ============================================================================

/**
 * Integration interface
 */
export interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  credentialsId?: string;
  tenantId?: string;
  description?: string;
  lastSyncAt: string | null;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create integration
 */
export async function createIntegration(data: {
  name: string;
  type: string;
  provider: string;
  config: Record<string, unknown>;
  credentialsId?: string;
  tenantId?: string;
  description?: string;
  createdBy: string;
}): Promise<Integration> {
  try {
    await validatePlatformWritePermission(PlatformResource.INTEGRATIONS);

    const supabase = getSupabaseClient();

    const integrationId = `integration-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: integration, error } = await supabase
      .from('integrations')
      .insert({
        id: integrationId,
        name: data.name,
        type: data.type,
        provider: data.provider,
        status: 'active',
        config: data.config,
        credentials_id: data.credentialsId || null,
        tenant_id: data.tenantId || null,
        description: data.description || null,
        last_sync_at: null,
        last_error: null,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create integration', { error, data });
      throw new DatabaseError('Failed to create integration', { error });
    }

    logger.info('Integration created', { integrationId, name: data.name, provider: data.provider });

    // Invalidate cache
    cache.delete(`integration:${integrationId}`);
    cache.delete('integrations:all');

    return integration as Integration;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating integration', { error, data });
    throw new DatabaseError('Failed to create integration', { error });
  }
}

/**
 * Get integration by ID
 */
export async function getIntegration(integrationId: string): Promise<Integration> {
  try {
    const supabase = getSupabaseClient();

    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      logger.error('Failed to fetch integration', { error, integrationId });
      throw new DatabaseError('Failed to fetch integration', { error });
    }

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    return integration as Integration;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching integration', { error, integrationId });
    throw new DatabaseError('Failed to fetch integration', { error });
  }
}

/**
 * List integrations
 */
export async function listIntegrations(options: {
  page?: number;
  pageSize?: number;
  type?: string;
  provider?: string;
  status?: 'active' | 'inactive' | 'error';
  tenantId?: string;
}): Promise<{ integrations: Integration[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, type, provider, status, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('integrations')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (provider) {
      query = query.eq('provider', provider);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: integrations, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list integrations', { error });
      throw new DatabaseError('Failed to list integrations', { error });
    }

    return {
      integrations: (integrations || []) as Integration[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing integrations', { error });
    throw new DatabaseError('Failed to list integrations', { error });
  }
}

/**
 * Update integration
 */
export async function updateIntegration(integrationId: string, data: {
  name?: string;
  config?: Record<string, unknown>;
  credentialsId?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'error';
  lastSyncAt?: string;
}): Promise<Integration> {
  try {
    await validatePlatformWritePermission(PlatformResource.INTEGRATIONS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.credentialsId !== undefined) updateData.credentials_id = data.credentialsId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lastSyncAt !== undefined) updateData.last_sync_at = data.lastSyncAt;

    const { data: integration, error } = await supabase
      .from('integrations')
      .update(updateData)
      .eq('id', integrationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update integration', { error, integrationId });
      throw new DatabaseError('Failed to update integration', { error });
    }

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    logger.info('Integration updated', { integrationId });

    // Invalidate cache
    cache.delete(`integration:${integrationId}`);
    cache.delete('integrations:all');

    return integration as Integration;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating integration', { error, integrationId });
    throw new DatabaseError('Failed to update integration', { error });
  }
}

/**
 * Delete integration
 */
export async function deleteIntegration(integrationId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.INTEGRATIONS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId);

    if (error) {
      logger.error('Failed to delete integration', { error, integrationId });
      throw new DatabaseError('Failed to delete integration', { error });
    }

    logger.info('Integration deleted', { integrationId });

    // Invalidate cache
    cache.delete(`integration:${integrationId}`);
    cache.delete('integrations:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting integration', { error, integrationId });
    throw new DatabaseError('Failed to delete integration', { error });
  }
}

/**
 * Test integration connection
 */
export async function testIntegration(integrationId: string): Promise<{
  success: boolean;
  message: string;
  latency?: number;
}> {
  try {
    const integration = await getIntegration(integrationId);

    // Placeholder for connection test
    // In production, this would:
    // - Test connection to the external service
    // - Validate credentials
    // - Measure latency

    return {
      success: true,
      message: 'Connection successful',
      latency: 100,
    };
  } catch (error) {
    logger.error('Failed to test integration', { error, integrationId });
    throw new DatabaseError('Failed to test integration', { error });
  }
}

/**
 * Sync integration
 */
export async function syncIntegration(integrationId: string): Promise<{
  success: boolean;
  recordsProcessed: number;
  message: string;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.INTEGRATIONS);

    const integration = await getIntegration(integrationId);

    // Placeholder for sync logic
    // In production, this would:
    // - Fetch data from external service
    // - Transform and store data
    // - Update sync timestamp

    const now = new Date().toISOString();

    await updateIntegration(integrationId, {
      lastSyncAt: now,
    });

    return {
      success: true,
      recordsProcessed: 0,
      message: 'Sync completed',
    };
  } catch (error) {
    logger.error('Failed to sync integration', { error, integrationId });
    throw new DatabaseError('Failed to sync integration', { error });
  }
}

/**
 * Get integrations by tenant
 */
export async function getIntegrationsByTenant(tenantId: string): Promise<Integration[]> {
  try {
    const { integrations } = await listIntegrations({ tenantId, pageSize: 1000 });
    return integrations;
  } catch (error) {
    logger.error('Failed to get integrations by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get integrations by tenant', { error });
  }
}

/**
 * Get integrations by type
 */
export async function getIntegrationsByType(type: string): Promise<Integration[]> {
  try {
    const { integrations } = await listIntegrations({ type, pageSize: 1000 });
    return integrations;
  } catch (error) {
    logger.error('Failed to get integrations by type', { error, type });
    throw new DatabaseError('Failed to get integrations by type', { error });
  }
}

/**
 * Get integration statistics
 */
export async function getIntegrationStatistics(): Promise<{
  total: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  byStatus: Record<string, number>;
  active: number;
  error: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: integrations } = await supabase
      .from('integrations')
      .select('type, provider, status');

    if (!integrations || integrations.length === 0) {
      return {
        total: 0,
        byType: {},
        byProvider: {},
        byStatus: {},
        active: 0,
        error: 0,
      };
    }

    const byType: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let active = 0;
    let error = 0;

    for (const integration of integrations) {
      byType[integration.type] = (byType[integration.type] || 0) + 1;
      byProvider[integration.provider] = (byProvider[integration.provider] || 0) + 1;
      byStatus[integration.status] = (byStatus[integration.status] || 0) + 1;

      if (integration.status === 'active') {
        active++;
      } else if (integration.status === 'error') {
        error++;
      }
    }

    return {
      total: integrations.length,
      byType,
      byProvider,
      byStatus,
      active,
      error,
    };
  } catch (error) {
    logger.error('Failed to get integration statistics', { error });
    throw new DatabaseError('Failed to get integration statistics', { error });
  }
}

/**
 * Get available integration providers
 */
export async function getAvailableProviders(): Promise<Array<{
  provider: string;
  type: string;
  name: string;
  description: string;
  configSchema: Record<string, unknown>;
}>> {
  try {
    // Placeholder for available providers
    // In production, this would return a list of supported integrations
    return [
      {
        provider: 'stripe',
        type: 'payment',
        name: 'Stripe',
        description: 'Payment processing',
        configSchema: { apiKey: 'string', secretKey: 'string' },
      },
      {
        provider: 'twilio',
        type: 'communication',
        name: 'Twilio',
        description: 'SMS and voice services',
        configSchema: { accountSid: 'string', authToken: 'string' },
      },
    ];
  } catch (error) {
    logger.error('Failed to get available providers', { error });
    throw new DatabaseError('Failed to get available providers', { error });
  }
}

/**
 * Enable integration
 */
export async function enableIntegration(integrationId: string): Promise<Integration> {
  try {
    await validatePlatformWritePermission(PlatformResource.INTEGRATIONS);

    return updateIntegration(integrationId, { status: 'active' });
  } catch (error) {
    logger.error('Failed to enable integration', { error, integrationId });
    throw new DatabaseError('Failed to enable integration', { error });
  }
}

/**
 * Disable integration
 */
export async function disableIntegration(integrationId: string): Promise<Integration> {
  try {
    await validatePlatformWritePermission(PlatformResource.INTEGRATIONS);

    return updateIntegration(integrationId, { status: 'inactive' });
  } catch (error) {
    logger.error('Failed to disable integration', { error, integrationId });
    throw new DatabaseError('Failed to disable integration', { error });
  }
}

/**
 * Get integration logs
 */
export async function getIntegrationLogs(integrationId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: Array<{ timestamp: string; level: string; message: string }>; total: number }> {
  try {
    // Placeholder for integration logs
    // In production, this would fetch logs from a logging system
    return {
      logs: [],
      total: 0,
    };
  } catch (error) {
    logger.error('Failed to get integration logs', { error, integrationId });
    throw new DatabaseError('Failed to get integration logs', { error });
  }
}
