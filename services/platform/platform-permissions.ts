import { getUserRole, getUserClinicId } from '../core/auth';
import { hasPermission, canWrite, canDelete, type UserRole } from '../core/permissions';
import { AuthorizationError } from '../core/errors';

// ============================================================================
// Platform Permissions
// Permission management for platform-level operations
// ============================================================================

/**
 * Platform resource types
 */
export enum PlatformResource {
  TENANTS = 'tenants',
  SUBSCRIPTIONS = 'subscriptions',
  PLANS = 'plans',
  COUPONS = 'coupons',
  INVOICES = 'invoices',
  FEATURE_FLAGS = 'feature_flags',
  MODULES = 'modules',
  JOBS = 'jobs',
  MONITORING = 'monitoring',
  HEALTH = 'health',
  ALERTS = 'alerts',
  CACHE = 'cache',
  LOGS = 'logs',
  AUDIT = 'audit',
  BACKUPS = 'backups',
  MAINTENANCE = 'maintenance',
  ENVIRONMENT = 'environment',
  SECRETS = 'secrets',
  INTEGRATIONS = 'integrations',
  PLUGINS = 'plugins',
  MARKETPLACE = 'marketplace',
  WEBHOOKS = 'webhooks',
  SUPPORT = 'support',
  ANNOUNCEMENTS = 'announcements',
  ANALYTICS = 'analytics',
  REVENUE = 'revenue',
}

/**
 * Platform role definitions
 */
export const platformRoles: Record<string, string[]> = {
  owner: [
    PlatformResource.TENANTS,
    PlatformResource.SUBSCRIPTIONS,
    PlatformResource.PLANS,
    PlatformResource.COUPONS,
    PlatformResource.INVOICES,
    PlatformResource.FEATURE_FLAGS,
    PlatformResource.MODULES,
    PlatformResource.JOBS,
    PlatformResource.MONITORING,
    PlatformResource.HEALTH,
    PlatformResource.ALERTS,
    PlatformResource.CACHE,
    PlatformResource.LOGS,
    PlatformResource.AUDIT,
    PlatformResource.BACKUPS,
    PlatformResource.MAINTENANCE,
    PlatformResource.ENVIRONMENT,
    PlatformResource.SECRETS,
    PlatformResource.INTEGRATIONS,
    PlatformResource.PLUGINS,
    PlatformResource.WEBHOOKS,
    PlatformResource.SUPPORT,
    PlatformResource.ANNOUNCEMENTS,
    PlatformResource.ANALYTICS,
    PlatformResource.REVENUE,
  ],
  administrator: [
    PlatformResource.SUBSCRIPTIONS,
    PlatformResource.PLANS,
    PlatformResource.COUPONS,
    PlatformResource.INVOICES,
    PlatformResource.FEATURE_FLAGS,
    PlatformResource.MODULES,
    PlatformResource.MONITORING,
    PlatformResource.HEALTH,
    PlatformResource.ALERTS,
    PlatformResource.LOGS,
    PlatformResource.AUDIT,
    PlatformResource.INTEGRATIONS,
    PlatformResource.WEBHOOKS,
    PlatformResource.SUPPORT,
    PlatformResource.ANNOUNCEMENTS,
    PlatformResource.ANALYTICS,
    PlatformResource.REVENUE,
  ],
  support: [
    PlatformResource.TENANTS,
    PlatformResource.SUBSCRIPTIONS,
    PlatformResource.INVOICES,
    PlatformResource.MONITORING,
    PlatformResource.ALERTS,
    PlatformResource.LOGS,
    PlatformResource.SUPPORT,
    PlatformResource.ANNOUNCEMENTS,
  ],
  accountant: [
    PlatformResource.SUBSCRIPTIONS,
    PlatformResource.PLANS,
    PlatformResource.COUPONS,
    PlatformResource.INVOICES,
    PlatformResource.ANALYTICS,
    PlatformResource.REVENUE,
  ],
};

/**
 * Check if user has platform permission
 */
export function hasPlatformPermission(role: UserRole, resource: PlatformResource): boolean {
  const roleResources = platformRoles[role] || [];
  return roleResources.includes(resource);
}

/**
 * Check if user can write to platform resource
 */
export function canWritePlatformResource(role: UserRole, resource: PlatformResource): boolean {
  const writableResources = [
    PlatformResource.TENANTS,
    PlatformResource.SUBSCRIPTIONS,
    PlatformResource.PLANS,
    PlatformResource.COUPONS,
    PlatformResource.FEATURE_FLAGS,
    PlatformResource.MODULES,
    PlatformResource.CACHE,
    PlatformResource.BACKUPS,
    PlatformResource.MAINTENANCE,
    PlatformResource.SECRETS,
    PlatformResource.INTEGRATIONS,
    PlatformResource.PLUGINS,
    PlatformResource.WEBHOOKS,
    PlatformResource.SUPPORT,
    PlatformResource.ANNOUNCEMENTS,
  ];
  return hasPlatformPermission(role, resource) && writableResources.includes(resource);
}

/**
 * Check if user can delete platform resource
 */
export function canDeletePlatformResource(role: UserRole, resource: PlatformResource): boolean {
  const deletableResources = [
    PlatformResource.TENANTS,
    PlatformResource.SUBSCRIPTIONS,
    PlatformResource.PLANS,
    PlatformResource.COUPONS,
    PlatformResource.FEATURE_FLAGS,
    PlatformResource.MODULES,
    PlatformResource.CACHE,
    PlatformResource.BACKUPS,
    PlatformResource.SECRETS,
    PlatformResource.INTEGRATIONS,
    PlatformResource.PLUGINS,
    PlatformResource.WEBHOOKS,
  ];
  return hasPlatformPermission(role, resource) && deletableResources.includes(resource);
}

/**
 * Validate user has permission to access platform resource
 */
export async function validatePlatformPermission(resource: PlatformResource): Promise<void> {
  const role = await getUserRole() as UserRole;
  
  if (!hasPlatformPermission(role, resource)) {
    throw new AuthorizationError(`You do not have permission to access ${resource}`);
  }
}

/**
 * Validate user can write to platform resource
 */
export async function validatePlatformWritePermission(resource: PlatformResource): Promise<void> {
  const role = await getUserRole() as UserRole;
  
  if (!canWritePlatformResource(role, resource)) {
    throw new AuthorizationError(`You do not have permission to modify ${resource}`);
  }
}

/**
 * Validate user can delete platform resource
 */
export async function validatePlatformDeletePermission(resource: PlatformResource): Promise<void> {
  const role = await getUserRole() as UserRole;
  
  if (!canDeletePlatformResource(role, resource)) {
    throw new AuthorizationError(`You do not have permission to delete ${resource}`);
  }
}

/**
 * Check if user is platform admin
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return role === 'owner' || role === 'administrator';
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  return role === 'owner';
}

/**
 * Validate user is platform admin
 */
export async function requirePlatformAdmin(): Promise<void> {
  if (!(await isPlatformAdmin())) {
    throw new AuthorizationError('This action requires platform admin privileges');
  }
}

/**
 * Validate user is super admin
 */
export async function requireSuperAdmin(): Promise<void> {
  if (!(await isSuperAdmin())) {
    throw new AuthorizationError('This action requires super admin privileges');
  }
}

/**
 * Check if user can manage specific tenant
 */
export async function canManageTenant(tenantId: string): Promise<boolean> {
  const role = await getUserRole() as UserRole;
  
  // Owners can manage any tenant
  if (role === 'owner') {
    return true;
  }
  
  // Administrators can only manage their own tenant
  if (role === 'administrator') {
    const userClinicId = await getUserClinicId();
    return userClinicId === tenantId;
  }
  
  return false;
}

/**
 * Validate user can manage specific tenant
 */
export async function validateTenantAccess(tenantId: string): Promise<void> {
  if (!(await canManageTenant(tenantId))) {
    throw new AuthorizationError('You do not have permission to manage this tenant');
  }
}

/**
 * Permission checker factory for platform resources
 */
export function createPlatformPermissionChecker(resource: PlatformResource) {
  return {
    async canRead(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPlatformPermission(role, resource);
    },

    async canWrite(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return canWritePlatformResource(role, resource);
    },

    async canDelete(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return canDeletePlatformResource(role, resource);
    },

    async validateRead(): Promise<void> {
      if (!(await this.canRead())) {
        throw new AuthorizationError(`You do not have permission to view ${resource}`);
      }
    },

    async validateWrite(): Promise<void> {
      if (!(await this.canWrite())) {
        throw new AuthorizationError(`You do not have permission to modify ${resource}`);
      }
    },

    async validateDelete(): Promise<void> {
      if (!(await this.canDelete())) {
        throw new AuthorizationError(`You do not have permission to delete ${resource}`);
      }
    },
  };
}
