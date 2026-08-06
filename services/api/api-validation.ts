import { z } from 'zod';
import {
  ApiKeyScope,
  ApiKeyType,
  ApiKeyStatus,
  HttpMethod,
  WebhookEventType,
  OAuthGrantType,
  IntegrationType,
  IntegrationStatus,
  FhirResourceType,
  Hl7MessageType,
  SdkLanguage,
} from './api-types';

// ============================================================================
// API Validation
// Zod schemas for API Gateway validation
// ============================================================================

/**
 * API Key creation schema
 */
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1),
  type: z.nativeEnum(ApiKeyType),
  rateLimit: z.number().int().min(1).max(10000).default(1000),
  allowedIps: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-fA-F0-9:]+$/)).default([]),
  allowedOrigins: z.array(z.string().url({ message: 'Invalid URL' })).default([]),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * API Key update schema
 */
export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.nativeEnum(ApiKeyStatus).optional(),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  allowedIps: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-fA-F0-9:]+$/)).optional(),
  allowedOrigins: z.array(z.string().url({ message: 'Invalid URL' })).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Webhook creation schema
 */
export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url({ message: 'Invalid URL' }),
  events: z.array(z.nativeEnum(WebhookEventType)).min(1),
  headers: z.record(z.string(), z.string()).optional(),
  retryConfig: z.object({
    maxRetries: z.number().int().min(0).max(10).default(3),
    retryDelay: z.number().int().min(1).max(3600).default(60),
    backoffMultiplier: z.number().min(1).max(5).default(2),
  }).optional(),
  timeout: z.number().int().min(1).max(30000).default(5000),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Webhook update schema
 */
export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url({ message: 'Invalid URL' }).optional(),
  events: z.array(z.nativeEnum(WebhookEventType)).optional(),
  isActive: z.boolean().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retryConfig: z.object({
    maxRetries: z.number().int().min(0).max(10),
    retryDelay: z.number().int().min(1).max(3600),
    backoffMultiplier: z.number().min(1).max(5),
  }).optional(),
  timeout: z.number().int().min(1).max(30000).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * OAuth Client creation schema
 */
export const createOAuthClientSchema = z.object({
  name: z.string().min(1).max(100),
  redirectUris: z.array(z.string().url({ message: 'Invalid URL' })).min(1),
  grantTypes: z.array(z.nativeEnum(OAuthGrantType)).min(1),
  scopes: z.array(z.string()).min(1),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * OAuth Client update schema
 */
export const updateOAuthClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  redirectUris: z.array(z.string().url({ message: 'Invalid URL' })).optional(),
  grantTypes: z.array(z.nativeEnum(OAuthGrantType)).optional(),
  scopes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Integration creation schema
 */
export const createIntegrationSchema = z.object({
  type: z.nativeEnum(IntegrationType),
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(100),
  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  credentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    endpoint: z.string().url({ message: 'Invalid URL' }).optional(),
  }).passthrough().optional(),
  webhooksEnabled: z.boolean().default(false),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Integration update schema
 */
export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.nativeEnum(IntegrationStatus).optional(),
  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  credentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    endpoint: z.string().url({ message: 'Invalid URL' }).optional(),
  }).passthrough().optional(),
  webhooksEnabled: z.boolean().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Rate limit config schema
 */
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().int().min(1000).max(86400000),
  maxRequests: z.number().int().min(1).max(100000),
  skipSuccessfulRequests: z.boolean().optional(),
  skipFailedRequests: z.boolean().optional(),
});

/**
 * Pagination options schema
 */
export const paginationOptionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Filter options schema
 */
export const filterOptionsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]));

/**
 * SDK generation config schema
 */
export const sdkGenerationConfigSchema = z.object({
  language: z.nativeEnum(SdkLanguage),
  version: z.string().min(1),
  baseUrl: z.string().url(),
  includeTypes: z.boolean().default(true),
  includeDocs: z.boolean().default(true),
  customConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * API request validation schema
 */
export const apiRequestSchema = z.object({
  method: z.nativeEnum(HttpMethod),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

/**
 * FHIR resource schema (placeholder)
 */
export const fhirResourceSchema = z.object({
  resourceType: z.nativeEnum(FhirResourceType),
  id: z.string().optional(),
  meta: z.object({
    versionId: z.string().optional(),
    lastUpdated: z.string().datetime().optional(),
  }).optional(),
}).passthrough();

/**
 * HL7 message schema (placeholder)
 */
export const hl7MessageSchema = z.object({
  messageType: z.nativeEnum(Hl7MessageType),
  message: z.string(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Validate API key
 */
export function validateApiKey(data: unknown): z.infer<typeof createApiKeySchema> {
  return createApiKeySchema.parse(data);
}

/**
 * Validate webhook
 */
export function validateWebhook(data: unknown): z.infer<typeof createWebhookSchema> {
  return createWebhookSchema.parse(data);
}

/**
 * Validate OAuth client
 */
export function validateOAuthClient(data: unknown): z.infer<typeof createOAuthClientSchema> {
  return createOAuthClientSchema.parse(data);
}

/**
 * Validate integration
 */
export function validateIntegration(data: unknown): z.infer<typeof createIntegrationSchema> {
  return createIntegrationSchema.parse(data);
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(data: unknown): z.infer<typeof paginationOptionsSchema> {
  return paginationOptionsSchema.parse(data);
}

/**
 * Validate filter options
 */
export function validateFilterOptions(data: unknown): z.infer<typeof filterOptionsSchema> {
  return filterOptionsSchema.parse(data);
}

/**
 * Validate SDK generation config
 */
export function validateSdkGenerationConfig(data: unknown): z.infer<typeof sdkGenerationConfigSchema> {
  return sdkGenerationConfigSchema.parse(data);
}
