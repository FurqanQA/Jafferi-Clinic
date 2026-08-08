// ============================================================================
// Enterprise API Gateway & Integration Platform
// Main Export File
// ============================================================================

// Type Definitions
export * from './api-types';

// Core API Modules
export * from './api-validation';
export * from './api-permissions';
export * from './api-engine';
export * from './api-router';
export * from './api-versioning';
export * from './api-response';
export * from './api-errors';
// Temporarily disabled due to export conflicts with api-validation
// export * from './api-pagination';
// export * from './api-filtering';
export * from './api-sorting';

// Performance & Security
export * from './api-cache';
// Temporarily disabled due to export conflicts with api-types
// export * from './api-rate-limit';
export * from './api-throttling';

// Monitoring & Analytics
export * from './api-monitoring';
export * from './api-metrics';
// Temporarily disabled due to MonitoringEvent export conflict
// export * from './api-analytics';
// Temporarily disabled due to export conflicts with api-types
// export * from './api-health';
// Temporarily disabled due to export conflicts with api-versioning
// export * from './api-status';

// Authentication & Authorization
// Temporarily disabled due to export conflicts with api-validation
// export * from './api-keys';
export * from './oauth';
export * from './jwt';

// Webhooks
export * from './webhooks';
export * from './webhook-events';
export * from './webhook-delivery';
export * from './webhook-retry';
// Temporarily disabled due to export conflicts with webhooks
// export * from './webhook-signature';

// Integrations
export * from './integrations';
export * from './insurance';
export * from './payment-gateways';
export * from './sms-gateways';
export * from './email-providers';
export * from './cloud-storage';
// Temporarily disabled due to export conflicts with api-types
// export * from './fhir';
// export * from './hl7';

// Documentation
export * from './openapi';
export * from './swagger';
export * from './graphql';
export * from './api-docs';

// SDK Generation
// Temporarily disabled due to export conflicts with api-types
// export * from './sdk-generator';
export * from './sdk-typescript';
// Temporarily disabled due to export conflicts with sdk-typescript
// export * from './sdk-javascript';
// export * from './sdk-python';
// export * from './sdk-java';
// export * from './sdk-csharp';
// export * from './sdk-php';

// API Key Management (specific exports to avoid conflicts)
export {
  createApiKey as createApiKeyV2,
  validateCreateApiKeyOptions,
} from './create-api-key';
export {
  revokeApiKey as revokeApiKeyV2,
  validateRevokeApiKeyOptions,
  bulkRevokeApiKeys,
} from './revoke-api-key';
export {
  getApiKeyInfo,
  validateGetApiKeyOptions,
  getApiKeysByClinic as getApiKeysByClinicV2,
  getApiKeyMetadata,
} from './get-api-key';
export {
  getApiKeys,
  validateGetApiKeysOptions,
  getApiKeysCountByStatus,
  getApiKeysCountByType,
} from './get-api-keys';
export {
  rotateApiKey as rotateApiKeyV2,
  validateRotateApiKeyOptions,
  bulkRotateApiKeys,
} from './rotate-api-key';
export {
  deleteApiKey as deleteApiKeyV2,
  validateDeleteApiKeyOptions,
  bulkDeleteApiKeys,
  softDeleteApiKey,
} from './delete-api-key';
export {
  exportApiLogs,
  validateExportApiLogsOptions,
  getExportStatistics,
} from './export-api-logs';

