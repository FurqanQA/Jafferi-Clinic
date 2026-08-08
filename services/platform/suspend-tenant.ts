import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError, ValidationError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';
import { TenantStatus } from './platform-types';

// ============================================================================
// Suspend Tenant
// Tenant suspension operations
// ============================================================================

/**
 * Suspend tenant input
 */
export interface SuspendTenantInput {
  tenantId: string;
  reason: string;
  suspendSubscription?: boolean;
  notifyUsers?: boolean;
}

/**
 * Suspend tenant result
 */
export interface SuspendTenantResult {
  tenantId: string;
  success: boolean;
  suspendedAt: string;
  reason: string;
}

/**
 * Suspend tenant
 */
export async function suspendTenant(data: SuspendTenantInput): Promise<SuspendTenantResult> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    logger.info('Suspending tenant', { tenantId: data.tenantId, reason: data.reason });

    // Get current tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status, subscription_id')
      .eq('id', data.tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ValidationError('Tenant is already suspended');
    }

    // Suspend subscription if requested
    if (data.suspendSubscription && tenant.subscription_id) {
      try {
        await supabase
          .from('subscriptions')
          .update({ status: 'suspended' })
          .eq('id', tenant.subscription_id);
      } catch (error) {
        logger.error('Failed to suspend subscription', { error, subscriptionId: tenant.subscription_id });
      }
    }

    // Update tenant status
    const { error } = await supabase
      .from('tenants')
      .update({
        status: TenantStatus.SUSPENDED,
        metadata: {
          suspension_reason: data.reason,
          suspended_at: now,
          suspend_subscription: data.suspendSubscription,
        },
        updated_at: now,
      })
      .eq('id', data.tenantId);

    if (error) {
      logger.error('Failed to suspend tenant', { error, tenantId: data.tenantId });
      throw new DatabaseError('Failed to suspend tenant', { error });
    }

    logger.info('Tenant suspended successfully', { tenantId: data.tenantId });

    // Invalidate cache
    cache.delete(`tenant:${data.tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId: data.tenantId,
      success: true,
      suspendedAt: now,
      reason: data.reason,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Unexpected error suspending tenant', { error, data });
    throw new DatabaseError('Failed to suspend tenant', { error });
  }
}

/**
 * Unsuspend tenant
 */
export async function unsuspendTenant(tenantId: string): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    logger.info('Unsuspending tenant', { tenantId });

    // Get current tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status, subscription_id, metadata')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    if (tenant.status !== TenantStatus.SUSPENDED) {
      throw new ValidationError('Tenant is not suspended');
    }

    // Unsuspend subscription if it was suspended
    const metadata = tenant.metadata as Record<string, unknown>;
    if (metadata.suspend_subscription && tenant.subscription_id) {
      try {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', tenant.subscription_id);
      } catch (error) {
        logger.error('Failed to unsuspend subscription', { error, subscriptionId: tenant.subscription_id });
      }
    }

    // Update tenant status
    const { error } = await supabase
      .from('tenants')
      .update({
        status: TenantStatus.ACTIVE,
        metadata: {},
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to unsuspend tenant', { error, tenantId });
      throw new DatabaseError('Failed to unsuspend tenant', { error });
    }

    logger.info('Tenant unsuspended successfully', { tenantId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Unexpected error unsuspending tenant', { error, tenantId });
    throw new DatabaseError('Failed to unsuspend tenant', { error });
  }
}

/**
 * Get suspended tenants
 */
export async function getSuspendedTenants(): Promise<Array<{
  tenantId: string;
  name: string;
  suspendedAt: string;
  reason: string;
}>> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name, metadata')
      .eq('status', TenantStatus.SUSPENDED);

    if (!tenants || tenants.length === 0) {
      return [];
    }

    return tenants.map((tenant: any) => {
      const metadata = tenant.metadata as Record<string, unknown>;
      return {
        tenantId: tenant.id,
        name: tenant.name,
        suspendedAt: (metadata.suspended_at as string) || '',
        reason: (metadata.suspension_reason as string) || 'Unknown',
      };
    });
  } catch (error) {
    logger.error('Failed to get suspended tenants', { error });
    throw new DatabaseError('Failed to get suspended tenants', { error });
  }
}

/**
 * Validate tenant suspension
 */
export async function validateTenantSuspension(tenantId: string): Promise<{
  valid: boolean;
  warnings: string[];
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!tenantId || tenantId.trim().length === 0) {
    errors.push('Tenant ID is required');
    return { valid: false, warnings, errors };
  }

  const supabase = getSupabaseClient();

  // Check if tenant exists
  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      errors.push('Tenant does not exist');
      return { valid: false, warnings, errors };
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      errors.push('Tenant is already suspended');
    }

    if (tenant.status === TenantStatus.CANCELLED) {
      errors.push('Cannot suspend a cancelled tenant');
    }
  } catch (error) {
    errors.push('Failed to validate tenant');
  }

  // Check for active subscription
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (subscription) {
      warnings.push('Tenant has an active subscription that will be suspended');
    }
  } catch (error) {
    // Ignore error
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Bulk suspend tenants
 */
export async function bulkSuspendTenants(tenantIds: string[], reason: string): Promise<{
  suspended: number;
  failed: number;
  errors: string[];
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    let suspended = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const tenantId of tenantIds) {
      try {
        await suspendTenant({ tenantId, reason });
        suspended++;
      } catch (error) {
        failed++;
        errors.push(`Failed to suspend tenant ${tenantId}: ${error}`);
      }
    }

    logger.info('Bulk tenant suspension completed', { suspended, failed });

    return {
      suspended,
      failed,
      errors,
    };
  } catch (error) {
    logger.error('Failed to bulk suspend tenants', { error });
    throw new DatabaseError('Failed to bulk suspend tenants', { error });
  }
}
