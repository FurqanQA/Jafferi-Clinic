import { getUserRole, getUserClinicId } from './auth';
import { hasPermission, canWrite, canDelete, type UserRole, type ResourceType } from './permissions';
import { AuthorizationError } from './errors';
import { getSupabaseClient } from './client';

/**
 * Generate permission checker functions for a resource
 * @param resource - Resource name (e.g., 'patients', 'doctors')
 * @returns Object with permission checker functions
 */
export function createPermissionCheckers(resource: ResourceType) {
  const resourceName = resource;
  const resourceCapitalized = resource.charAt(0).toUpperCase() + resource.slice(1);

  return {
    /**
     * Check if user can create resource
     */
    async canCreate(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName) && canWrite(role, resourceName);
    },

    /**
     * Check if user can read resource
     */
    async canRead(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName);
    },

    /**
     * Check if user can update resource
     */
    async canUpdate(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName) && canWrite(role, resourceName);
    },

    /**
     * Check if user can delete resource
     */
    async canDelete(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName) && canDelete(role, resourceName);
    },

    /**
     * Check if user can archive resource
     */
    async canArchive(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName) && canWrite(role, resourceName);
    },

    /**
     * Check if user can restore resource
     */
    async canRestore(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName) && canWrite(role, resourceName);
    },

    /**
     * Check if user can export resource
     */
    async canExport(): Promise<boolean> {
      const role = await getUserRole() as UserRole;
      return hasPermission(role, resourceName);
    },

    /**
     * Validate user has permission to create resource
     */
    async validateCreate(): Promise<void> {
      if (!(await this.canCreate())) {
        throw new AuthorizationError(`You do not have permission to create ${resourceName}`);
      }
    },

    /**
     * Validate user has permission to read resource
     */
    async validateRead(): Promise<void> {
      if (!(await this.canRead())) {
        throw new AuthorizationError(`You do not have permission to view ${resourceName}`);
      }
    },

    /**
     * Validate user has permission to update resource
     */
    async validateUpdate(): Promise<void> {
      if (!(await this.canUpdate())) {
        throw new AuthorizationError(`You do not have permission to update ${resourceName}`);
      }
    },

    /**
     * Validate user has permission to delete resource
     */
    async validateDelete(): Promise<void> {
      if (!(await this.canDelete())) {
        throw new AuthorizationError(`You do not have permission to delete ${resourceName}`);
      }
    },

    /**
     * Validate user has permission to archive resource
     */
    async validateArchive(): Promise<void> {
      if (!(await this.canArchive())) {
        throw new AuthorizationError(`You do not have permission to archive ${resourceName}`);
      }
    },

    /**
     * Validate user has permission to restore resource
     */
    async validateRestore(): Promise<void> {
      if (!(await this.canRestore())) {
        throw new AuthorizationError(`You do not have permission to restore ${resourceName}`);
      }
    },

    /**
     * Validate user has permission to export resource
     */
    async validateExport(): Promise<void> {
      if (!(await this.canExport())) {
        throw new AuthorizationError(`You do not have permission to export ${resourceName}`);
      }
    },

    /**
     * Validate record belongs to user's clinic
     */
    async validateClinicAccess(recordId: string, table: string): Promise<void> {
      const clinicId = await getUserClinicId();
      const supabase = getSupabaseClient();

      const { data: record, error } = await supabase
        .from(table)
        .select('clinic_id')
        .eq('id', recordId)
        .single();

      if (error || !record) {
        throw new AuthorizationError(`${resourceCapitalized} not found`);
      }

      if (record.clinic_id !== clinicId) {
        throw new AuthorizationError(`You do not have access to this ${resourceName.slice(0, -1)}`);
      }
    },
  };
}

/**
 * Type for permission checkers
 */
export type PermissionCheckers = ReturnType<typeof createPermissionCheckers>;
