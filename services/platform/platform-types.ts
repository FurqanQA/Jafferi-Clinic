// ============================================================================
// Platform Types
// Core type definitions for the Enterprise SaaS Platform
// ============================================================================

/**
 * Tenant Status
 */
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
}

/**
 * Clinic Status
 */
export enum ClinicStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Tenant
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  ownerId: string;
  subscriptionId: string | null;
  planId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  settings: TenantSettings;
  limits: TenantLimits;
  usage: TenantUsage;
}

/**
 * Tenant Settings
 */
export interface TenantSettings {
  timezone: string;
  locale: string;
  currency: string;
  customDomain: string | null;
  branding: TenantBranding;
  features: Record<string, boolean>;
}

/**
 * Tenant Branding
 */
export interface TenantBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  customCSS: string | null;
}

/**
 * Tenant Limits
 */
export interface TenantLimits {
  users: number;
  patients: number;
  appointments: number;
  storage: number; // in bytes
  apiCalls: number;
  aiTokens: number;
}

/**
 * Tenant Usage
 */
export interface TenantUsage {
  users: number;
  patients: number;
  appointments: number;
  storage: number; // in bytes
  apiCalls: number;
  aiTokens: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Clinic
 */
export interface Clinic {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  settings: ClinicSettings;
}

/**
 * Clinic Settings
 */
export interface ClinicSettings {
  timezone: string;
  locale: string;
  currency: string;
  businessHours: BusinessHours;
  appointmentSettings: AppointmentSettings;
  notifications: NotificationSettings;
}

/**
 * Business Hours
 */
export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

/**
 * Day Schedule
 */
export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

/**
 * Appointment Settings
 */
export interface AppointmentSettings {
  defaultDuration: number;
  slotInterval: number;
  allowWalkIns: boolean;
  requireConfirmation: boolean;
  cancellationDeadline: number;
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  appointmentReminders: boolean;
  reminderHours: number;
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
}

/**
 * Billing Cycle
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Subscription
 */
export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Plan
 */
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  trialDays: number;
  features: PlanFeature[];
  limits: TenantLimits;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Plan Feature
 */
export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit: number | null;
}

/**
 * Coupon
 */
export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  applicablePlans: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice
 */
export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
}

/**
 * Invoice Item
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Feature Flag
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  valueType: 'boolean' | 'string' | 'number' | 'json';
  value: string;
  rolloutPercentage: number;
  conditions: FeatureFlagCondition[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature Flag Condition
 */
export interface FeatureFlagCondition {
  type: 'tenant' | 'user' | 'subscription' | 'environment';
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: string;
}

/**
 * Module
 */
export interface Module {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Job Status
 */
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

/**
 * Job Priority
 */
export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Background Job
 */
export interface BackgroundJob {
  id: string;
  type: string;
  status: JobStatus;
  priority: JobPriority;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  delay: number;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retry Policy
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Dead Letter Queue Entry
 */
export interface DeadLetterEntry {
  id: string;
  originalJobId: string;
  jobType: string;
  payload: Record<string, unknown>;
  error: string;
  failedAt: string;
  attempts: number;
  reason: string;
  createdAt: string;
}

/**
 * Metric Type
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Metric
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

/**
 * Health Status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

/**
 * Health Check
 */
export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message: string;
  lastChecked: string;
  responseTime: number;
  metadata: Record<string, unknown>;
}

/**
 * System Health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  checks: HealthCheck[];
}

/**
 * Diagnostic Info
 */
export interface DiagnosticInfo {
  version: string;
  environment: string;
  uptime: number;
  memory: MemoryInfo;
  cpu: CpuInfo;
  disk: DiskInfo;
  network: NetworkInfo;
}

/**
 * Memory Info
 */
export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

/**
 * CPU Info
 */
export interface CpuInfo {
  usage: number;
  cores: number;
  loadAverage: number[];
}

/**
 * Disk Info
 */
export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

/**
 * Network Info
 */
export interface NetworkInfo {
  interfaces: NetworkInterface[];
}

/**
 * Network Interface
 */
export interface NetworkInterface {
  name: string;
  address: string;
  bytesReceived: number;
  bytesSent: number;
}

/**
 * Uptime Metric
 */
export interface UptimeMetric {
  period: string;
  availability: number;
  downtime: number;
  incidents: Incident[];
}

/**
 * Incident
 */
export interface Incident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  startedAt: string;
  endedAt: string | null;
  resolved: boolean;
}

/**
 * Alert
 */
export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  metadata: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/**
 * Cache Entry
 */
export interface CacheEntry {
  key: string;
  value: unknown;
  ttl: number;
  createdAt: string;
  accessedAt: string;
  hitCount: number;
}

/**
 * Cache Statistics
 */
export interface CacheStatistics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
}

/**
 * Log Entry
 */
export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, unknown>;
  timestamp: string;
  source: string;
  tenantId: string | null;
  userId: string | null;
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

/**
 * Activity Log Entry
 */
export interface ActivityLogEntry {
  id: string;
  type: string;
  description: string;
  userId: string;
  tenantId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

/**
 * Backup
 */
export interface Backup {
  id: string;
  name: string;
  type: 'manual' | 'automatic';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size: number;
  location: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
}

/**
 * Snapshot
 */
export interface Snapshot {
  id: string;
  name: string;
  description: string;
  backupId: string;
  pointInTime: string;
  createdAt: string;
}

/**
 * Maintenance Mode
 */
export interface MaintenanceMode {
  enabled: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  message: string | null;
  allowedIps: string[];
  allowedUsers: string[];
}

/**
 * Environment
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Environment Config
 */
export interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  databaseUrl: string;
  redisUrl: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

/**
 * Secret
 */
export interface Secret {
  id: string;
  key: string;
  value: string;
  description: string;
  environment: Environment;
  lastRotated: string;
  expiresAt: string | null;
}

/**
 * Integration
 */
export interface Integration {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  configuration: Record<string, unknown>;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Plugin
 */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: 'installed' | 'active' | 'inactive' | 'error';
  permissions: string[];
  settings: Record<string, unknown>;
  installedAt: string;
  updatedAt: string;
}

/**
 * Webhook
 */
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Support Ticket
 */
export interface SupportTicket {
  id: string;
  tenantId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

/**
 * Announcement
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  target: 'all' | 'admins' | 'specific';
  targetTenants: string[];
  isActive: boolean;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Analytics Metric
 */
export interface AnalyticsMetric {
  name: string;
  value: number;
  change: number;
  period: string;
}

/**
 * Revenue Data
 */
export interface RevenueData {
  period: string;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  revenue: number;
  newRevenue: number;
  churnRevenue: number;
  expansionRevenue: number;
  customers: number;
  newCustomers: number;
  churnedCustomers: number;
}

/**
 * Forecast Data
 */
export interface ForecastData {
  period: string;
  projectedRevenue: number;
  projectedCustomers: number;
  confidence: number;
  factors: ForecastFactor[];
}

/**
 * Forecast Factor
 */
export interface ForecastFactor {
  name: string;
  impact: number;
  description: string;
}
