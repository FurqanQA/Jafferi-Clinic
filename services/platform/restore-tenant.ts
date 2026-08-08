import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError, ValidationError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';
import { TenantStatus } from './platform-types';

// ============================================================================
// Restore Tenant
// Tenant restoration operations
// ============================================================================

/**
 * Restore tenant input
 */
export interface RestoreTenantInput {
  tenantId: string;
  restoreData?: boolean;
  restoreSubscription?: boolean;
}

/**
 * Restore tenant result
 */
export interface RestoreTenantResult {
  tenantId: string;
  success: boolean;
  restoredAt: string;
  restored: string[];
  failed: string[];
}

/**
 * Restore tenant
 */
export async function restoreTenant(data: RestoreTenantInput): Promise<RestoreTenantResult> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const { tenantId, restoreData = false, restoreSubscription = true } = data;
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    logger.info('Restoring tenant', { tenantId, restoreData, restoreSubscription });

    const restored: string[] = [];
    const failed: string[] = [];

    // Get current tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status, subscription_id, deleted_at')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    if (tenant.status !== TenantStatus.CANCELLED) {
      throw new ValidationError('Tenant is not cancelled and cannot be restored');
    }

    // Restore subscription if requested
    if (restoreSubscription && tenant.subscription_id) {
      try {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', tenant.subscription_id);
        restored.push('subscription');
      } catch (error) {
        failed.push('subscription');
        logger.error('Failed to restore subscription', { error, subscriptionId: tenant.subscription_id });
      }
    }

    // Restore tenant status
    try {
      await supabase
        .from('tenants')
        .update({
          status: TenantStatus.ACTIVE,
          deleted_at: null,
          metadata: {},
          updated_at: now,
        })
        .eq('id', tenantId);
      restored.push('tenant');
    } catch (error) {
      failed.push('tenant');
      logger.error('Failed to restore tenant', { error, tenantId });
      throw new DatabaseError('Failed to restore tenant', { error });
    }

    // Restore data if requested (placeholder)
    if (restoreData) {
      // Placeholder for data restoration
      // In production, this would restore from backups
      logger.info('Data restoration requested (placeholder)', { tenantId });
    }

    logger.info('Tenant restored successfully', { tenantId, restored, failed });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      success: failed.length === 0,
      restoredAt: now,
      restored,
      failed,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Unexpected error restoring tenant', { error, data });
    throw new DatabaseError('Failed to restore tenant', { error });
  }
}

/**
 * Restore tenant from backup
 */
export async function restoreTenantFromBackup(tenantId: string, backupId: string): Promise<{
  tenantId: string;
  backupId: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    logger.info('Restoring tenant from backup', { tenantId, backupId });

    // Placeholder for backup restoration
    // In production, this would:
    // - Fetch backup data
    // - Restore database tables
    // - Restore files
    // - Update tenant status

    const { error } = await supabase
      .from('tenants')
      .update({
        status: TenantStatus.ACTIVE,
        deleted_at: null,
        metadata: {
          restored_from_backup: backupId,
          restored_at: now,
        },
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to restore tenant from backup', { error, tenantId });
      throw new DatabaseError('Failed to restore tenant from backup', { error });
    }

    logger.info('Tenant restored from backup successfully', { tenantId, backupId });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      backupId,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring tenant from backup', { error, tenantId, backupId });
    throw new DatabaseError('Failed to restore tenant from backup', { error });
  }
}

/**
 * Get available backups for tenant
 */
export async function getTenantBackups(tenantId: string): Promise<Array<{
  backupId: string;
  createdAt: string;
  size: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    // Placeholder for backup listing
    // In production, this would fetch from backup system

    return [];
  } catch (error) {
    logger.error('Failed to get tenant backups', { error, tenantId });
    throw new DatabaseError('Failed to get tenant backups', { error });
  }
}

/**
 * Validate tenant restoration
 */
export async function validateTenantRestoration(tenantId: string): Promise<{
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

    if (tenant.status !== TenantStatus.CANCELLED) {
      errors.push('Tenant is not cancelled');
    }
  } catch (error) {
    errors.push('Failed to validate tenant');
  }

  // Check for available backups
  try {
    const backups = await getTenantBackups(tenantId);
    if (backups.length === 0) {
      warnings.push('No backups available for data restoration');
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
 * Schedule tenant restoration
 */
export async function scheduleTenantRestoration(tenantId: string, restorationDate: string): Promise<{
  tenantId: string;
  scheduledDate: string;
  success: boolean;
}> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('tenants')
      .update({
        status: 'pending_restoration',
        metadata: {
          scheduled_restoration_date: restorationDate,
        },
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to schedule tenant restoration', { error, tenantId });
      throw new DatabaseError('Failed to schedule tenant restoration', { error });
    }

    logger.info('Tenant restoration scheduled', { tenantId, restorationDate });

    // Invalidate cache
    cache.delete(`tenant:${tenantId}`);
    cache.delete('tenants:all');

    return {
      tenantId,
      scheduledDate: restorationDate,
      success: true,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error scheduling tenant restoration', { error, tenantId });
    throw new DatabaseError('Failed to schedule tenant restoration', { error });
  }
}

/**
 * Cancel scheduled restoration
 */
export async function cancelScheduledRestoration(tenantId: string): Promise<{
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
        status: TenantStatus.CANCELLED,
        metadata: {},
        updated_at: now,
      })
      .eq('id', tenantId);

    if (error) {
      logger.error('Failed to cancel scheduled restoration', { error, tenantId });
      throw new DatabaseError('Failed to cancel scheduled restoration', { error });
    }

    logger.info('Scheduled restoration cancelled', { tenantId });

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
    logger.error('Unexpected error cancelling scheduled restoration', { error, tenantId });
    throw new DatabaseError('Failed to cancel scheduled restoration', { error });
  }
}
