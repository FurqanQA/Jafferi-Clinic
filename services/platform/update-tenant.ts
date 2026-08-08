import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError, ValidationError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';
import { TenantStatus } from './platform-types';

// ============================================================================
// Update Tenant
// Tenant update operations
// ============================================================================

/**
 * Update tenant input
 */
export interface UpdateTenantInput {
  tenantId: string;
  name?: string;
  domain?: string;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Update tenant
 */
export async function updateTenant(data: UpdateTenantInput): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', data.tenantId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update tenant', { error, tenantId: data.tenantId });
      throw new DatabaseError('Failed to update tenant', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    logger.info('Tenant updated', { tenantId: data.tenantId });

    // Invalidate cache
    cache.delete(`tenant:${data.tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId: data.tenantId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Unexpected error updating tenant', { error, data });
    throw new DatabaseError('Failed to update tenant', { error });
  }
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(tenantId: string, settings: Record<string, unknown>): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        settings,
        updated_at: now,
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update tenant settings', { error, tenantId });
      throw new DatabaseError('Failed to update tenant settings', { error });
    }

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    logger.info('Tenant settings updated', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating tenant settings', { error, tenantId });
    throw new DatabaseError('Failed to update tenant settings', { error });
  }
}

/**
 * Update tenant limits
 */
export async function updateTenantLimits(tenantId: string, limits: {
  users?: number;
  patients?: number;
  appointments?: number;
  storage?: number;
  apiCalls?: number;
  aiTokens?: number;
}): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Get current tenant data
    const { data: currentTenant } = await supabase
      .from('tenants')
      .select('limits')
      .eq('id', tenantId)
      .single();

    if (!currentTenant) {
      throw new NotFoundError('Tenant not found');
    }

    const currentLimits = (currentTenant.limits as Record<string, unknown>) || {};
    const updatedLimits = { ...currentLimits, ...limits };

    const { error } = await supabase
      .from('tenants')
      .update({
        limits: updatedLimits,
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to update tenant limits', { error, tenantId });
      throw new DatabaseError('Failed to update tenant limits', { error });
    }

    logger.info('Tenant limits updated', { tenantId, limits });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating tenant limits', { error, tenantId });
    throw new DatabaseError('Failed to update tenant limits', { error });
  }
}

/**
 * Upgrade tenant plan
 */
export async function upgradeTenantPlan(tenantId: string, newPlanId: string): Promise<{
  tenantId: string;
  oldPlanId: string;
  newPlanId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Get current tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan_id')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const oldPlanId = tenant.plan_id;

    // Update tenant plan
    const { error } = await supabase
      .from('tenants')
      .update({ plan_id: newPlanId })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to upgrade tenant plan', { error, tenantId });
      throw new DatabaseError('Failed to upgrade tenant plan', { error });
    }

    logger.info('Tenant plan upgraded', { tenantId, oldPlanId, newPlanId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      oldPlanId: oldPlanId || '',
      newPlanId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error upgrading tenant plan', { error, tenantId });
    throw new DatabaseError('Failed to upgrade tenant plan', { error });
  }
}

/**
 * Update tenant branding
 */
export async function updateTenantBranding(tenantId: string, branding: {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCSS?: string;
}): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Get current tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const currentSettings = (tenant.settings as Record<string, unknown>) || {};
    const currentBranding = (currentSettings.branding as Record<string, unknown>) || {};
    const updatedBranding = { ...currentBranding, ...branding };
    const updatedSettings = { ...currentSettings, branding: updatedBranding };

    const { error } = await supabase
      .from('tenants')
      .update({
        settings: updatedSettings,
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to update tenant branding', { error, tenantId });
      throw new DatabaseError('Failed to update tenant branding', { error });
    }

    logger.info('Tenant branding updated', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating tenant branding', { error, tenantId });
    throw new DatabaseError('Failed to update tenant branding', { error });
  }
}

/**
 * Validate tenant update
 */
export async function validateTenantUpdate(data: UpdateTenantInput): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (!data.tenantId || data.tenantId.trim().length === 0) {
    errors.push('Tenant ID is required');
  }

  if (data.name !== undefined && data.name.trim().length === 0) {
    errors.push('Tenant name cannot be empty');
  }

  if (data.domain !== undefined) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    if (!domainRegex.test(data.domain)) {
      errors.push('Invalid domain format');
    }
  }

  // Check if tenant exists
  if (data.tenantId) {
    try {
      const supabase = getSupabaseClient();
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', data.tenantId)
        .single();

      if (!tenant) {
        errors.push('Tenant does not exist');
      }
    } catch (error) {
      errors.push('Failed to validate tenant');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Bulk update tenants
 */
export async function bulkUpdateTenants(tenantIds: string[], updates: Partial<UpdateTenantInput>): Promise<{
  updated: number;
  failed: number;
  errors: string[];
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const tenantId of tenantIds) {
      try {
        await updateTenant({ tenantId, ...updates });
        updated++;
      } catch (error) {
        failed++;
        errors.push(`Failed to update tenant ${tenantId}: ${error}`);
      }
    }

    logger.info('Bulk tenant update completed', { updated, failed });

    return {
      updated,
      failed,
      errors,
    };
  } catch (error) {
    logger.error('Failed to bulk update tenants', { error });
    throw new DatabaseError('Failed to bulk update tenants', { error });
  }
}
