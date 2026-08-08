import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Owner Manager
// Owner management operations for tenants
// ============================================================================

/**
 * Owner interface
 */
export interface Owner {
  id: string;
  tenantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  settings: OwnerSettings;
}

/**
 * Owner Settings
 */
export interface OwnerSettings {
  receiveNotifications: boolean;
  receiveMarketingEmails: boolean;
  twoFactorEnabled: boolean;
  preferredLanguage: string;
  timezone: string;
}

/**
 * Create a new owner
 */
export async function createOwner(data: {
  tenantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  settings?: Partial<OwnerSettings>;
}): Promise<Owner> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Check if user is already an owner for this tenant
    const { data: existing } = await supabase
      .from('owners')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('user_id', data.userId)
      .single();

    if (existing) {
      throw new DatabaseError('User is already an owner for this tenant', { userId: data.userId });
    }

    // Create owner
    const ownerId = `owner-${Date.now()}`;
    const now = new Date().toISOString();

    const defaultSettings: OwnerSettings = {
      receiveNotifications: data.settings?.receiveNotifications ?? true,
      receiveMarketingEmails: data.settings?.receiveMarketingEmails ?? false,
      twoFactorEnabled: data.settings?.twoFactorEnabled ?? false,
      preferredLanguage: data.settings?.preferredLanguage || 'en',
      timezone: data.settings?.timezone || 'UTC',
    };

    const { data: owner, error } = await supabase
      .from('owners')
      .insert({
        id: ownerId,
        tenant_id: data.tenantId,
        user_id: data.userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        status: 'active',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        settings: defaultSettings,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create owner', { error, data });
      throw new DatabaseError('Failed to create owner', { error });
    }

    logger.info('Owner created successfully', { ownerId, tenantId: data.tenantId, userId: data.userId });

    // Invalidate cache
    cache.delete(`owner:${ownerId}`);
    cache.delete(`owner:user:${data.userId}:${data.tenantId}`);

    return owner as Owner;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating owner', { error, data });
    throw new DatabaseError('Failed to create owner', { error });
  }
}

/**
 * Update owner
 */
export async function updateOwner(ownerId: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Partial<OwnerSettings>;
}): Promise<Owner> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Get current owner to check tenant and user
    const { data: current } = await supabase
      .from('owners')
      .select('tenant_id, user_id')
      .eq('id', ownerId)
      .single();

    if (!current) {
      throw new NotFoundError('Owner not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.settings !== undefined) {
      updateData.settings = data.settings;
    }

    const { data: owner, error } = await supabase
      .from('owners')
      .update(updateData)
      .eq('id', ownerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update owner', { error, ownerId });
      throw new DatabaseError('Failed to update owner', { error });
    }

    if (!owner) {
      throw new NotFoundError('Owner not found');
    }

    logger.info('Owner updated successfully', { ownerId });

    // Invalidate cache
    cache.delete(`owner:${ownerId}`);
    cache.delete(`owner:user:${current.user_id}:${current.tenant_id}`);

    return owner as Owner;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating owner', { error, ownerId });
    throw new DatabaseError('Failed to update owner', { error });
  }
}

/**
 * Delete owner
 */
export async function deleteOwner(ownerId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', ownerId);

    if (error) {
      logger.error('Failed to delete owner', { error, ownerId });
      throw new DatabaseError('Failed to delete owner', { error });
    }

    logger.info('Owner deleted successfully', { ownerId });

    // Invalidate cache
    cache.delete(`owner:${ownerId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting owner', { error, ownerId });
    throw new DatabaseError('Failed to delete owner', { error });
  }
}

/**
 * Get owner by ID
 */
export async function getOwner(ownerId: string): Promise<Owner> {
  try {
    // Check cache first
    const cached = cache.get<Owner>(`owner:${ownerId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('id', ownerId)
      .single();

    if (error) {
      logger.error('Failed to fetch owner', { error, ownerId });
      throw new DatabaseError('Failed to fetch owner', { error });
    }

    if (!owner) {
      throw new NotFoundError('Owner not found');
    }

    // Cache result
    cache.set(`owner:${ownerId}`, owner, cacheHelpers.ttl.MEDIUM);

    return owner as Owner;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching owner', { error, ownerId });
    throw new DatabaseError('Failed to fetch owner', { error });
  }
}

/**
 * Get owner by user ID within tenant
 */
export async function getOwnerByUserId(tenantId: string, userId: string): Promise<Owner> {
  try {
    // Check cache first
    const cacheKey = `owner:user:${userId}:${tenantId}`;
    const cached = cache.get<Owner>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch owner by user ID', { error, userId, tenantId });
      throw new DatabaseError('Failed to fetch owner', { error });
    }

    if (!owner) {
      throw new NotFoundError('Owner not found');
    }

    // Cache result
    cache.set(cacheKey, owner, cacheHelpers.ttl.MEDIUM);
    cache.set(`owner:${owner.id}`, owner, cacheHelpers.ttl.MEDIUM);

    return owner as Owner;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching owner by user ID', { error, userId, tenantId });
    throw new DatabaseError('Failed to fetch owner', { error });
  }
}

/**
 * List owners for a tenant
 */
export async function listOwners(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
}): Promise<{ owners: Owner[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('owners')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: owners, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list owners', { error, tenantId });
      throw new DatabaseError('Failed to list owners', { error });
    }

    return {
      owners: (owners || []) as Owner[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing owners', { error, tenantId });
    throw new DatabaseError('Failed to list owners', { error });
  }
}

/**
 * Activate owner
 */
export async function activateOwner(ownerId: string): Promise<Owner> {
  return updateOwner(ownerId, { status: 'active' });
}

/**
 * Deactivate owner
 */
export async function deactivateOwner(ownerId: string): Promise<Owner> {
  return updateOwner(ownerId, { status: 'inactive' });
}

/**
 * Suspend owner
 */
export async function suspendOwner(ownerId: string): Promise<Owner> {
  return updateOwner(ownerId, { status: 'suspended' });
}

/**
 * Get owner statistics
 */
export async function getOwnerStatistics(tenantId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const [{ count: total }, { count: active }, { count: inactive }, { count: suspended }] = await Promise.all([
      supabase.from('owners').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('owners').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
      supabase.from('owners').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'inactive'),
      supabase.from('owners').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'suspended'),
    ]);

    return {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      suspended: suspended || 0,
    };
  } catch (error) {
    logger.error('Failed to get owner statistics', { error, tenantId });
    throw new DatabaseError('Failed to get owner statistics', { error });
  }
}
