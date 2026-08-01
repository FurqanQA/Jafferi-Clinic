/**
 * User roles in the system
 */
export type UserRole = 'owner' | 'administrator' | 'doctor' | 'receptionist' | 'accountant' | 'staff' | 'lab_technician' | 'radiologist';

/**
 * Permission levels
 */
export type PermissionLevel = 'read' | 'write' | 'delete' | 'admin';

/**
 * Resource types for permissions
 */
export type ResourceType = 
  | 'patients'
  | 'appointments'
  | 'doctors'
  | 'clinics'
  | 'billing'
  | 'reports'
  | 'settings'
  | 'users'
  | 'medical_records'
  | 'prescriptions'
  | 'laboratory';

/**
 * Role permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, ResourceType[]> = {
  owner: ['patients', 'appointments', 'doctors', 'clinics', 'billing', 'reports', 'settings', 'users', 'medical_records', 'prescriptions', 'laboratory'],
  administrator: ['patients', 'appointments', 'doctors', 'clinics', 'billing', 'reports', 'settings', 'medical_records', 'prescriptions', 'laboratory'],
  doctor: ['patients', 'appointments', 'reports', 'medical_records', 'prescriptions', 'laboratory'],
  receptionist: ['patients', 'appointments', 'medical_records', 'prescriptions', 'laboratory'],
  accountant: ['billing', 'reports'],
  staff: ['patients', 'appointments', 'medical_records', 'prescriptions', 'laboratory'],
  lab_technician: ['laboratory'],
  radiologist: ['laboratory'],
};

/**
 * Check if a role has permission for a resource
 */
export function hasPermission(role: UserRole, resource: ResourceType): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(resource);
}

/**
 * Check if a role has admin level permission
 */
export function hasAdminPermission(role: UserRole): boolean {
  return role === 'owner' || role === 'administrator';
}

/**
 * Check if a role can write to a resource
 */
export function canWrite(role: UserRole, resource: ResourceType): boolean {
  if (!hasPermission(role, resource)) {
    return false;
  }
  
  // Staff and receptionists have limited write permissions
  if (role === 'staff' || role === 'receptionist') {
    return ['patients', 'appointments'].includes(resource);
  }
  
  // Accountants can only write to billing
  if (role === 'accountant') {
    return resource === 'billing';
  }
  
  // Doctors can write to patients, appointments, medical_records, and prescriptions
  if (role === 'doctor') {
    return ['patients', 'appointments', 'medical_records', 'prescriptions'].includes(resource);
  }
  
  // Owners and administrators have full write access
  return true;
}

/**
 * Check if a role can delete a resource
 */
export function canDelete(role: UserRole, resource: ResourceType): boolean {
  if (!hasPermission(role, resource)) {
    return false;
  }
  
  // Only owners and administrators can delete
  return role === 'owner' || role === 'administrator';
}

/**
 * Get all resources a role can access
 */
export function getAccessibleResources(role: UserRole): ResourceType[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Validate if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
}
