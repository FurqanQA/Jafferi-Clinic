// ============================================================================
// Platform Services Index
// Central export point for all platform services
// ============================================================================

// Core Types and Validation
export * from './platform-types';
export * from './platform-validation';
export * from './platform-permissions';

// Platform Engine
export * from './platform-engine';

// Tenant Management
export * from './tenant-manager';
export * from './clinic-manager';
export * from './organization-manager';
export * from './owner-manager';
export * from './staff-manager';

// Subscription and Billing
export * from './subscription-manager';
export * from './licensing';
export * from './plans';
export * from './coupons';
export * from './invoices';
export * from './usage';

// Feature Management
export * from './feature-flags';
export * from './feature-manager';
export * from './module-manager';

// Background Processing
export * from './scheduler';
export * from './cron-jobs';
export * from './queue-manager';
export * from './background-jobs';
export * from './retry-engine';
export * from './dead-letter-queue';

// Caching and Storage
export * from './redis';
export * from './cache';
export * from './cache-manager';

// Monitoring and Observability
export * from './monitoring';
export * from './metrics';
export * from './health';
export * from './diagnostics';
export * from './uptime';
export * from './alerts';

// Logging and Auditing
export * from './logging';
export * from './audit';
export * from './activity';

// Backup and Maintenance
export * from './backup';
export * from './restore';
export * from './snapshots';
export * from './maintenance';
export * from './deployment';
export * from './environment';
export * from './secrets';

// Integrations
export * from './integrations';
export * from './plugins';
export * from './marketplace';
export * from './webhooks';

// Support and Communications
export * from './support';
export * from './support-tickets';
export * from './announcements';

// Analytics and Revenue
export * from './analytics';
export * from './revenue';
export * from './forecasting';

// Tenant Lifecycle Operations
export { createTenant as createTenantWorkflow } from './create-tenant';
export { updateTenant as updateTenantWorkflow } from './update-tenant';
export { deleteTenant as deleteTenantWorkflow } from './delete-tenant';
export { suspendTenant as suspendTenantWorkflow } from './suspend-tenant';
export { restoreTenant as restoreTenantWorkflow } from './restore-tenant';
export { getTenant as getTenantWorkflow } from './get-tenant';
export { listTenants as listTenantsWorkflow } from './get-tenants';
export { searchTenants } from './search-tenants';
export { exportTenants } from './export-tenants';
