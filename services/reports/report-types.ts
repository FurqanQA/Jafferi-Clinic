import { PaginationParams } from '../core/pagination';
import { SortParams } from '../core/sorting';
import { FilterParams } from '../core/filters';

// ============================================================================
// Report Types
// Type definitions for the Enterprise Reporting & Business Intelligence Service
// ============================================================================

/**
 * Report category enum
 */
export enum ReportCategory {
  FINANCIAL = 'FINANCIAL',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  APPOINTMENT = 'APPOINTMENT',
  PRESCRIPTION = 'PRESCRIPTION',
  LABORATORY = 'LABORATORY',
  INVENTORY = 'INVENTORY',
  BILLING = 'BILLING',
  PAYMENT = 'PAYMENT',
  NOTIFICATION = 'NOTIFICATION',
  DASHBOARD = 'DASHBOARD',
  OPERATIONAL = 'OPERATIONAL',
  COMPLIANCE = 'COMPLIANCE',
  KPI = 'KPI',
  FORECASTING = 'FORECASTING',
  CUSTOM = 'CUSTOM',
}

/**
 * Report type enum
 */
export enum ReportType {
  SUMMARY = 'SUMMARY',
  DETAILED = 'DETAILED',
  ANALYTICAL = 'ANALYTICAL',
  COMPARATIVE = 'COMPARATIVE',
  TREND = 'TREND',
  FORECAST = 'FORECAST',
  AUDIT = 'AUDIT',
  COMPLIANCE = 'COMPLIANCE',
  EXECUTIVE = 'EXECUTIVE',
  OPERATIONAL = 'OPERATIONAL',
}

/**
 * Report status enum
 */
export enum ReportStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Export format enum
 */
export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  JSON = 'JSON',
  PRINT = 'PRINT',
}

/**
 * Schedule frequency enum
 */
export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

/**
 * Report request options
 */
export interface ReportRequestOptions {
  clinicId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Report definition interface
 */
export interface Report {
  id: string;
  title: string;
  description?: string;
  category: ReportCategory;
  type: ReportType;
  status: ReportStatus;
  clinicId: string;
  createdBy: string;
  updatedBy?: string;
  parameters: Record<string, any>;
  filters: ReportFilter[];
  columns: ReportColumn[];
  groupBy?: string[];
  sortBy?: string[];
  schedule?: ReportSchedule;
  sharing: ReportSharing;
  isPublic: boolean;
  isTemplate: boolean;
  templateId?: string;
  executionTime?: number;
  lastGeneratedAt?: string;
  nextScheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report filter interface
 */
export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  label?: string;
}

/**
 * Report column interface
 */
export interface ReportColumn {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  aggregatable: boolean;
  sortable: boolean;
  filterable: boolean;
  format?: string;
}

/**
 * Report schedule interface
 */
export interface ReportSchedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  timezone: string;
  recipients: string[];
  emailSubject?: string;
  emailBody?: string;
}

/**
 * Report sharing interface
 */
export interface ReportSharing {
  users: string[];
  roles: string[];
  clinics: string[];
  permissions: 'view' | 'edit' | 'admin';
}

/**
 * Report template interface
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: ReportCategory;
  type: ReportType;
  isSystemTemplate: boolean;
  createdBy: string;
  parameters: Record<string, any>;
  filters: ReportFilter[];
  columns: ReportColumn[];
  groupBy?: string[];
  sortBy?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Report history interface
 */
export interface ReportHistory {
  id: string;
  reportId: string;
  generatedBy: string;
  generatedAt: string;
  executionTime: number;
  recordCount: number;
  status: ReportStatus;
  errorMessage?: string;
  filePath?: string;
  fileSize?: number;
  expiresAt?: string;
}

/**
 * Report cache interface
 */
export interface ReportCache {
  id: string;
  reportId: string;
  cacheKey: string;
  data: any;
  generatedAt: string;
  expiresAt: string;
  hitCount: number;
}

/**
 * Report subscription interface
 */
export interface ReportSubscription {
  id: string;
  reportId: string;
  userId: string;
  email: boolean;
  inApp: boolean;
  frequency: ScheduleFrequency;
  subscribedAt: string;
  lastSentAt?: string;
}

/**
 * KPI definition interface
 */
export interface KPIDefinition {
  id: string;
  name: string;
  description?: string;
  category: ReportCategory;
  formula: string;
  unit: string;
  target?: number;
  threshold?: number;
  trend: 'up' | 'down' | 'neutral';
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  period: string;
  lastCalculatedAt: string;
}

/**
 * Analytics data point interface
 */
export interface AnalyticsDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Trend analysis interface
 */
export interface TrendAnalysis {
  metric: string;
  period: string;
  data: AnalyticsDataPoint[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  growthRate: number;
  forecast?: AnalyticsDataPoint[];
  seasonality?: Record<string, number>;
}

/**
 * Forecast data interface
 */
export interface ForecastData {
  metric: string;
  period: string;
  historical: AnalyticsDataPoint[];
  forecast: AnalyticsDataPoint[];
  confidence: number;
  methodology: string;
  generatedAt: string;
}

/**
 * Financial report data interface
 */
export interface FinancialReportData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  outstandingInvoices: number;
  paymentsReceived: number;
  refunds: number;
  cashFlow: number;
  taxSummary: number;
  revenueByClinic: Record<string, number>;
  revenueByDoctor: Record<string, number>;
  revenueByService: Record<string, number>;
}

/**
 * Patient report data interface
 */
export interface PatientReportData {
  newPatients: number;
  returningPatients: number;
  totalPatients: number;
  growthRate: number;
  genderDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
  averageVisitFrequency: number;
  retentionRate: number;
  inactivePatients: number;
}

/**
 * Doctor report data interface
 */
export interface DoctorReportData {
  doctorId: string;
  doctorName: string;
  consultations: number;
  revenue: number;
  appointmentCompletionRate: number;
  averageConsultationTime: number;
  patientSatisfaction?: number;
  workload: number;
  utilization: number;
}

/**
 * Appointment report data interface
 */
export interface AppointmentReportData {
  totalAppointments: number;
  completed: number;
  noShows: number;
  cancellations: number;
  reschedules: number;
  averageWaitingTime: number;
  averageConsultationTime: number;
  peakHours: Record<string, number>;
}

/**
 * Prescription report data interface
 */
export interface PrescriptionReportData {
  totalPrescriptions: number;
  uniqueMedicines: number;
  frequentlyPrescribed: Array<{ medicine: string; count: number }>;
  controlledMedicines?: number;
  refills: number;
  medicationTrends: AnalyticsDataPoint[];
}

/**
 * Laboratory report data interface
 */
export interface LaboratoryReportData {
  totalTests: number;
  positiveResults: number;
  pendingTests: number;
  criticalResults: number;
  averageTurnaroundTime: number;
  testTypeDistribution: Record<string, number>;
}

/**
 * Inventory report data interface
 */
export interface InventoryReportData {
  currentStock: number;
  stockValue: number;
  lowStockItems: number;
  nearExpiryItems: number;
  expiredItems: number;
  fastMoving: Array<{ item: string; turnover: number }>;
  slowMoving: Array<{ item: string; turnover: number }>;
  supplierPerformance: Record<string, number>;
  purchaseSummary: number;
}

/**
 * Compliance report data interface
 */
export interface ComplianceReportData {
  hipaaAudits?: number;
  activityLogs: number;
  medicalRecordAccess: number;
  loginReports: number;
  permissionReports: number;
  violations?: number;
  resolvedViolations?: number;
}
