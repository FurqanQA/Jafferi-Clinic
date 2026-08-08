import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Module Manager
// Platform module management and orchestration
// ============================================================================

/**
 * Module interface
 */
export interface Module {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  category: string;
  dependencies: string[];
  config: Record<string, unknown>;
  isEnabled: boolean;
  isCore: boolean;
  isBeta: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Module installation status
 */
export interface ModuleInstallation {
  moduleId: string;
  tenantId: string;
  status: 'pending' | 'installing' | 'installed' | 'failed' | 'uninstalling' | 'uninstalled';
  installedAt: string | null;
  config: Record<string, unknown>;
  error: string | null;
}

/**
 * Create a new module
 */
export async function createModule(data: {
  key: string;
  name: string;
  description: string;
  version: string;
  category: string;
  dependencies?: string[];
  config?: Record<string, unknown>;
  isCore?: boolean;
  isBeta?: boolean;
}): Promise<Module> {
  try {
    await validatePlatformWritePermission(PlatformResource.MODULES);

    const supabase = getSupabaseClient();

    // Check if key is already taken
    const { data: existing } = await supabase
      .from('modules')
      .select('id')
      .eq('key', data.key)
      .single();

    if (existing) {
      throw new DatabaseError('Module key already exists', { key: data.key });
    }

    // Create module
    const moduleId = `module-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        id: moduleId,
        key: data.key,
        name: data.name,
        description: data.description,
        version: data.version,
        category: data.category,
        dependencies: data.dependencies || [],
        config: data.config || {},
        is_enabled: false,
        is_core: data.isCore ?? false,
        is_beta: data.isBeta ?? false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create module', { error, data });
      throw new DatabaseError('Failed to create module', { error });
    }

    logger.info('Module created successfully', { moduleId, key: data.key });

    // Invalidate cache
    cache.delete(`module:${moduleId}`);
    cache.delete(`module:key:${data.key}`);

    return module as Module;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating module', { error, data });
    throw new DatabaseError('Failed to create module', { error });
  }
}

/**
 * Update module
 */
export async function updateModule(moduleId: string, data: {
  name?: string;
  description?: string;
  version?: string;
  category?: string;
  dependencies?: string[];
  config?: Record<string, unknown>;
  isBeta?: boolean;
  isEnabled?: boolean;
}): Promise<Module> {
  try {
    await validatePlatformWritePermission(PlatformResource.MODULES);

    const supabase = getSupabaseClient();

    // Get current module
    const { data: current } = await supabase
      .from('modules')
      .select('key')
      .eq('id', moduleId)
      .single();

    if (!current) {
      throw new NotFoundError('Module not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.version !== undefined) updateData.version = data.version;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.dependencies !== undefined) updateData.dependencies = data.dependencies;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.isBeta !== undefined) updateData.is_beta = data.isBeta;
    if (data.isEnabled !== undefined) updateData.is_enabled = data.isEnabled;

    const { data: module, error } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', moduleId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update module', { error, moduleId });
      throw new DatabaseError('Failed to update module', { error });
    }

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    logger.info('Module updated successfully', { moduleId });

    // Invalidate cache
    cache.delete(`module:${moduleId}`);
    cache.delete(`module:key:${current.key}`);

    return module as Module;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating module', { error, moduleId });
    throw new DatabaseError('Failed to update module', { error });
  }
}

/**
 * Delete module
 */
export async function deleteModule(moduleId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.MODULES);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      logger.error('Failed to delete module', { error, moduleId });
      throw new DatabaseError('Failed to delete module', { error });
    }

    logger.info('Module deleted successfully', { moduleId });

    // Invalidate cache
    cache.delete(`module:${moduleId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting module', { error, moduleId });
    throw new DatabaseError('Failed to delete module', { error });
  }
}

/**
 * Get module by ID
 */
export async function getModule(moduleId: string): Promise<Module> {
  try {
    // Check cache first
    const cached = cache.get<Module>(`module:${moduleId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: module, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error) {
      logger.error('Failed to fetch module', { error, moduleId });
      throw new DatabaseError('Failed to fetch module', { error });
    }

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Cache result
    cache.set(`module:${moduleId}`, module, cacheHelpers.ttl.MEDIUM);

    return module as Module;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching module', { error, moduleId });
    throw new DatabaseError('Failed to fetch module', { error });
  }
}

/**
 * Get module by key
 */
export async function getModuleByKey(key: string): Promise<Module> {
  try {
    // Check cache first
    const cacheKey = `module:key:${key}`;
    const cached = cache.get<Module>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: module, error } = await supabase
      .from('modules')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      logger.error('Failed to fetch module by key', { error, key });
      throw new DatabaseError('Failed to fetch module', { error });
    }

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Cache result
    cache.set(cacheKey, module, cacheHelpers.ttl.MEDIUM);
    cache.set(`module:${module.id}`, module, cacheHelpers.ttl.MEDIUM);

    return module as Module;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching module by key', { error, key });
    throw new DatabaseError('Failed to fetch module', { error });
  }
}

/**
 * Install module for tenant
 */
export async function installModule(moduleKey: string, tenantId: string, config?: Record<string, unknown>): Promise<ModuleInstallation> {
  try {
    await validatePlatformWritePermission(PlatformResource.MODULES);

    const supabase = getSupabaseClient();

    const module = await getModuleByKey(moduleKey);

    // Check if already installed
    const { data: existing } = await supabase
      .from('module_installations')
      .select('id')
      .eq('module_id', module.id)
      .eq('tenant_id', tenantId)
      .single();

    if (existing) {
      throw new DatabaseError('Module already installed for tenant', { moduleKey, tenantId });
    }

    // Create installation record
    const installationId = `install-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: installation, error } = await supabase
      .from('module_installations')
      .insert({
        id: installationId,
        module_id: module.id,
        tenant_id: tenantId,
        status: 'installing',
        installed_at: null,
        config: config || {},
        error: null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to install module', { error, moduleKey, tenantId });
      throw new DatabaseError('Failed to install module', { error });
    }

    logger.info('Module installation started', { installationId, moduleKey, tenantId });

    // Invalidate cache
    cache.delete(`modules:tenant:${tenantId}`);

    // Simulate installation (in real implementation, this would trigger actual installation logic)
    await updateModuleInstallation(installationId, { status: 'installed', installedAt: now });

    return installation as ModuleInstallation;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error installing module', { error, moduleKey, tenantId });
    throw new DatabaseError('Failed to install module', { error });
  }
}

/**
 * Uninstall module for tenant
 */
export async function uninstallModule(moduleKey: string, tenantId: string): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.MODULES);

    const supabase = getSupabaseClient();

    const module = await getModuleByKey(moduleKey);

    // Get installation record
    const { data: installation } = await supabase
      .from('module_installations')
      .select('id')
      .eq('module_id', module.id)
      .eq('tenant_id', tenantId)
      .single();

    if (!installation) {
      throw new NotFoundError('Module not installed for tenant');
    }

    // Update status to uninstalling
    await updateModuleInstallation(installation.id, { status: 'uninstalling' });

    // Simulate uninstallation
    await updateModuleInstallation(installation.id, { status: 'uninstalled' });

    logger.info('Module uninstalled successfully', { moduleKey, tenantId });

    // Invalidate cache
    cache.delete(`modules:tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error uninstalling module', { error, moduleKey, tenantId });
    throw new DatabaseError('Failed to uninstall module', { error });
  }
}

/**
 * Update module installation
 */
async function updateModuleInstallation(installationId: string, data: {
  status?: 'pending' | 'installing' | 'installed' | 'failed' | 'uninstalling' | 'uninstalled';
  installedAt?: string | null;
  error?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.installedAt !== undefined) updateData.installed_at = data.installedAt;
    if (data.error !== undefined) updateData.error = data.error;

    const { error } = await supabase
      .from('module_installations')
      .update(updateData)
      .eq('id', installationId);

    if (error) {
      logger.error('Failed to update module installation', { error, installationId });
      throw new DatabaseError('Failed to update module installation', { error });
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating module installation', { error, installationId });
    throw new DatabaseError('Failed to update module installation', { error });
  }
}

/**
 * List modules
 */
export async function listModules(options: {
  page?: number;
  pageSize?: number;
  category?: string;
  isCore?: boolean;
  isBeta?: boolean;
  isEnabled?: boolean;
  search?: string;
}): Promise<{ modules: Module[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, category, isCore, isBeta, isEnabled, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('modules')
      .select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (isCore !== undefined) {
      query = query.eq('is_core', isCore);
    }

    if (isBeta !== undefined) {
      query = query.eq('is_beta', isBeta);
    }

    if (isEnabled !== undefined) {
      query = query.eq('is_enabled', isEnabled);
    }

    if (search) {
      query = query.or(`key.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: modules, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list modules', { error });
      throw new DatabaseError('Failed to list modules', { error });
    }

    return {
      modules: (modules || []) as Module[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing modules', { error });
    throw new DatabaseError('Failed to list modules', { error });
  }
}

/**
 * Get installed modules for tenant
 */
export async function getTenantModules(tenantId: string): Promise<Module[]> {
  try {
    const cacheKey = `modules:tenant:${tenantId}`;
    const cached = cache.get<Module[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: installations } = await supabase
      .from('module_installations')
      .select('module_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'installed');

    if (!installations || installations.length === 0) {
      cache.set(cacheKey, [], cacheHelpers.ttl.SHORT);
      return [];
    }

    const moduleIds = installations.map((i: { module_id: string }) => i.module_id);

    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .in('id', moduleIds)
      .eq('is_enabled', true);

    const result = (modules || []) as Module[];
    cache.set(cacheKey, result, cacheHelpers.ttl.SHORT);
    return result;
  } catch (error) {
    logger.error('Failed to get tenant modules', { error, tenantId });
    throw new DatabaseError('Failed to get tenant modules', { error });
  }
}

/**
 * Get module categories
 */
export async function getModuleCategories(): Promise<string[]> {
  try {
    const cacheKey = 'module:categories';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: modules } = await supabase
      .from('modules')
      .select('category');

    const categories = new Set<string>();
    for (const module of modules || []) {
      categories.add(module.category);
    }

    const result = Array.from(categories);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get module categories', { error });
    throw new DatabaseError('Failed to get module categories', { error });
  }
}

/**
 * Check module dependencies
 */
export async function checkModuleDependencies(moduleKey: string, tenantId: string): Promise<{
  satisfied: boolean;
  missing: string[];
  circular: boolean;
}> {
  try {
    const module = await getModuleByKey(moduleKey);
    const installedModules = await getTenantModules(tenantId);
    const installedKeys = new Set(installedModules.map(m => m.key));

    const missing: string[] = [];

    // Check for circular dependencies
    function hasCircular(key: string, path: Set<string>): boolean {
      if (path.has(key)) return true;
      path.add(key);
      
      const deps = module.dependencies;
      for (const dep of deps) {
        if (hasCircular(dep, new Set(path))) return true;
      }
      return false;
    }

    if (hasCircular(moduleKey, new Set())) {
      return { satisfied: false, missing, circular: true };
    }

    // Check if all dependencies are installed
    for (const depKey of module.dependencies) {
      if (!installedKeys.has(depKey)) {
        missing.push(depKey);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
      circular: false,
    };
  } catch (error) {
    logger.error('Failed to check module dependencies', { error, moduleKey });
    throw new DatabaseError('Failed to check module dependencies', { error });
  }
}

/**
 * Enable module globally
 */
export async function enableModule(moduleId: string): Promise<Module> {
  return updateModule(moduleId, { isEnabled: true });
}

/**
 * Disable module globally
 */
export async function disableModule(moduleId: string): Promise<Module> {
  return updateModule(moduleId, { isEnabled: false });
}

/**
 * Get core modules
 */
export async function getCoreModules(): Promise<Module[]> {
  try {
    const { modules } = await listModules({ isCore: true, pageSize: 100 });
    return modules;
  } catch (error) {
    logger.error('Failed to get core modules', { error });
    throw new DatabaseError('Failed to get core modules', { error });
  }
}

/**
 * Get beta modules
 */
export async function getBetaModules(): Promise<Module[]> {
  try {
    const { modules } = await listModules({ isBeta: true, pageSize: 100 });
    return modules;
  } catch (error) {
    logger.error('Failed to get beta modules', { error });
    throw new DatabaseError('Failed to get beta modules', { error });
  }
}
