import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Organization Manager
// Organization management operations
// ============================================================================

/**
 * Organization interface
 */
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  type: 'healthcare' | 'clinic' | 'hospital' | 'laboratory' | 'pharmacy';
  status: 'active' | 'inactive' | 'suspended';
  ownerId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  settings: OrganizationSettings;
}

/**
 * Organization Settings
 */
export interface OrganizationSettings {
  timezone: string;
  locale: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  address: Address;
  taxId: string | null;
  licenseNumber: string | null;
}

/**
 * Address
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  tenantId: string;
  name: string;
  slug: string;
  type: 'healthcare' | 'clinic' | 'hospital' | 'laboratory' | 'pharmacy';
  ownerId: string;
  parentId?: string;
  settings?: Partial<OrganizationSettings>;
}): Promise<Organization> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Check if slug is already taken within tenant
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('slug', data.slug)
      .single();

    if (existing) {
      throw new DatabaseError('Slug already exists in this tenant', { slug: data.slug });
    }

    // Create organization
    const organizationId = `org-${Date.now()}`;
    const now = new Date().toISOString();

    const defaultSettings: OrganizationSettings = {
      timezone: data.settings?.timezone || 'UTC',
      locale: data.settings?.locale || 'en',
      currency: data.settings?.currency || 'USD',
      contactEmail: data.settings?.contactEmail || '',
      contactPhone: data.settings?.contactPhone || '',
      address: data.settings?.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      taxId: data.settings?.taxId || null,
      licenseNumber: data.settings?.licenseNumber || null,
    };

    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        id: organizationId,
        tenant_id: data.tenantId,
        name: data.name,
        slug: data.slug,
        type: data.type,
        status: 'active',
        owner_id: data.ownerId,
        parent_id: data.parentId || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        settings: defaultSettings,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create organization', { error, data });
      throw new DatabaseError('Failed to create organization', { error });
    }

    logger.info('Organization created successfully', { organizationId, tenantId: data.tenantId, slug: data.slug });

    // Invalidate cache
    cache.delete(`organization:${organizationId}`);
    cache.delete(`organization:slug:${data.slug}:${data.tenantId}`);

    return organization as Organization;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating organization', { error, data });
    throw new DatabaseError('Failed to create organization', { error });
  }
}

/**
 * Update organization
 */
export async function updateOrganization(organizationId: string, data: {
  name?: string;
  slug?: string;
  type?: 'healthcare' | 'clinic' | 'hospital' | 'laboratory' | 'pharmacy';
  status?: 'active' | 'inactive' | 'suspended';
  ownerId?: string;
  parentId?: string | null;
  settings?: Partial<OrganizationSettings>;
}): Promise<Organization> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Get current organization to check tenant
    const { data: current } = await supabase
      .from('organizations')
      .select('tenant_id, slug')
      .eq('id', organizationId)
      .single();

    if (!current) {
      throw new NotFoundError('Organization not found');
    }

    // Check if new slug is already taken (if changing slug)
    if (data.slug) {
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('tenant_id', current.tenant_id)
        .eq('slug', data.slug)
        .neq('id', organizationId)
        .single();

      if (existing) {
        throw new DatabaseError('Slug already exists in this tenant', { slug: data.slug });
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.settings !== undefined) {
      updateData.settings = data.settings;
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update organization', { error, organizationId });
      throw new DatabaseError('Failed to update organization', { error });
    }

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    logger.info('Organization updated successfully', { organizationId });

    // Invalidate cache
    cache.delete(`organization:${organizationId}`);
    cache.delete(`organization:slug:${current.slug}:${current.tenant_id}`);
    cache.delete(`organization:slug:${organization.slug}:${current.tenant_id}`);

    return organization as Organization;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating organization', { error, organizationId });
    throw new DatabaseError('Failed to update organization', { error });
  }
}

/**
 * Delete organization
 */
export async function deleteOrganization(organizationId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      logger.error('Failed to delete organization', { error, organizationId });
      throw new DatabaseError('Failed to delete organization', { error });
    }

    logger.info('Organization deleted successfully', { organizationId });

    // Invalidate cache
    cache.delete(`organization:${organizationId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting organization', { error, organizationId });
    throw new DatabaseError('Failed to delete organization', { error });
  }
}

/**
 * Get organization by ID
 */
export async function getOrganization(organizationId: string): Promise<Organization> {
  try {
    // Check cache first
    const cached = cache.get<Organization>(`organization:${organizationId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) {
      logger.error('Failed to fetch organization', { error, organizationId });
      throw new DatabaseError('Failed to fetch organization', { error });
    }

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Cache result
    cache.set(`organization:${organizationId}`, organization, cacheHelpers.ttl.MEDIUM);

    return organization as Organization;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching organization', { error, organizationId });
    throw new DatabaseError('Failed to fetch organization', { error });
  }
}

/**
 * Get organization by slug within tenant
 */
export async function getOrganizationBySlug(tenantId: string, slug: string): Promise<Organization> {
  try {
    // Check cache first
    const cacheKey = `organization:slug:${slug}:${tenantId}`;
    const cached = cache.get<Organization>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .single();

    if (error) {
      logger.error('Failed to fetch organization by slug', { error, slug, tenantId });
      throw new DatabaseError('Failed to fetch organization', { error });
    }

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Cache result
    cache.set(cacheKey, organization, cacheHelpers.ttl.MEDIUM);
    cache.set(`organization:${organization.id}`, organization, cacheHelpers.ttl.MEDIUM);

    return organization as Organization;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching organization by slug', { error, slug, tenantId });
    throw new DatabaseError('Failed to fetch organization', { error });
  }
}

/**
 * List organizations for a tenant
 */
export async function listOrganizations(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'suspended';
  type?: 'healthcare' | 'clinic' | 'hospital' | 'laboratory' | 'pharmacy';
  search?: string;
}): Promise<{ organizations: Organization[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, type, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: organizations, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list organizations', { error, tenantId });
      throw new DatabaseError('Failed to list organizations', { error });
    }

    return {
      organizations: (organizations || []) as Organization[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing organizations', { error, tenantId });
    throw new DatabaseError('Failed to list organizations', { error });
  }
}

/**
 * Get child organizations
 */
export async function getChildOrganizations(parentId: string): Promise<Organization[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch child organizations', { error, parentId });
      throw new DatabaseError('Failed to fetch child organizations', { error });
    }

    return (organizations || []) as Organization[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching child organizations', { error, parentId });
    throw new DatabaseError('Failed to fetch child organizations', { error });
  }
}

/**
 * Activate organization
 */
export async function activateOrganization(organizationId: string): Promise<Organization> {
  return updateOrganization(organizationId, { status: 'active' });
}

/**
 * Deactivate organization
 */
export async function deactivateOrganization(organizationId: string): Promise<Organization> {
  return updateOrganization(organizationId, { status: 'inactive' });
}
