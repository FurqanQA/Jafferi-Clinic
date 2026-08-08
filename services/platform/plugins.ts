import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Plugins Manager
// Plugin system for extending platform functionality
// ============================================================================

/**
 * Plugin interface
 */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  type: string;
  status: 'installed' | 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  tenantId?: string;
  description?: string;
  author?: string;
  installedAt: string;
  lastActivatedAt: string | null;
  lastError: string | null;
  createdBy: string;
  metadata: Record<string, unknown>;
}

/**
 * Install plugin
 */
export async function installPlugin(data: {
  name: string;
  version: string;
  type: string;
  config: Record<string, unknown>;
  tenantId?: string;
  description?: string;
  author?: string;
  createdBy: string;
}): Promise<Plugin> {
  try {
    await validatePlatformWritePermission(PlatformResource.PLUGINS);

    const supabase = getSupabaseClient();

    const pluginId = `plugin-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: plugin, error } = await supabase
      .from('plugins')
      .insert({
        id: pluginId,
        name: data.name,
        version: data.version,
        type: data.type,
        status: 'installed',
        config: data.config,
        tenant_id: data.tenantId || null,
        description: data.description || null,
        author: data.author || null,
        installed_at: now,
        last_activated_at: null,
        last_error: null,
        created_by: data.createdBy,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to install plugin', { error, data });
      throw new DatabaseError('Failed to install plugin', { error });
    }

    logger.info('Plugin installed', { pluginId, name: data.name, version: data.version });

    // Invalidate cache
    cache.delete(`plugin:${pluginId}`);
    cache.delete('plugins:all');

    return plugin as Plugin;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error installing plugin', { error, data });
    throw new DatabaseError('Failed to install plugin', { error });
  }
}

/**
 * Get plugin by ID
 */
export async function getPlugin(pluginId: string): Promise<Plugin> {
  try {
    const supabase = getSupabaseClient();

    const { data: plugin, error } = await supabase
      .from('plugins')
      .select('*')
      .eq('id', pluginId)
      .single();

    if (error) {
      logger.error('Failed to fetch plugin', { error, pluginId });
      throw new DatabaseError('Failed to fetch plugin', { error });
    }

    if (!plugin) {
      throw new NotFoundError('Plugin not found');
    }

    return plugin as Plugin;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching plugin', { error, pluginId });
    throw new DatabaseError('Failed to fetch plugin', { error });
  }
}

/**
 * List plugins
 */
export async function listPlugins(options: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: 'installed' | 'active' | 'inactive' | 'error';
  tenantId?: string;
}): Promise<{ plugins: Plugin[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, type, status, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('plugins')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: plugins, error, count } = await query
      .range(fromIndex, toIndex)
      .order('installed_at', { ascending: false });

    if (error) {
      logger.error('Failed to list plugins', { error });
      throw new DatabaseError('Failed to list plugins', { error });
    }

    return {
      plugins: (plugins || []) as Plugin[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing plugins', { error });
    throw new DatabaseError('Failed to list plugins', { error });
  }
}

/**
 * Update plugin
 */
export async function updatePlugin(pluginId: string, data: {
  config?: Record<string, unknown>;
  description?: string;
  status?: 'installed' | 'active' | 'inactive' | 'error';
}): Promise<Plugin> {
  try {
    await validatePlatformWritePermission(PlatformResource.PLUGINS);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};

    if (data.config !== undefined) updateData.config = data.config;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'active') {
        updateData.last_activated_at = new Date().toISOString();
      }
    }

    const { data: plugin, error } = await supabase
      .from('plugins')
      .update(updateData)
      .eq('id', pluginId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update plugin', { error, pluginId });
      throw new DatabaseError('Failed to update plugin', { error });
    }

    if (!plugin) {
      throw new NotFoundError('Plugin not found');
    }

    logger.info('Plugin updated', { pluginId });

    // Invalidate cache
    cache.delete(`plugin:${pluginId}`);
    cache.delete('plugins:all');

    return plugin as Plugin;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating plugin', { error, pluginId });
    throw new DatabaseError('Failed to update plugin', { error });
  }
}

/**
 * Delete plugin
 */
export async function deletePlugin(pluginId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.PLUGINS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('plugins')
      .delete()
      .eq('id', pluginId);

    if (error) {
      logger.error('Failed to delete plugin', { error, pluginId });
      throw new DatabaseError('Failed to delete plugin', { error });
    }

    logger.info('Plugin deleted', { pluginId });

    // Invalidate cache
    cache.delete(`plugin:${pluginId}`);
    cache.delete('plugins:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting plugin', { error, pluginId });
    throw new DatabaseError('Failed to delete plugin', { error });
  }
}

/**
 * Activate plugin
 */
export async function activatePlugin(pluginId: string): Promise<Plugin> {
  try {
    await validatePlatformWritePermission(PlatformResource.PLUGINS);

    return updatePlugin(pluginId, { status: 'active' });
  } catch (error) {
    logger.error('Failed to activate plugin', { error, pluginId });
    throw new DatabaseError('Failed to activate plugin', { error });
  }
}

/**
 * Deactivate plugin
 */
export async function deactivatePlugin(pluginId: string): Promise<Plugin> {
  try {
    await validatePlatformWritePermission(PlatformResource.PLUGINS);

    return updatePlugin(pluginId, { status: 'inactive' });
  } catch (error) {
    logger.error('Failed to deactivate plugin', { error, pluginId });
    throw new DatabaseError('Failed to deactivate plugin', { error });
  }
}

/**
 * Get plugins by tenant
 */
export async function getPluginsByTenant(tenantId: string): Promise<Plugin[]> {
  try {
    const { plugins } = await listPlugins({ tenantId, pageSize: 1000 });
    return plugins;
  } catch (error) {
    logger.error('Failed to get plugins by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get plugins by tenant', { error });
  }
}

/**
 * Get active plugins
 */
export async function getActivePlugins(): Promise<Plugin[]> {
  try {
    const { plugins } = await listPlugins({ status: 'active', pageSize: 1000 });
    return plugins;
  } catch (error) {
    logger.error('Failed to get active plugins', { error });
    throw new DatabaseError('Failed to get active plugins', { error });
  }
}

/**
 * Get plugin statistics
 */
export async function getPluginStatistics(): Promise<{
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  active: number;
  inactive: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: plugins } = await supabase
      .from('plugins')
      .select('type, status');

    if (!plugins || plugins.length === 0) {
      return {
        total: 0,
        byType: {},
        byStatus: {},
        active: 0,
        inactive: 0,
      };
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let active = 0;
    let inactive = 0;

    for (const plugin of plugins) {
      byType[plugin.type] = (byType[plugin.type] || 0) + 1;
      byStatus[plugin.status] = (byStatus[plugin.status] || 0) + 1;

      if (plugin.status === 'active') {
        active++;
      } else if (plugin.status === 'inactive') {
        inactive++;
      }
    }

    return {
      total: plugins.length,
      byType,
      byStatus,
      active,
      inactive,
    };
  } catch (error) {
    logger.error('Failed to get plugin statistics', { error });
    throw new DatabaseError('Failed to get plugin statistics', { error });
  }
}

/**
 * Get available plugins
 */
export async function getAvailablePlugins(): Promise<Array<{
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  author: string;
  configSchema: Record<string, unknown>;
}>> {
  try {
    // Placeholder for available plugins
    // In production, this would return a list of available plugins from a registry
    return [
      {
        id: 'plugin-1',
        name: 'Analytics Plugin',
        version: '1.0.0',
        type: 'analytics',
        description: 'Advanced analytics and reporting',
        author: 'Platform Team',
        configSchema: { enabled: 'boolean', apiKey: 'string' },
      },
      {
        id: 'plugin-2',
        name: 'Notifications Plugin',
        version: '1.0.0',
        type: 'notifications',
        description: 'Custom notification channels',
        author: 'Platform Team',
        configSchema: { channels: 'array', templates: 'object' },
      },
    ];
  } catch (error) {
    logger.error('Failed to get available plugins', { error });
    throw new DatabaseError('Failed to get available plugins', { error });
  }
}

/**
 * Validate plugin configuration
 */
export async function validatePluginConfig(pluginId: string, config: Record<string, unknown>): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  try {
    const plugin = await getPlugin(pluginId);

    // Placeholder for validation logic
    // In production, this would validate the config against a schema

    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    logger.error('Failed to validate plugin config', { error, pluginId });
    throw new DatabaseError('Failed to validate plugin config', { error });
  }
}

/**
 * Get plugin hooks
 */
export async function getPluginHooks(pluginId: string): Promise<Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}>> {
  try {
    const plugin = await getPlugin(pluginId);

    // Placeholder for plugin hooks
    // In production, this would return the hooks exposed by the plugin

    return [
      {
        name: 'onDataReceived',
        description: 'Called when data is received',
        parameters: { data: 'object', source: 'string' },
      },
    ];
  } catch (error) {
    logger.error('Failed to get plugin hooks', { error, pluginId });
    throw new DatabaseError('Failed to get plugin hooks', { error });
  }
}

/**
 * Execute plugin hook
 */
export async function executePluginHook(pluginId: string, hookName: string, data: Record<string, unknown>): Promise<{
  success: boolean;
  result: unknown;
  error?: string;
}> {
  try {
    const plugin = await getPlugin(pluginId);

    if (plugin.status !== 'active') {
      return {
        success: false,
        result: null,
        error: 'Plugin is not active',
      };
    }

    // Placeholder for hook execution
    // In production, this would execute the plugin hook

    return {
      success: true,
      result: null,
    };
  } catch (error) {
    logger.error('Failed to execute plugin hook', { error, pluginId, hookName });
    throw new DatabaseError('Failed to execute plugin hook', { error });
  }
}
