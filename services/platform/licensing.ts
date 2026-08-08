import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Licensing Manager
// License management operations for tenants
// ============================================================================

/**
 * License interface
 */
export interface License {
  id: string;
  tenantId: string;
  key: string;
  type: 'trial' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  features: string[];
  limits: LicenseLimits;
  expiresAt: string | null;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * License Limits
 */
export interface LicenseLimits {
  users: number;
  patients: number;
  appointments: number;
  storage: number; // in bytes
  apiCalls: number;
  aiTokens: number;
}

/**
 * Generate a license key
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  return key;
}

/**
 * Create a new license
 */
export async function createLicense(data: {
  tenantId: string;
  type: 'trial' | 'standard' | 'premium' | 'enterprise';
  features: string[];
  limits: Partial<LicenseLimits>;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<License> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Check if tenant already has an active license
    const { data: existing } = await supabase
      .from('licenses')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('status', 'active')
      .single();

    if (existing) {
      throw new DatabaseError('Tenant already has an active license', { tenantId: data.tenantId });
    }

    // Create license
    const licenseId = `license-${Date.now()}`;
    const now = new Date().toISOString();
    const key = generateLicenseKey();

    const defaultLimits: LicenseLimits = {
      users: data.limits.users || 10,
      patients: data.limits.patients || 100,
      appointments: data.limits.appointments || 1000,
      storage: data.limits.storage || 10737418240, // 10GB
      apiCalls: data.limits.apiCalls || 100000,
      aiTokens: data.limits.aiTokens || 1000000,
    };

    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        id: licenseId,
        tenant_id: data.tenantId,
        key,
        type: data.type,
        status: 'active',
        features: data.features,
        limits: defaultLimits,
        expires_at: data.expiresAt || null,
        issued_at: now,
        created_at: now,
        updated_at: now,
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create license', { error, data });
      throw new DatabaseError('Failed to create license', { error });
    }

    logger.info('License created successfully', { licenseId, tenantId: data.tenantId, key });

    // Invalidate cache
    cache.delete(`license:${licenseId}`);
    cache.delete(`license:tenant:${data.tenantId}`);
    cache.delete(`license:key:${key}`);

    return license as License;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating license', { error, data });
    throw new DatabaseError('Failed to create license', { error });
  }
}

/**
 * Update license
 */
export async function updateLicense(licenseId: string, data: {
  features?: string[];
  limits?: Partial<LicenseLimits>;
  expiresAt?: string | null;
  status?: 'active' | 'expired' | 'revoked' | 'suspended';
  metadata?: Record<string, unknown>;
}): Promise<License> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Get current license
    const { data: current } = await supabase
      .from('licenses')
      .select('tenant_id, key')
      .eq('id', licenseId)
      .single();

    if (!current) {
      throw new NotFoundError('License not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.features !== undefined) updateData.features = data.features;
    if (data.limits !== undefined) updateData.limits = data.limits;
    if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: license, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', licenseId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update license', { error, licenseId });
      throw new DatabaseError('Failed to update license', { error });
    }

    if (!license) {
      throw new NotFoundError('License not found');
    }

    logger.info('License updated successfully', { licenseId });

    // Invalidate cache
    cache.delete(`license:${licenseId}`);
    cache.delete(`license:tenant:${current.tenant_id}`);
    cache.delete(`license:key:${current.key}`);

    return license as License;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating license', { error, licenseId });
    throw new DatabaseError('Failed to update license', { error });
  }
}

/**
 * Revoke license
 */
export async function revokeLicense(licenseId: string): Promise<License> {
  return updateLicense(licenseId, { status: 'revoked' });
}

/**
 * Suspend license
 */
export async function suspendLicense(licenseId: string): Promise<License> {
  return updateLicense(licenseId, { status: 'suspended' });
}

/**
 * Activate license
 */
export async function activateLicense(licenseId: string): Promise<License> {
  return updateLicense(licenseId, { status: 'active' });
}

/**
 * Delete license
 */
export async function deleteLicense(licenseId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId);

    if (error) {
      logger.error('Failed to delete license', { error, licenseId });
      throw new DatabaseError('Failed to delete license', { error });
    }

    logger.info('License deleted successfully', { licenseId });

    // Invalidate cache
    cache.delete(`license:${licenseId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting license', { error, licenseId });
    throw new DatabaseError('Failed to delete license', { error });
  }
}

/**
 * Get license by ID
 */
export async function getLicense(licenseId: string): Promise<License> {
  try {
    // Check cache first
    const cached = cache.get<License>(`license:${licenseId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (error) {
      logger.error('Failed to fetch license', { error, licenseId });
      throw new DatabaseError('Failed to fetch license', { error });
    }

    if (!license) {
      throw new NotFoundError('License not found');
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await updateLicense(licenseId, { status: 'expired' });
      license.status = 'expired';
    }

    // Cache result
    cache.set(`license:${licenseId}`, license, cacheHelpers.ttl.MEDIUM);

    return license as License;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching license', { error, licenseId });
    throw new DatabaseError('Failed to fetch license', { error });
  }
}

/**
 * Get license by key
 */
export async function getLicenseByKey(key: string): Promise<License> {
  try {
    // Check cache first
    const cacheKey = `license:key:${key}`;
    const cached = cache.get<License>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      logger.error('Failed to fetch license by key', { error, key });
      throw new DatabaseError('Failed to fetch license', { error });
    }

    if (!license) {
      throw new NotFoundError('License not found');
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await updateLicense(license.id, { status: 'expired' });
      license.status = 'expired';
    }

    // Cache result
    cache.set(cacheKey, license, cacheHelpers.ttl.MEDIUM);
    cache.set(`license:${license.id}`, license, cacheHelpers.ttl.MEDIUM);

    return license as License;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching license by key', { error, key });
    throw new DatabaseError('Failed to fetch license', { error });
  }
}

/**
 * Get license by tenant ID
 */
export async function getLicenseByTenant(tenantId: string): Promise<License> {
  try {
    // Check cache first
    const cacheKey = `license:tenant:${tenantId}`;
    const cached = cache.get<License>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Failed to fetch license by tenant', { error, tenantId });
      throw new DatabaseError('Failed to fetch license', { error });
    }

    if (!license) {
      throw new NotFoundError('License not found');
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await updateLicense(license.id, { status: 'expired' });
      license.status = 'expired';
    }

    // Cache result
    cache.set(cacheKey, license, cacheHelpers.ttl.MEDIUM);
    cache.set(`license:${license.id}`, license, cacheHelpers.ttl.MEDIUM);

    return license as License;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching license by tenant', { error, tenantId });
    throw new DatabaseError('Failed to fetch license', { error });
  }
}

/**
 * Validate license
 */
export async function validateLicense(key: string): Promise<{
  valid: boolean;
  license?: License;
  reason?: string;
}> {
  try {
    const license = await getLicenseByKey(key);

    if (license.status !== 'active') {
      return {
        valid: false,
        license,
        reason: `License is ${license.status}`,
      };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return {
        valid: false,
        license,
        reason: 'License has expired',
      };
    }

    return {
      valid: true,
      license,
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'License not found or invalid',
    };
  }
}

/**
 * List licenses
 */
export async function listLicenses(options: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'expired' | 'revoked' | 'suspended';
  type?: 'trial' | 'standard' | 'premium' | 'enterprise';
  tenantId?: string;
}): Promise<{ licenses: License[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, type, tenantId } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('licenses')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: licenses, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list licenses', { error });
      throw new DatabaseError('Failed to list licenses', { error });
    }

    return {
      licenses: (licenses || []) as License[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing licenses', { error });
    throw new DatabaseError('Failed to list licenses', { error });
  }
}

/**
 * Check expired licenses and update status
 */
export async function checkExpiredLicenses(): Promise<number> {
  try {
    const supabase = getSupabaseClient();

    const { data: expiredLicenses } = await supabase
      .from('licenses')
      .select('id')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (!expiredLicenses || expiredLicenses.length === 0) {
      return 0;
    }

    let updated = 0;
    for (const license of expiredLicenses) {
      await updateLicense(license.id, { status: 'expired' });
      updated++;
    }

    logger.info('Expired licenses updated', { count: updated });
    return updated;
  } catch (error) {
    logger.error('Failed to check expired licenses', { error });
    throw new DatabaseError('Failed to check expired licenses', { error });
  }
}

/**
 * Get license statistics
 */
export async function getLicenseStatistics(): Promise<{
  total: number;
  active: number;
  expired: number;
  revoked: number;
  suspended: number;
  byType: Record<string, number>;
}> {
  try {
    const supabase = getSupabaseClient();

    const [{ data: allLicenses }, { count: active }, { count: expired }, { count: revoked }, { count: suspended }] = await Promise.all([
      supabase.from('licenses').select('type'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    ]);

    const byType: Record<string, number> = {};
    for (const license of allLicenses || []) {
      byType[license.type] = (byType[license.type] || 0) + 1;
    }

    return {
      total: allLicenses?.length || 0,
      active: active || 0,
      expired: expired || 0,
      revoked: revoked || 0,
      suspended: suspended || 0,
      byType,
    };
  } catch (error) {
    logger.error('Failed to get license statistics', { error });
    throw new DatabaseError('Failed to get license statistics', { error });
  }
}
