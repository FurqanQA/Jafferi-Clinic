import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError, ValidationError } from '../core/errors';
import { validatePlatformDeletePermission, validatePlatformWritePermission, PlatformResource } from './platform-permissions';
import { cancelSubscription as cancelSubscriptionFn } from './subscription-manager';

// ============================================================================
// Delete Tenant
// Tenant deletion and cleanup operations
// ============================================================================

/**
 * Delete tenant options
 */
export interface DeleteTenantOptions {
  tenantId: string;
  deleteData?: boolean;
  cancelSubscription?: boolean;
  reason?: string;
}

/**
 * Delete tenant result
 */
export interface DeleteTenantResult {
  tenantId: string;
  success: boolean;
  deleted: string[];
  failed: string[];
  errors: string[];
}

/**
 * Delete tenant with cleanup
 */
export async function deleteTenant(options: DeleteTenantOptions): Promise<DeleteTenantResult> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const { tenantId, deleteData = true, cancelSubscription = true, reason } = options;
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    logger.info('Starting tenant deletion', { tenantId, deleteData, cancelSubscription, reason });

    const deleted: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    // Step 1: Cancel subscription if requested
    if (cancelSubscription) {
      try {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('subscription_id')
          .eq('id', tenantId)
          .single();

        if (tenant?.subscription_id) {
          await cancelSubscriptionFn(tenant.subscription_id);
          deleted.push('subscription');
        }
      } catch (error) {
        failed.push('subscription');
        errors.push(`Failed to cancel subscription: ${error}`);
      }
    }

    // Step 2: Delete tenant data if requested
    if (deleteData) {
      // Delete clinics
      try {
        await supabase
          .from('clinics')
          .delete()
          .eq('tenant_id', tenantId);
        deleted.push('clinics');
      } catch (error) {
        failed.push('clinics');
        errors.push(`Failed to delete clinics: ${error}`);
      }

      // Delete users
      try {
        await supabase
          .from('users')
          .delete()
          .eq('tenant_id', tenantId);
        deleted.push('users');
      } catch (error) {
        failed.push('users');
        errors.push(`Failed to delete users: ${error}`);
      }

      // Delete tenant settings
      try {
        await supabase
          .from('tenant_settings')
          .delete()
          .eq('tenant_id', tenantId);
        deleted.push('tenant_settings');
      } catch (error) {
        failed.push('tenant_settings');
        errors.push(`Failed to delete tenant settings: ${error}`);
      }

      // Delete tenant features
      try {
        await supabase
          .from('tenant_features')
          .delete()
          .eq('tenant_id', tenantId);
        deleted.push('tenant_features');
      } catch (error) {
        failed.push('tenant_features');
        errors.push(`Failed to delete tenant features: ${error}`);
      }
    }

    // Step 3: Soft delete tenant record
    try {
      await supabase
        .from('tenants')
        .update({
          status: 'cancelled',
          deleted_at: now,
          metadata: {
            deletion_reason: reason || 'Manual deletion',
            deleted_data: deleteData,
            cancelled_subscription: cancelSubscription,
          },
        })
        .eq('id', tenantId);
      deleted.push('tenant');
    } catch (error) {
      failed.push('tenant');
      errors.push(`Failed to delete tenant: ${error}`);
      throw new DatabaseError('Failed to delete tenant', { error });
    }

    logger.info('Tenant deletion completed', { tenantId, deleted, failed });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      success: failed.length === 0,
      deleted,
      failed,
      errors,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Unexpected error deleting tenant', { error, options });
    throw new DatabaseError('Failed to delete tenant', { error });
  }
}

/**
 * Hard delete tenant (permanent deletion)
 */
export async function hardDeleteTenant(tenantId: string): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    logger.warn('Hard deleting tenant', { tenantId });

    // Delete all related data
    const tables = [
      'clinics',
      'users',
      'tenant_settings',
      'tenant_features',
      'invoices',
      'usage_records',
    ];

    for (const table of tables) {
      try {
        await supabase
          .from(table)
          .delete()
          .eq('tenant_id', tenantId);
      } catch (error) {
        logger.error(`Failed to delete from ${table}`, { error, tenantId });
      }
    }

    // Delete tenant record
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to hard delete tenant', { error, tenantId });
      throw new DatabaseError('Failed to hard delete tenant', { error });
    }

    logger.info('Tenant hard deleted', { tenantId });

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
    logger.error('Unexpected error hard deleting tenant', { error, tenantId });
    throw new DatabaseError('Failed to hard delete tenant', { error });
  }
}

/**
 * Validate tenant deletion
 */
export async function validateTenantDeletion(tenantId: string): Promise<{
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

    if (tenant.status === 'cancelled') {
      warnings.push('Tenant is already cancelled');
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
      warnings.push('Tenant has an active subscription that will be cancelled');
    }
  } catch (error) {
    // Ignore error
  }

  // Check for data that will be deleted
  try {
    const { count: clinicCount } = await supabase
      .from('clinics')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (clinicCount && clinicCount > 0) {
      warnings.push(`${clinicCount} clinic(s) will be deleted`);
    }

    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (userCount && userCount > 0) {
      warnings.push(`${userCount} user(s) will be deleted`);
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
 * Schedule tenant deletion
 */
export async function scheduleTenantDeletion(tenantId: string, deletionDate: string): Promise<{
  tenantId: string;
  scheduledDate: string;
  success: boolean;
}> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('tenants')
      .update({
        status: 'pending_deletion',
        metadata: {
          scheduled_deletion_date: deletionDate,
        },
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to schedule tenant deletion', { error, tenantId });
      throw new DatabaseError('Failed to schedule tenant deletion', { error });
    }

    logger.info('Tenant deletion scheduled', { tenantId, deletionDate });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      scheduledDate: deletionDate,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error scheduling tenant deletion', { error, tenantId });
    throw new DatabaseError('Failed to schedule tenant deletion', { error });
  }
}

/**
 * Cancel scheduled deletion
 */
export async function cancelScheduledDeletion(tenantId: string): Promise<{
  tenantId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('tenants')
      .update({
        status: 'active',
        metadata: {},
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to cancel scheduled deletion', { error, tenantId });
      throw new DatabaseError('Failed to cancel scheduled deletion', { error });
    }

    logger.info('Scheduled deletion cancelled', { tenantId });

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
    logger.error('Unexpected error cancelling scheduled deletion', { error, tenantId });
    throw new DatabaseError('Failed to cancel scheduled deletion', { error });
  }
}
