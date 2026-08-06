// ============================================================================
// Enterprise API Gateway & Integration Platform
// Type Definitions and Interfaces
// ============================================================================

/**
 * API Version
 */
export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

/**
 * API Key Status
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

/**
 * API Key Scope
 */
export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  FULL = 'full',
}

/**
 * API Key Type
 */
export enum ApiKeyType {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
}

/**
 * HTTP Methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * API Response Status
 */
export enum ApiResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL = 'partial',
}

/**
 * Webhook Event Types
 */
export enum WebhookEventType {
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  PATIENT_REGISTERED = 'patient.registered',
  PATIENT_UPDATED = 'patient.updated',
  PRESCRIPTION_CREATED = 'prescription.created',
  PRESCRIPTION_UPDATED = 'prescription.updated',
  INVOICE_ISSUED = 'invoice.issued',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  LAB_RESULT_READY = 'lab.result_ready',
  LAB_RESULT_UPDATED = 'lab.result_updated',
  NOTIFICATION_SENT = 'notification.sent',
  INVENTORY_LOW = 'inventory.low',
  INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock',
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_DELETED = 'document.deleted',
  DOCTOR_CREATED = 'doctor.created',
  DOCTOR_UPDATED = 'doctor.updated',
}

/**
 * Webhook Delivery Status
 */
export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
  EXPIRED = 'expired',
}

/**
 * OAuth Grant Types
 */
export enum OAuthGrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  CLIENT_CREDENTIALS = 'client_credentials',
  REFRESH_TOKEN = 'refresh_token',
  PASSWORD = 'password',
}

/**
 * OAuth Response Types
 */
export enum OAuthResponseType {
  CODE = 'code',
  TOKEN = 'token',
}

/**
 * Integration Type
 */
export enum IntegrationType {
  INSURANCE = 'insurance',
  PAYMENT_GATEWAY = 'payment_gateway',
  SMS_GATEWAY = 'sms_gateway',
  EMAIL_PROVIDER = 'email_provider',
  CLOUD_STORAGE = 'cloud_storage',
  FHIR_SERVER = 'fhir_server',
  HL7_INTERFACE = 'hl7_interface',
  CUSTOM = 'custom',
}

/**
 * Integration Status
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

/**
 * FHIR Resource Types
 */
export enum FhirResourceType {
  PATIENT = 'Patient',
  PRACTITIONER = 'Practitioner',
  APPOINTMENT = 'Appointment',
  MEDICATION = 'Medication',
  MEDICATION_REQUEST = 'MedicationRequest',
  MEDICATION_DISPENSE = 'MedicationDispense',
  OBSERVATION = 'Observation',
  DIAGNOSTIC_REPORT = 'DiagnosticReport',
  ENCOUNTER = 'Encounter',
  CONDITION = 'Condition',
  INVOICE = 'Invoice',
  DOCUMENT_REFERENCE = 'DocumentReference',
}

/**
 * HL7 Message Types
 */
export enum Hl7MessageType {
  ADT_A01 = 'ADT^A01', // Admit Patient
  ADT_A03 = 'ADT^A03', // Discharge Patient
  ADT_A04 = 'ADT^A04', // Register Patient
  ORM_O01 = 'ORM^O01', // Order Message
  ORU_R01 = 'ORU^R01', // Observation Result
  SIU_S12 = 'SIU^S12', // Schedule Appointment
  DFT_P03 = 'DFT^P03', // Financial Transaction
}

/**
 * SDK Language
 */
export enum SdkLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  PHP = 'php',
}

/**
 * API Key
 */
export interface ApiKey {
  id: string;
  clinicId: string;
  name: string;
  key: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  scopes: ApiKeyScope[];
  type: ApiKeyType;
  rateLimit: number;
  allowedIps: string[];
  allowedOrigins: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * API Request Context
 */
export interface ApiRequestContext {
  requestId: string;
  apiKey?: ApiKey;
  clinicId: string;
  userId?: string;
  version: ApiVersion;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * API Response
 */
export interface ApiResponse<T = unknown> {
  status: ApiResponseStatus;
  code: string;
  message: string;
  data?: T;
  meta?: {
    requestId: string;
    timestamp: string;
    version: ApiVersion;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  errors?: ApiError[];
}

/**
 * API Error
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Rate Limit Config
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Webhook
 */
export interface Webhook {
  id: string;
  clinicId: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  headers?: Record<string, string>;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  timeout: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastTriggeredAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook Event
 */
export interface WebhookEvent {
  id: string;
  clinicId: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: unknown;
  timestamp: string;
  processed: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook Delivery
 */
export interface WebhookDelivery {
  id: string;
  clinicId: string;
  webhookId: string;
  eventId: string;
  url: string;
  status: WebhookDeliveryStatus;
  statusCode?: number;
  response?: string;
  attempt: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * OAuth Client
 */
export interface OAuthClient {
  id: string;
  clinicId: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grantTypes: OAuthGrantType[];
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * OAuth Token
 */
export interface OAuthToken {
  id: string;
  clientId: string;
  userId?: string;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

/**
 * Integration
 */
export interface Integration {
  id: string;
  clinicId: string;
  type: IntegrationType;
  name: string;
  provider: string;
  config: Record<string, unknown>;
  status: IntegrationStatus;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    endpoint?: string;
    [key: string]: unknown;
  };
  webhooksEnabled: boolean;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * API Log
 */
export interface ApiLog {
  id: string;
  clinicId: string;
  apiKeyId?: string;
  userId?: string;
  requestId: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * API Metrics
 */
export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  topEndpoints: Array<{
    path: string;
    count: number;
    avgLatency: number;
  }>;
  topErrors: Array<{
    code: string;
    count: number;
  }>;
}

/**
 * API Analytics
 */
export interface ApiAnalytics {
  dateRange: {
    start: string;
    end: string;
  };
  totalRequests: number;
  uniqueApiKeys: number;
  uniqueClinics: number;
  topEndpoints: Array<{
    path: string;
    count: number;
    percentage: number;
  }>;
  slowEndpoints: Array<{
    path: string;
    avgLatency: number;
    maxLatency: number;
  }>;
  failedRequests: Array<{
    endpoint: string;
    count: number;
    errorRate: number;
  }>;
  activeClinics: Array<{
    clinicId: string;
    clinicName: string;
    requestCount: number;
  }>;
  activeApiKeys: Array<{
    keyId: string;
    keyName: string;
    requestCount: number;
  }>;
}

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    duration: number;
    message?: string;
  }>;
}

/**
 * API Status
 */
export interface ApiStatus {
  status: 'operational' | 'degraded' | 'down';
  message: string;
  incidents: Array<{
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    createdAt: string;
    updatedAt: string;
  }>;
  scheduledMaintenance: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
  }>;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter Options
 */
export interface FilterOptions {
  [key: string]: unknown;
}

/**
 * SDK Generation Config
 */
export interface SdkGenerationConfig {
  language: SdkLanguage;
  version: string;
  baseUrl: string;
  includeTypes: boolean;
  includeDocs: boolean;
  customConfig?: Record<string, unknown>;
}

/**
 * SDK
 */
export interface Sdk {
  id: string;
  clinicId: string;
  language: SdkLanguage;
  version: string;
  name: string;
  description?: string;
  code: string;
  downloadUrl: string;
  size: number;
  checksum: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  downloads: number;
}
