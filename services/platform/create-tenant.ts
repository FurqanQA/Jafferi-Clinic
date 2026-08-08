import { logger } from '../shared/logger';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, ValidationError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';
import { createSubscription } from './subscription-manager';
import { createClinic } from './clinic-manager';
import { BillingCycle } from './platform-types';

// ============================================================================
// Create Tenant
// Tenant creation workflow with initialization
// ============================================================================

/**
 * Create tenant input
 */
export interface CreateTenantInput {
  name: string;
  domain?: string;
  planId: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create tenant result
 */
export interface CreateTenantResult {
  tenantId: string;
  ownerId: string;
  clinicId: string;
  subscriptionId: string;
  status: string;
}

/**
 * Create tenant with full initialization
 */
export async function createTenant(data: CreateTenantInput): Promise<CreateTenantResult> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    logger.info('Starting tenant creation', { name: data.name, planId: data.planId });

    // Step 1: Create tenant record
    const tenantId = `tenant-${Date.now()}`;
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: data.name,
        domain: data.domain || null,
        status: 'active',
        settings: data.settings || {},
        metadata: data.metadata || {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (tenantError) {
      logger.error('Failed to create tenant record', { error: tenantError });
      throw new DatabaseError('Failed to create tenant record', { error: tenantError });
    }

    // Step 2: Create owner user
    const ownerId = `user-${Date.now()}`;
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: ownerId,
        email: data.ownerEmail,
        name: data.ownerName,
        phone: data.ownerPhone || null,
        role: 'owner',
        tenant_id: tenantId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (userError) {
      logger.error('Failed to create owner user', { error: userError });
      // Rollback tenant creation
      await supabase.from('tenants').delete().eq('id', tenantId);
      throw new DatabaseError('Failed to create owner user', { error: userError });
    }

    // Step 3: Create clinic
    const clinicId = `clinic-${Date.now()}`;
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        id: clinicId,
        name: `${data.name} Clinic`,
        tenant_id: tenantId,
        owner_id: ownerId,
        status: 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (clinicError) {
      logger.error('Failed to create clinic', { error: clinicError });
      // Rollback
      await supabase.from('users').delete().eq('id', ownerId);
      await supabase.from('tenants').delete().eq('id', tenantId);
      throw new DatabaseError('Failed to create clinic', { error: clinicError });
    }

    // Step 4: Create subscription
    const subscription = await createSubscription({
      tenantId,
      planId: data.planId,
      billingCycle: BillingCycle.MONTHLY,
    });

    // Step 5: Update tenant with subscription reference
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ subscription_id: subscription.id })
      .eq('id', tenantId);

    if (updateError) {
      logger.error('Failed to update tenant with subscription', { error: updateError });
      // Non-critical error, continue
    }

    logger.info('Tenant created successfully', { 
      tenantId, 
      ownerId, 
      clinicId, 
      subscriptionId: subscription.id 
    });

    return {
      tenantId,
      ownerId,
      clinicId,
      subscriptionId: subscription.id,
      status: 'active',
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Unexpected error creating tenant', { error, data });
    throw new DatabaseError('Failed to create tenant', { error });
  }
}

/**
 * Validate tenant creation input
 */
export async function validateTenantCreation(data: CreateTenantInput): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Tenant name is required');
  }

  if (!data.planId || data.planId.trim().length === 0) {
    errors.push('Plan ID is required');
  }

  if (!data.ownerEmail || !isValidEmail(data.ownerEmail)) {
    errors.push('Valid owner email is required');
  }

  if (!data.ownerName || data.ownerName.trim().length === 0) {
    errors.push('Owner name is required');
  }

  // Check if plan exists
  if (data.planId) {
    try {
      const supabase = getSupabaseClient();
      const { data: plan } = await supabase
        .from('plans')
        .select('id')
        .eq('id', data.planId)
        .single();

      if (!plan) {
        errors.push('Plan does not exist');
      }
    } catch (error) {
      errors.push('Failed to validate plan');
    }
  }

  // Check if email is already in use
  if (data.ownerEmail) {
    try {
      const supabase = getSupabaseClient();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.ownerEmail)
        .single();

      if (existingUser) {
        errors.push('Email is already in use');
      }
    } catch (error) {
      // Ignore error, might not exist
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create tenant with trial
 */
export async function createTenantWithTrial(data: CreateTenantInput, trialDays: number = 14): Promise<CreateTenantResult> {
  try {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();

    // Override settings with trial configuration
    const trialSettings = {
      ...data.settings,
      isTrial: true,
      trialEndDate,
      trialDays,
    };

    const result = await createTenant({
      ...data,
      settings: trialSettings,
    });

    logger.info('Tenant created with trial', { 
      tenantId: result.tenantId, 
      trialDays,
      trialEndDate 
    });

    return result;
  } catch (error) {
    logger.error('Failed to create tenant with trial', { error, data });
    throw new DatabaseError('Failed to create tenant with trial', { error });
  }
}

/**
 * Initialize tenant data
 */
export async function initializeTenantData(tenantId: string): Promise<{
  success: boolean;
  initialized: string[];
  failed: string[];
}> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const initialized: string[] = [];
    const failed: string[] = [];

    // Initialize default settings
    try {
      await supabase
        .from('tenant_settings')
        .insert({
          tenant_id: tenantId,
          timezone: 'UTC',
          locale: 'en',
          currency: 'USD',
          created_at: now,
          updated_at: now,
        });
      initialized.push('settings');
    } catch (error) {
      failed.push('settings');
    }

    // Initialize default roles
    try {
      const defaultRoles = ['admin', 'staff', 'viewer'];
      for (const role of defaultRoles) {
        await supabase
          .from('roles')
          .insert({
            tenant_id: tenantId,
            name: role,
            permissions: [],
            created_at: now,
            updated_at: now,
          });
      }
      initialized.push('roles');
    } catch (error) {
      failed.push('roles');
    }

    // Initialize default features
    try {
      const defaultFeatures = ['dashboard', 'patients', 'appointments', 'billing'];
      for (const feature of defaultFeatures) {
        await supabase
          .from('tenant_features')
          .insert({
            tenant_id: tenantId,
            feature,
            enabled: true,
            created_at: now,
          });
      }
      initialized.push('features');
    } catch (error) {
      failed.push('features');
    }

    logger.info('Tenant data initialized', { tenantId, initialized, failed });

    return {
      success: failed.length === 0,
      initialized,
      failed,
    };
  } catch (error) {
    logger.error('Failed to initialize tenant data', { error, tenantId });
    throw new DatabaseError('Failed to initialize tenant data', { error });
  }
}
