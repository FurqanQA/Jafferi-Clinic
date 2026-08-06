import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// FHIR (Fast Healthcare Interoperability Resources)
// FHIR server integration for healthcare data exchange
// ============================================================================

/**
 * FHIR Resource Types
 */
export enum FhirResourceType {
  PATIENT = 'Patient',
  OBSERVATION = 'Observation',
  ENCOUNTER = 'Encounter',
  CONDITION = 'Condition',
  MEDICATION_REQUEST = 'MedicationRequest',
  APPOINTMENT = 'Appointment',
  PRACTITIONER = 'Practitioner',
  LOCATION = 'Location',
  ORGANIZATION = 'Organization',
  BUNDLE = 'Bundle',
}

/**
 * FHIR Server Configuration
 */
export interface FhirServerConfig {
  baseUrl: string;
  authToken: string;
  version: string;
  timeout: number;
}

/**
 * FHIR Resource
 */
export interface FhirResource {
  resourceType: FhirResourceType;
  id: string;
  meta?: {
    versionId: string;
    lastUpdated: string;
  };
  [key: string]: unknown;
}

/**
 * FHIR Search Parameters
 */
export interface FhirSearchParams {
  resourceType: FhirResourceType;
  parameters: Record<string, string>;
}

/**
 * FHIR Response
 */
export interface FhirResponse<T = unknown> {
  resourceType: string;
  entry?: Array<{
    resource: T;
    fullUrl: string;
  }>;
  total?: number;
  issue?: Array<{
    severity: string;
    code: string;
    diagnostics: string;
  }>;
}

/**
 * Default FHIR server configuration
 */
const DEFAULT_FHIR_CONFIG: FhirServerConfig = {
  baseUrl: process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4',
  authToken: process.env.FHIR_AUTH_TOKEN || '',
  version: 'R4',
  timeout: 30000,
};

/**
 * Create FHIR resource
 */
export async function createFhirResource<T>(
  resource: FhirResource
): Promise<T> {
  try {
    const response = await fetch(`${DEFAULT_FHIR_CONFIG.baseUrl}/${resource.resourceType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
      body: JSON.stringify(resource),
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    logger.info('FHIR resource created', { 
      resourceType: resource.resourceType,
      id: result.id,
    });

    return result as T;
  } catch (error) {
    logger.error('FHIR resource creation failed', { error, resourceType: resource.resourceType });
    throw error;
  }
}

/**
 * Get FHIR resource by ID
 */
export async function getFhirResource<T>(
  resourceType: FhirResourceType,
  id: string
): Promise<T | null> {
  try {
    const cacheKey = `fhir:${resourceType}:${id}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await fetch(`${DEFAULT_FHIR_CONFIG.baseUrl}/${resourceType}/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    cache.set(cacheKey, JSON.stringify(result), 3600000); // Cache for 1 hour

    logger.info('FHIR resource retrieved', { resourceType, id });
    return result as T;
  } catch (error) {
    logger.error('FHIR resource retrieval failed', { error, resourceType, id });
    throw error;
  }
}

/**
 * Update FHIR resource
 */
export async function updateFhirResource<T>(
  resource: FhirResource
): Promise<T> {
  try {
    const response = await fetch(`${DEFAULT_FHIR_CONFIG.baseUrl}/${resource.resourceType}/${resource.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
      body: JSON.stringify(resource),
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Update cache
    const cacheKey = `fhir:${resource.resourceType}:${resource.id}`;
    cache.set(cacheKey, JSON.stringify(result), 3600000);

    logger.info('FHIR resource updated', { 
      resourceType: resource.resourceType,
      id: resource.id,
    });

    return result as T;
  } catch (error) {
    logger.error('FHIR resource update failed', { error, resourceType: resource.resourceType, id: resource.id });
    throw error;
  }
}

/**
 * Delete FHIR resource
 */
export async function deleteFhirResource(
  resourceType: FhirResourceType,
  id: string
): Promise<boolean> {
  try {
    const response = await fetch(`${DEFAULT_FHIR_CONFIG.baseUrl}/${resourceType}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    // Clear cache
    const cacheKey = `fhir:${resourceType}:${id}`;
    cache.delete(cacheKey);

    logger.info('FHIR resource deleted', { resourceType, id });
    return true;
  } catch (error) {
    logger.error('FHIR resource deletion failed', { error, resourceType, id });
    throw error;
  }
}

/**
 * Search FHIR resources
 */
export async function searchFhirResources<T>(
  params: FhirSearchParams
): Promise<FhirResponse<T>> {
  try {
    const queryString = new URLSearchParams(params.parameters).toString();
    const url = `${DEFAULT_FHIR_CONFIG.baseUrl}/${params.resourceType}?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as FhirResponse<T>;

    logger.info('FHIR resources searched', { 
      resourceType: params.resourceType,
      total: result.total,
    });

    return result;
  } catch (error) {
    logger.error('FHIR resource search failed', { error, resourceType: params.resourceType });
    throw error;
  }
}

/**
 * Execute FHIR operation
 */
export async function executeFhirOperation<T>(
  resourceType: FhirResourceType,
  operation: string,
  params?: Record<string, string>
): Promise<T> {
  try {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = `${DEFAULT_FHIR_CONFIG.baseUrl}/${resourceType}/${resourceType}/${operation}?${queryString}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    logger.info('FHIR operation executed', { 
      resourceType,
      operation,
    });

    return result as T;
  } catch (error) {
    logger.error('FHIR operation execution failed', { error, resourceType, operation });
    throw error;
  }
}

/**
 * Validate FHIR resource
 */
export function validateFhirResource(resource: FhirResource): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!resource.resourceType) {
    errors.push('Resource type is required');
  }

  if (!resource.id) {
    errors.push('Resource ID is required');
  }

  // Validate resource type
  const validResourceTypes = Object.values(FhirResourceType);
  if (resource.resourceType && !validResourceTypes.includes(resource.resourceType)) {
    errors.push(`Invalid resource type: ${resource.resourceType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert FHIR resource to JSON
 */
export function fhirResourceToJson(resource: FhirResource): string {
  return JSON.stringify(resource, null, 2);
}

/**
 * Parse FHIR resource from JSON
 */
export function parseFhirResource(json: string): FhirResource {
  try {
    return JSON.parse(json) as FhirResource;
  } catch (error) {
    throw new Error('Invalid FHIR JSON');
  }
}

/**
 * Get FHIR server capability statement
 */
export async function getCapabilityStatement(): Promise<unknown> {
  try {
    const response = await fetch(`${DEFAULT_FHIR_CONFIG.baseUrl}/metadata`, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    logger.info('FHIR capability statement retrieved');
    return result;
  } catch (error) {
    logger.error('FHIR capability statement retrieval failed', { error });
    throw error;
  }
}

/**
 * Batch FHIR operations
 */
export async function batchFhirOperations(operations: Array<{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
}>): Promise<unknown> {
  try {
    const bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: operations.map((op) => ({
        request: {
          method: op.method,
          url: op.url,
        },
        resource: op.body,
      })),
    };

    const response = await fetch(`${DEFAULT_FHIR_CONFIG.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Authorization': `Bearer ${DEFAULT_FHIR_CONFIG.authToken}`,
      },
      body: JSON.stringify(bundle),
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    logger.info('FHIR batch operations executed', { count: operations.length });
    return result;
  } catch (error) {
    logger.error('FHIR batch operations failed', { error });
    throw error;
  }
}

/**
 * Get FHIR configuration
 */
export function getFhirConfig(): FhirServerConfig {
  return { ...DEFAULT_FHIR_CONFIG };
}

/**
 * Update FHIR configuration
 */
export function updateFhirConfig(config: Partial<FhirServerConfig>): FhirServerConfig {
  Object.assign(DEFAULT_FHIR_CONFIG, config);
  logger.info('FHIR configuration updated', { config: DEFAULT_FHIR_CONFIG });
  return { ...DEFAULT_FHIR_CONFIG };
}
