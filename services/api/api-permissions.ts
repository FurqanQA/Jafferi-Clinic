import { getUserRole, getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { ApiKeyScope, ApiKeyType, ApiKeyStatus } from './api-types';

// ============================================================================
// API Permissions
// Role-Based Access Control for API Gateway operations
// ============================================================================

/**
 * API Permission Levels
 */
export enum ApiPermissionLevel {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ADMIN = 'admin',
}

/**
 * Role-based API access matrix
 */
const ROLE_API_ACCESS: Record<string, ApiPermissionLevel[]> = {
  Owner: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE, ApiPermissionLevel.DELETE, ApiPermissionLevel.ADMIN],
  Administrator: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE, ApiPermissionLevel.DELETE, ApiPermissionLevel.ADMIN],
  Developer: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE],
  System: [ApiPermissionLevel.VIEW, ApiPermissionLevel.ADMIN],
  Clinic: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE],
  'API Consumer': [ApiPermissionLevel.VIEW],
};

/**
 * Scope-based API access matrix
 */
const SCOPE_API_ACCESS: Record<ApiKeyScope, ApiPermissionLevel[]> = {
  [ApiKeyScope.READ]: [ApiPermissionLevel.VIEW],
  [ApiKeyScope.WRITE]: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE],
  [ApiKeyScope.ADMIN]: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE, ApiPermissionLevel.DELETE, ApiPermissionLevel.ADMIN],
  [ApiKeyScope.FULL]: [ApiPermissionLevel.VIEW, ApiPermissionLevel.CREATE, ApiPermissionLevel.UPDATE, ApiPermissionLevel.DELETE, ApiPermissionLevel.ADMIN],
};

/**
 * Check if user has API permission
 */
export async function hasApiPermission(permission: ApiPermissionLevel, role?: string): Promise<boolean> {
  const checkRole = role || await getUserRole();
  const permissions = ROLE_API_ACCESS[checkRole] || [];
  return permissions.includes(permission);
}

/**
 * Validate API permission
 */
export async function validateApiPermission(permission: ApiPermissionLevel, role?: string): Promise<void> {
  if (!(await hasApiPermission(permission, role))) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }
}

/**
 * Check if API key has required scope
 */
export function hasApiKeyScope(requiredScope: ApiKeyScope, keyScopes: ApiKeyScope[]): boolean {
  if (keyScopes.includes(ApiKeyScope.FULL)) {
    return true;
  }
  if (keyScopes.includes(ApiKeyScope.ADMIN)) {
    return true;
  }
  return keyScopes.includes(requiredScope);
}

/**
 * Validate API key scope
 */
export function validateApiKeyScope(requiredScope: ApiKeyScope, keyScopes: ApiKeyScope[]): void {
  if (!hasApiKeyScope(requiredScope, keyScopes)) {
    throw new Error(`Insufficient API key scope. Required: ${requiredScope}`);
  }
}

/**
 * Check if user can manage API keys
 */
export async function canManageApiKeys(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate API key management permission
 */
export async function validateApiKeyManagement(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Check if user can create API keys
 */
export async function canCreateApiKeys(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.CREATE, role);
}

/**
 * Validate API key creation permission
 */
export async function validateApiKeyCreation(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.CREATE, role);
}

/**
 * Check if user can manage webhooks
 */
export async function canManageWebhooks(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate webhook management permission
 */
export async function validateWebhookManagement(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Check if user can manage integrations
 */
export async function canManageIntegrations(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate integration management permission
 */
export async function validateIntegrationManagement(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Check if user can view API logs
 */
export async function canViewApiLogs(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Validate API log viewing permission
 */
export async function validateApiLogViewing(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Check if user can export API logs
 */
export async function canExportApiLogs(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate API log export permission
 */
export async function validateApiLogExport(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Check if user can manage OAuth clients
 */
export async function canManageOAuthClients(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate OAuth client management permission
 */
export async function validateOAuthClientManagement(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Check if API key is active
 */
export function isApiKeyActive(status: ApiKeyStatus): boolean {
  return status === ApiKeyStatus.ACTIVE;
}

/**
 * Validate API key status
 */
export function validateApiKeyStatus(status: ApiKeyStatus): void {
  if (!isApiKeyActive(status)) {
    throw new Error(`API key is not active. Status: ${status}`);
  }
}

/**
 * Check if API key type allows production access
 */
export function allowsProductionAccess(type: ApiKeyType): boolean {
  return type === ApiKeyType.PRODUCTION;
}

/**
 * Validate production access
 */
export function validateProductionAccess(type: ApiKeyType): void {
  if (!allowsProductionAccess(type)) {
    throw new Error('Production access not allowed for this API key type');
  }
}

/**
 * Check if user can access FHIR endpoints
 */
export async function canAccessFhir(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Validate FHIR access
 */
export async function validateFhirAccess(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Check if user can access HL7 endpoints
 */
export async function canAccessHl7(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Validate HL7 access
 */
export async function validateHl7Access(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Check if user can generate SDKs
 */
export async function canGenerateSdks(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate SDK generation permission
 */
export async function validateSdkGeneration(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Check if user can view analytics
 */
export async function canViewAnalytics(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Validate analytics viewing permission
 */
export async function validateAnalyticsViewing(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.VIEW, role);
}

/**
 * Check if user can manage rate limits
 */
export async function canManageRateLimits(role?: string): Promise<boolean> {
  return await hasApiPermission(ApiPermissionLevel.ADMIN, role);
}

/**
 * Validate rate limit management permission
 */
export async function validateRateLimitManagement(role?: string): Promise<void> {
  await validateApiPermission(ApiPermissionLevel.ADMIN, role);
}
