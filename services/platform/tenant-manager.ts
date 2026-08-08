import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validateTenantCreate, validateTenantUpdate } from './platform-validation';
import { requireSuperAdmin, validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';
import { Tenant, TenantStatus, TenantSettings, TenantLimits, TenantUsage } from './platform-types';

// ============================================================================
// Tenant Manager
// Multi-tenant management operations
// ============================================================================

/**
 * Create a new tenant
 */
export async function createTenant(data: {
  name: string;
  slug: string;
  ownerId: string;
  planId?: string;
  settings?: Partial<TenantSettings>;
}): Promise<Tenant> {
  try {
    await requireSuperAdmin();
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const validated = validateTenantCreate(data);

    // Check if slug is already taken
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', validated.slug)
      .single();

    if (existing) {
      throw new DatabaseError('Slug already exists', { slug: validated.slug });
    }

    // Create tenant
    const tenantId = `tenant-${Date.now()}`;
    const now = new Date().toISOString();

    const defaultSettings: TenantSettings = {
      timezone: validated.settings?.timezone || 'UTC',
      locale: validated.settings?.locale || 'en',
      currency: validated.settings?.currency || 'USD',
      customDomain: validated.settings?.customDomain || null,
      branding: {
        logo: validated.settings?.branding?.logo || null,
        primaryColor: validated.settings?.branding?.primaryColor || '#3b82f6',
        secondaryColor: validated.settings?.branding?.secondaryColor || '#10b981',
        customCSS: validated.settings?.branding?.customCSS || null,
      },
      features: validated.settings?.features || {},
    };

    const defaultLimits: TenantLimits = {
      users: 10,
      patients: 100,
      appointments: 1000,
      storage: 10737418240, // 10GB
      apiCalls: 100000,
      aiTokens: 1000000,
    };

    const defaultUsage: TenantUsage = {
      users: 0,
      patients: 0,
      appointments: 0,
      storage: 0,
      apiCalls: 0,
      aiTokens: 0,
      periodStart: now,
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: validated.name,
        slug: validated.slug,
        status: TenantStatus.ACTIVE,
        owner_id: validated.ownerId,
        subscription_id: null,
        plan_id: validated.planId || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        settings: defaultSettings,
        limits: defaultLimits,
        usage: defaultUsage,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create tenant', { error, data: validated });
      throw new DatabaseError('Failed to create tenant', { error });
    }

    logger.info('Tenant created successfully', { tenantId, slug: validated.slug });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete(`tenant:slug:${validated.slug}`);

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating tenant', { error, data });
    throw new DatabaseError('Failed to create tenant', { error });
  }
}

/**
 * Update tenant
 */
export async function updateTenant(tenantId: string, data: {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  ownerId?: string;
  planId?: string | null;
  settings?: Partial<TenantSettings>;
}): Promise<Tenant> {
  try {
    await requireSuperAdmin();
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const validated = validateTenantUpdate(data);

    const supabase = getSupabaseClient();

    // Check if new slug is already taken (if changing slug)
    if (validated.slug) {
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', validated.slug)
        .neq('id', tenantId)
        .single();

      if (existing) {
        throw new DatabaseError('Slug already exists', { slug: validated.slug });
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.ownerId !== undefined) updateData.owner_id = validated.ownerId;
    if (validated.planId !== undefined) updateData.plan_id = validated.planId;
    if (validated.settings !== undefined) {
      updateData.settings = validated.settings;
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update tenant', { error, tenantId });
      throw new DatabaseError('Failed to update tenant', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    logger.info('Tenant updated successfully', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete(`tenant:slug:${tenant.slug}`);

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating tenant', { error, tenantId });
    throw new DatabaseError('Failed to update tenant', { error });
  }
}

/**
 * Delete tenant
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  try {
    await requireSuperAdmin();
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to delete tenant', { error, tenantId });
      throw new DatabaseError('Failed to delete tenant', { error });
    }

    logger.info('Tenant deleted successfully', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting tenant', { error, tenantId });
    throw new DatabaseError('Failed to delete tenant', { error });
  }
}

/**
 * Suspend tenant
 */
export async function suspendTenant(tenantId: string, reason: string): Promise<Tenant> {
  try {
    await requireSuperAdmin();
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        status: TenantStatus.SUSPENDED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to suspend tenant', { error, tenantId });
      throw new DatabaseError('Failed to suspend tenant', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    logger.info('Tenant suspended successfully', { tenantId, reason });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete(`tenant:slug:${tenant.slug}`);

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error suspending tenant', { error, tenantId });
    throw new DatabaseError('Failed to suspend tenant', { error });
  }
}

/**
 * Restore tenant
 */
export async function restoreTenant(tenantId: string, planId?: string): Promise<Tenant> {
  try {
    await requireSuperAdmin();
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      status: TenantStatus.ACTIVE,
      updated_at: new Date().toISOString(),
    };

    if (planId) {
      updateData.plan_id = planId;
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to restore tenant', { error, tenantId });
      throw new DatabaseError('Failed to restore tenant', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    logger.info('Tenant restored successfully', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete(`tenant:slug:${tenant.slug}`);

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring tenant', { error, tenantId });
    throw new DatabaseError('Failed to restore tenant', { error });
  }
}

/**
 * Get tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant> {
  try {
    // Check cache first
    const cached = cache.get<Tenant>(`tenant:${tenantId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      logger.error('Failed to fetch tenant', { error, tenantId });
      throw new DatabaseError('Failed to fetch tenant', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Cache result
    cache.set(`tenant:${tenantId}`, tenant, cacheHelpers.ttl.MEDIUM);

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching tenant', { error, tenantId });
    throw new DatabaseError('Failed to fetch tenant', { error });
  }
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant> {
  try {
    // Check cache first
    const cached = cache.get<Tenant>(`tenant:slug:${slug}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      logger.error('Failed to fetch tenant by slug', { error, slug });
      throw new DatabaseError('Failed to fetch tenant', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Cache result
    cache.set(`tenant:slug:${slug}`, tenant, cacheHelpers.ttl.MEDIUM);
    cache.set(`tenant:${tenant.id}`, tenant, cacheHelpers.ttl.MEDIUM);

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching tenant by slug', { error, slug });
    throw new DatabaseError('Failed to fetch tenant', { error });
  }
}

/**
 * List tenants with pagination
 */
export async function listTenants(options: {
  page?: number;
  pageSize?: number;
  status?: TenantStatus;
  search?: string;
}): Promise<{ tenants: Tenant[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase.from('tenants').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: tenants, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list tenants', { error });
      throw new DatabaseError('Failed to list tenants', { error });
    }

    return {
      tenants: (tenants || []) as Tenant[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing tenants', { error });
    throw new DatabaseError('Failed to list tenants', { error });
  }
}

/**
 * Get tenant statistics
 */
export async function getTenantStatistics(tenantId: string): Promise<{
  users: number;
  patients: number;
  appointments: number;
  storage: number;
  apiCalls: number;
  aiTokens: number;
  limits: TenantLimits;
}> {
  try {
    const tenant = await getTenant(tenantId);

    return {
      users: tenant.usage.users,
      patients: tenant.usage.patients,
      appointments: tenant.usage.appointments,
      storage: tenant.usage.storage,
      apiCalls: tenant.usage.apiCalls,
      aiTokens: tenant.usage.aiTokens,
      limits: tenant.limits,
    };
  } catch (error) {
    logger.error('Failed to get tenant statistics', { error, tenantId });
    throw error;
  }
}

/**
 * Check if tenant has exceeded limits
 */
export async function checkTenantLimits(tenantId: string): Promise<{
  withinLimits: boolean;
  exceeded: string[];
}> {
  try {
    const stats = await getTenantStatistics(tenantId);
    const exceeded: string[] = [];

    if (stats.users > stats.limits.users) exceeded.push('users');
    if (stats.patients > stats.limits.patients) exceeded.push('patients');
    if (stats.appointments > stats.limits.appointments) exceeded.push('appointments');
    if (stats.storage > stats.limits.storage) exceeded.push('storage');
    if (stats.apiCalls > stats.limits.apiCalls) exceeded.push('apiCalls');
    if (stats.aiTokens > stats.limits.aiTokens) exceeded.push('aiTokens');

    return {
      withinLimits: exceeded.length === 0,
      exceeded,
    };
  } catch (error) {
    logger.error('Failed to check tenant limits', { error, tenantId });
    throw error;
  }
}
