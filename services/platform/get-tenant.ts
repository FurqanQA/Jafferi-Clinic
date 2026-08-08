import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { Tenant } from './platform-types';

// ============================================================================
// Get Tenant
// Tenant retrieval operations
// ============================================================================

/**
 * Get tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant> {
  try {
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
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      logger.error('Failed to fetch tenant by slug', { error, slug });
      throw new DatabaseError('Failed to fetch tenant by slug', { error });
    }

    if (!tenant) {
      return null;
    }

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching tenant by slug', { error, slug });
    throw new DatabaseError('Failed to fetch tenant by slug', { error });
  }
}

/**
 * Get tenant by domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error) {
      logger.error('Failed to fetch tenant by domain', { error, domain });
      throw new DatabaseError('Failed to fetch tenant by domain', { error });
    }

    if (!tenant) {
      return null;
    }

    return tenant as Tenant;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching tenant by domain', { error, domain });
    throw new DatabaseError('Failed to fetch tenant by domain', { error });
  }
}

/**
 * Get tenant with related data
 */
export async function getTenantWithDetails(tenantId: string): Promise<{
  tenant: Tenant;
  subscription?: any;
  clinics?: any[];
  users?: any[];
  usage?: any;
}> {
  try {
    const tenant = await getTenant(tenantId);
    const supabase = getSupabaseClient();

    // Fetch subscription
    let subscription = null;
    if (tenant.subscriptionId) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', tenant.subscriptionId)
        .single();
      subscription = sub;
    }

    // Fetch clinics
    const { data: clinics } = await supabase
      .from('clinics')
      .select('*')
      .eq('tenant_id', tenantId);

    // Fetch users
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId);

    // Fetch usage
    const { data: usage } = await supabase
      .from('usage_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    return {
      tenant,
      subscription,
      clinics: clinics || [],
      users: users || [],
      usage,
    };
  } catch (error) {
    logger.error('Failed to get tenant with details', { error, tenantId });
    throw new DatabaseError('Failed to get tenant with details', { error });
  }
}

/**
 * Get tenant settings
 */
export async function getTenantSettings(tenantId: string): Promise<Record<string, unknown>> {
  try {
    const supabase = getSupabaseClient();

    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!settings) {
      return {};
    }

    return settings as Record<string, unknown>;
  } catch (error) {
    logger.error('Failed to get tenant settings', { error, tenantId });
    throw new DatabaseError('Failed to get tenant settings', { error });
  }
}

/**
 * Get tenant limits
 */
export async function getTenantLimits(tenantId: string): Promise<Record<string, number>> {
  try {
    const tenant = await getTenant(tenantId);
    return (tenant.limits as unknown as Record<string, number>) || {};
  } catch (error) {
    logger.error('Failed to get tenant limits', { error, tenantId });
    throw new DatabaseError('Failed to get tenant limits', { error });
  }
}

/**
 * Get tenant usage
 */
export async function getTenantUsage(tenantId: string): Promise<Record<string, unknown>> {
  try {
    const tenant = await getTenant(tenantId);
    return (tenant.usage as unknown as Record<string, unknown>) || {};
  } catch (error) {
    logger.error('Failed to get tenant usage', { error, tenantId });
    throw new DatabaseError('Failed to get tenant usage', { error });
  }
}

/**
 * Check if tenant exists
 */
export async function tenantExists(tenantId: string): Promise<boolean> {
  try {
    const tenant = await getTenant(tenantId);
    return !!tenant;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return false;
    }
    throw error;
  }
}

/**
 * Get tenant status
 */
export async function getTenantStatus(tenantId: string): Promise<string> {
  try {
    const tenant = await getTenant(tenantId);
    return tenant.status;
  } catch (error) {
    logger.error('Failed to get tenant status', { error, tenantId });
    throw new DatabaseError('Failed to get tenant status', { error });
  }
}

/**
 * Get tenant owner
 */
export async function getTenantOwner(tenantId: string): Promise<{
  userId: string;
  name: string;
  email: string;
} | null> {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('tenant_id', tenantId)
      .eq('role', 'owner')
      .single();

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    logger.error('Failed to get tenant owner', { error, tenantId });
    throw new DatabaseError('Failed to get tenant owner', { error });
  }
}
