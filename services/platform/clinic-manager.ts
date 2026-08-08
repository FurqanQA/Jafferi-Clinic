import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';
import { Clinic, ClinicStatus, ClinicSettings } from './platform-types';

// ============================================================================
// Clinic Manager
// Clinic management operations within tenant context
// ============================================================================

/**
 * Create a new clinic
 */
export async function createClinic(data: {
  tenantId: string;
  name: string;
  slug: string;
  ownerId: string;
  settings?: Partial<ClinicSettings>;
}): Promise<Clinic> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Check if slug is already taken within tenant
    const { data: existing } = await supabase
      .from('clinics')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('slug', data.slug)
      .single();

    if (existing) {
      throw new DatabaseError('Slug already exists in this tenant', { slug: data.slug });
    }

    // Create clinic
    const clinicId = `clinic-${Date.now()}`;
    const now = new Date().toISOString();

    const defaultSettings: ClinicSettings = {
      timezone: data.settings?.timezone || 'UTC',
      locale: data.settings?.locale || 'en',
      currency: data.settings?.currency || 'USD',
      businessHours: data.settings?.businessHours || {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '13:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
      appointmentSettings: data.settings?.appointmentSettings || {
        defaultDuration: 30,
        slotInterval: 15,
        allowWalkIns: false,
        requireConfirmation: true,
        cancellationDeadline: 24,
      },
      notifications: data.settings?.notifications || {
        email: true,
        sms: false,
        appointmentReminders: true,
        reminderHours: 24,
      },
    };

    const { data: clinic, error } = await supabase
      .from('clinics')
      .insert({
        id: clinicId,
        tenant_id: data.tenantId,
        name: data.name,
        slug: data.slug,
        status: ClinicStatus.ACTIVE,
        owner_id: data.ownerId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        settings: defaultSettings,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create clinic', { error, data });
      throw new DatabaseError('Failed to create clinic', { error });
    }

    logger.info('Clinic created successfully', { clinicId, tenantId: data.tenantId, slug: data.slug });

    // Invalidate cache
    cache.delete(`clinic:${clinicId}`);
    cache.delete(`clinic:slug:${data.slug}:${data.tenantId}`);

    return clinic as Clinic;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating clinic', { error, data });
    throw new DatabaseError('Failed to create clinic', { error });
  }
}

/**
 * Update clinic
 */
export async function updateClinic(clinicId: string, data: {
  name?: string;
  slug?: string;
  status?: ClinicStatus;
  ownerId?: string;
  settings?: Partial<ClinicSettings>;
}): Promise<Clinic> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Get current clinic to check tenant
    const { data: current } = await supabase
      .from('clinics')
      .select('tenant_id, slug')
      .eq('id', clinicId)
      .single();

    if (!current) {
      throw new NotFoundError('Clinic not found');
    }

    // Check if new slug is already taken (if changing slug)
    if (data.slug) {
      const { data: existing } = await supabase
        .from('clinics')
        .select('id')
        .eq('tenant_id', current.tenant_id)
        .eq('slug', data.slug)
        .neq('id', clinicId)
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
    if (data.status !== undefined) updateData.status = data.status;
    if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
    if (data.settings !== undefined) {
      updateData.settings = data.settings;
    }

    const { data: clinic, error } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update clinic', { error, clinicId });
      throw new DatabaseError('Failed to update clinic', { error });
    }

    if (!clinic) {
      throw new NotFoundError('Clinic not found');
    }

    logger.info('Clinic updated successfully', { clinicId });

    // Invalidate cache
    cache.delete(`clinic:${clinicId}`);
    cache.delete(`clinic:slug:${current.slug}:${current.tenant_id}`);
    cache.delete(`clinic:slug:${clinic.slug}:${current.tenant_id}`);

    return clinic as Clinic;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating clinic', { error, clinicId });
    throw new DatabaseError('Failed to update clinic', { error });
  }
}

/**
 * Delete clinic
 */
export async function deleteClinic(clinicId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('clinics')
      .delete()
      .eq('id', clinicId);

    if (error) {
      logger.error('Failed to delete clinic', { error, clinicId });
      throw new DatabaseError('Failed to delete clinic', { error });
    }

    logger.info('Clinic deleted successfully', { clinicId });

    // Invalidate cache
    cache.delete(`clinic:${clinicId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting clinic', { error, clinicId });
    throw new DatabaseError('Failed to delete clinic', { error });
  }
}

/**
 * Get clinic by ID
 */
export async function getClinic(clinicId: string): Promise<Clinic> {
  try {
    // Check cache first
    const cached = cache.get<Clinic>(`clinic:${clinicId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch clinic', { error, clinicId });
      throw new DatabaseError('Failed to fetch clinic', { error });
    }

    if (!clinic) {
      throw new NotFoundError('Clinic not found');
    }

    // Cache result
    cache.set(`clinic:${clinicId}`, clinic, cacheHelpers.ttl.MEDIUM);

    return clinic as Clinic;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching clinic', { error, clinicId });
    throw new DatabaseError('Failed to fetch clinic', { error });
  }
}

/**
 * Get clinic by slug within tenant
 */
export async function getClinicBySlug(tenantId: string, slug: string): Promise<Clinic> {
  try {
    // Check cache first
    const cacheKey = `clinic:slug:${slug}:${tenantId}`;
    const cached = cache.get<Clinic>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .single();

    if (error) {
      logger.error('Failed to fetch clinic by slug', { error, slug, tenantId });
      throw new DatabaseError('Failed to fetch clinic', { error });
    }

    if (!clinic) {
      throw new NotFoundError('Clinic not found');
    }

    // Cache result
    cache.set(cacheKey, clinic, cacheHelpers.ttl.MEDIUM);
    cache.set(`clinic:${clinic.id}`, clinic, cacheHelpers.ttl.MEDIUM);

    return clinic as Clinic;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching clinic by slug', { error, slug, tenantId });
    throw new DatabaseError('Failed to fetch clinic', { error });
  }
}

/**
 * List clinics for a tenant
 */
export async function listClinics(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  status?: ClinicStatus;
  search?: string;
}): Promise<{ clinics: Clinic[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('clinics')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: clinics, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list clinics', { error, tenantId });
      throw new DatabaseError('Failed to list clinics', { error });
    }

    return {
      clinics: (clinics || []) as Clinic[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing clinics', { error, tenantId });
    throw new DatabaseError('Failed to list clinics', { error });
  }
}

/**
 * Activate clinic
 */
export async function activateClinic(clinicId: string): Promise<Clinic> {
  return updateClinic(clinicId, { status: ClinicStatus.ACTIVE });
}

/**
 * Deactivate clinic
 */
export async function deactivateClinic(clinicId: string): Promise<Clinic> {
  return updateClinic(clinicId, { status: ClinicStatus.INACTIVE });
}

/**
 * Get clinic statistics
 */
export async function getClinicStatistics(clinicId: string): Promise<{
  doctors: number;
  patients: number;
  appointments: number;
  revenue: number;
}> {
  try {
    const supabase = getSupabaseClient();

    // Get counts
    const [{ count: doctors }, { count: patients }, { count: appointments }] = await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
    ]);

    // Get revenue (placeholder - would need actual billing table)
    const revenue = 0;

    return {
      doctors: doctors || 0,
      patients: patients || 0,
      appointments: appointments || 0,
      revenue,
    };
  } catch (error) {
    logger.error('Failed to get clinic statistics', { error, clinicId });
    throw new DatabaseError('Failed to get clinic statistics', { error });
  }
}
