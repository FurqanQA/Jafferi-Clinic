import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { Integration, IntegrationType, IntegrationStatus } from './api-types';

// ============================================================================
// Integrations
// Third-party integration management
// ============================================================================

/**
 * Integration Storage
 */
interface IntegrationStorage {
  integrations: Map<string, Integration>;
}

/**
 * Integration registry
 */
const integrationRegistry: IntegrationStorage = {
  integrations: new Map(),
};

/**
 * Create integration
 */
export async function createIntegration(
  clinicId: string,
  name: string,
  provider: string,
  type: IntegrationType,
  config: Record<string, unknown>,
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    endpoint?: string;
    [key: string]: unknown;
  },
  createdBy: string
): Promise<Integration> {
  const integrationId = crypto.randomUUID();
  const now = new Date();

  const integration: Integration = {
    id: integrationId,
    clinicId,
    name,
    provider,
    type,
    config,
    credentials,
    status: IntegrationStatus.ACTIVE,
    webhooksEnabled: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy,
  };

  integrationRegistry.integrations.set(integrationId, integration);
  cache.set(`integration:${integrationId}`, JSON.stringify(integration), 86400000);

  logger.info('Integration created', { integrationId, clinicId, name, type });
  return integration;
}

/**
 * Get integration
 */
export async function getIntegration(integrationId: string): Promise<Integration | null> {
  const cached = cache.get<string>(`integration:${integrationId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const integration = integrationRegistry.integrations.get(integrationId);
  if (integration) {
    cache.set(`integration:${integrationId}`, JSON.stringify(integration), 86400000);
    return integration;
  }

  return null;
}

/**
 * Get integrations by clinic
 */
export async function getIntegrationsByClinic(
  clinicId: string,
  type?: IntegrationType
): Promise<Integration[]> {
  const integrations: Integration[] = [];

  for (const integration of integrationRegistry.integrations.values()) {
    if (integration.clinicId === clinicId) {
      if (!type || integration.type === type) {
        integrations.push(integration);
      }
    }
  }

  return integrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get integrations by type
 */
export async function getIntegrationsByType(type: IntegrationType): Promise<Integration[]> {
  const integrations: Integration[] = [];

  for (const integration of integrationRegistry.integrations.values()) {
    if (integration.type === type) {
      integrations.push(integration);
    }
  }

  return integrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Update integration
 */
export async function updateIntegration(
  integrationId: string,
  updates: Partial<Omit<Integration, 'id' | 'clinicId' | 'createdAt' | 'createdBy'>>
): Promise<Integration | null> {
  const integration = integrationRegistry.integrations.get(integrationId);
  if (!integration) {
    return null;
  }

  const updated: Integration = {
    ...integration,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  integrationRegistry.integrations.set(integrationId, updated);
  cache.set(`integration:${integrationId}`, JSON.stringify(updated), 86400000);

  logger.info('Integration updated', { integrationId });
  return updated;
}

/**
 * Update integration config
 */
export async function updateIntegrationConfig(
  integrationId: string,
  config: Record<string, unknown>
): Promise<Integration | null> {
  const integration = integrationRegistry.integrations.get(integrationId);
  if (!integration) {
    return null;
  }

  integration.config = config;
  integration.updatedAt = new Date().toISOString();

  integrationRegistry.integrations.set(integrationId, integration);
  cache.set(`integration:${integrationId}`, JSON.stringify(integration), 86400000);

  logger.info('Integration config updated', { integrationId });
  return integration;
}

/**
 * Activate integration
 */
export async function activateIntegration(integrationId: string): Promise<boolean> {
  const integration = integrationRegistry.integrations.get(integrationId);
  if (!integration) {
    return false;
  }

  integration.status = IntegrationStatus.ACTIVE;
  integration.updatedAt = new Date().toISOString();

  integrationRegistry.integrations.set(integrationId, integration);
  cache.set(`integration:${integrationId}`, JSON.stringify(integration), 86400000);

  logger.info('Integration activated', { integrationId });
  return true;
}

/**
 * Deactivate integration
 */
export async function deactivateIntegration(integrationId: string): Promise<boolean> {
  const integration = integrationRegistry.integrations.get(integrationId);
  if (!integration) {
    return false;
  }

  integration.status = IntegrationStatus.INACTIVE;
  integration.updatedAt = new Date().toISOString();

  integrationRegistry.integrations.set(integrationId, integration);
  cache.set(`integration:${integrationId}`, JSON.stringify(integration), 86400000);

  logger.info('Integration deactivated', { integrationId });
  return true;
}

/**
 * Delete integration
 */
export async function deleteIntegration(integrationId: string): Promise<boolean> {
  const integration = integrationRegistry.integrations.get(integrationId);
  if (!integration) {
    return false;
  }

  integrationRegistry.integrations.delete(integrationId);
  cache.delete(`integration:${integrationId}`);

  logger.info('Integration deleted', { integrationId });
  return true;
}

/**
 * Test integration connection
 */
export async function testIntegrationConnection(integrationId: string): Promise<{
  success: boolean;
  message?: string;
  latency?: number;
}> {
  const integration = integrationRegistry.integrations.get(integrationId);
  if (!integration) {
    return { success: false, message: 'Integration not found' };
  }

  try {
    const startTime = Date.now();
    
    // Placeholder for actual connection test
    // In production, this would test the actual integration
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const latency = Date.now() - startTime;

    return {
      success: true,
      message: 'Connection successful',
      latency,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Get integration statistics
 */
export async function getIntegrationStats(clinicId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
}> {
  const integrations = await getIntegrationsByClinic(clinicId);
  const byType: Record<string, number> = {};

  for (const integration of integrations) {
    byType[integration.type] = (byType[integration.type] || 0) + 1;
  }

  return {
    total: integrations.length,
    active: integrations.filter((i) => i.status === IntegrationStatus.ACTIVE).length,
    inactive: integrations.filter((i) => i.status === IntegrationStatus.INACTIVE).length,
    byType,
  };
}

/**
 * Validate integration config
 */
export function validateIntegrationConfig(type: IntegrationType, config: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (type) {
    case IntegrationType.INSURANCE:
      if (!config.apiKey) errors.push('API key is required');
      if (!config.providerId) errors.push('Provider ID is required');
      break;
    case IntegrationType.PAYMENT_GATEWAY:
      if (!config.apiKey) errors.push('API key is required');
      if (!config.merchantId) errors.push('Merchant ID is required');
      break;
    case IntegrationType.SMS_GATEWAY:
      if (!config.apiKey) errors.push('API key is required');
      if (!config.senderId) errors.push('Sender ID is required');
      break;
    case IntegrationType.EMAIL_PROVIDER:
      if (!config.apiKey) errors.push('API key is required');
      if (!config.fromEmail) errors.push('From email is required');
      break;
    case IntegrationType.CLOUD_STORAGE:
      if (!config.accessKey) errors.push('Access key is required');
      if (!config.secretKey) errors.push('Secret key is required');
      if (!config.bucket) errors.push('Bucket is required');
      break;
    case IntegrationType.FHIR_SERVER:
      if (!config.baseUrl) errors.push('Base URL is required');
      if (!config.authToken) errors.push('Auth token is required');
      break;
    case IntegrationType.HL7_INTERFACE:
      if (!config.host) errors.push('Host is required');
      if (!config.port) errors.push('Port is required');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available integration types
 */
export function getAvailableIntegrationTypes(): IntegrationType[] {
  return Object.values(IntegrationType);
}

/**
 * Get integration type display name
 */
export function getIntegrationTypeName(type: IntegrationType): string {
  const names: Record<IntegrationType, string> = {
    [IntegrationType.INSURANCE]: 'Insurance',
    [IntegrationType.PAYMENT_GATEWAY]: 'Payment Gateway',
    [IntegrationType.SMS_GATEWAY]: 'SMS Gateway',
    [IntegrationType.EMAIL_PROVIDER]: 'Email Provider',
    [IntegrationType.CLOUD_STORAGE]: 'Cloud Storage',
    [IntegrationType.FHIR_SERVER]: 'FHIR Server',
    [IntegrationType.HL7_INTERFACE]: 'HL7 Interface',
    [IntegrationType.CUSTOM]: 'Custom',
  };

  return names[type] || type;
}

/**
 * Mask sensitive config values
 */
export function maskConfigValues(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...config };
  const sensitiveKeys = ['apiKey', 'secretKey', 'password', 'authToken', 'accessToken'];

  for (const key of sensitiveKeys) {
    if (masked[key] && typeof masked[key] === 'string') {
      const value = masked[key] as string;
      masked[key] = value.length > 8 ? `${value.slice(0, 4)}****${value.slice(-4)}` : '****';
    }
  }

  return masked;
}
