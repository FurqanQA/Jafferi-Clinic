// ============================================================================
// Platform Services Index
// Central export point for all platform services
// NOTE: Some modules have type/function conflicts. Import directly from module files for those.
// ============================================================================

// Core Types and Validation
export type * from './platform-types';
export * from './platform-validation';
export * from './platform-permissions';

// Platform Engine
export * from './platform-engine';

// Tenant Management
export * from './tenant-manager';
export * from './clinic-manager';
export * from './organization-manager';
export * from './owner-manager';
// Note: staff-manager has type conflicts with platform-types (DaySchedule) - import directly

// Subscription and Billing
export * from './subscription-manager';
export * from './licensing';
export * from './plans';
export * from './usage';
// Note: coupons, invoices have type conflicts with platform-types - import directly from module

// Feature Management
// Note: feature-flags has type conflicts with platform-types - import directly
export * from './feature-manager';
// Note: module-manager has type conflicts with platform-types - import directly from module

// Background Processing
export * from './scheduler';
// Note: cron-jobs has type conflicts with platform-types - import directly
export * from './queue-manager';
export * from './dead-letter-queue';
// Note: background-jobs, retry-engine have type conflicts with platform-types - import directly from module

// Caching and Storage
export * from './redis';
export * from './cache-manager';
// Note: cache has type conflicts with platform-types - import directly from module

// Monitoring and Observability
export * from './monitoring';
export * from './diagnostics';
export * from './uptime';
// Note: metrics, health, alerts have type conflicts with platform-types - import directly from module

// Logging and Auditing
export * from './audit';
// Note: logging has type conflicts with platform-types - import directly from module
// Note: activity has function conflicts with analytics - import directly from module

// Backup and Maintenance
export * from './restore';
export * from './maintenance';
export * from './deployment';
// Note: backup, snapshots, environment, secrets have type conflicts with platform-types - import directly from module

// Integrations
// Note: integrations, plugins, webhooks, marketplace have type conflicts with platform-types - import directly from module

// Support and Communications
export * from './support';
// Note: support-tickets, announcements have type conflicts with platform-types - import directly from module

// Analytics and Revenue
// Note: analytics has function conflicts with activity - import directly from module
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
