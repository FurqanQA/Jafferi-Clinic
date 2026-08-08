import { z } from 'zod';
import { ReportCategory, ReportType, ReportStatus, ExportFormat, ScheduleFrequency } from './report-types';

// ============================================================================
// Report Validation
// Zod validation schemas for report entities
// ============================================================================

/**
 * Report filter validation schema
 */
export const ReportFilterSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'contains', 'startsWith', 'endsWith']),
  value: z.any(),
  label: z.string().optional(),
});

/**
 * Report column validation schema
 */
export const ReportColumnSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['string', 'number', 'date', 'boolean', 'currency', 'percentage']),
  aggregatable: z.boolean(),
  sortable: z.boolean(),
  filterable: z.boolean(),
  format: z.string().optional(),
});

/**
 * Report schedule validation schema
 */
export const ReportScheduleSchema = z.object({
  enabled: z.boolean(),
  frequency: z.nativeEnum(ScheduleFrequency),
  cronExpression: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
});

/**
 * Report sharing validation schema
 */
export const ReportSharingSchema = z.object({
  users: z.array(z.string()),
  roles: z.array(z.string()),
  clinics: z.array(z.string()),
  permissions: z.enum(['view', 'edit', 'admin']),
});

/**
 * Report validation schema
 */
export const ReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  category: z.nativeEnum(ReportCategory),
  type: z.nativeEnum(ReportType),
  status: z.nativeEnum(ReportStatus).optional(),
  clinicId: z.string().min(1, 'Clinic ID is required'),
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().optional(),
  parameters: z.record(z.string(), z.any()),
  filters: z.array(ReportFilterSchema),
  columns: z.array(ReportColumnSchema).min(1, 'At least one column is required'),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.array(z.string()).optional(),
  schedule: ReportScheduleSchema.optional(),
  sharing: ReportSharingSchema,
  isPublic: z.boolean(),
  isTemplate: z.boolean(),
  templateId: z.string().optional(),
});

/**
 * Report template validation schema
 */
export const ReportTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  category: z.nativeEnum(ReportCategory),
  type: z.nativeEnum(ReportType),
  isSystemTemplate: z.boolean(),
  createdBy: z.string().min(1, 'Created by is required'),
  parameters: z.record(z.string(), z.any()),
  filters: z.array(ReportFilterSchema),
  columns: z.array(ReportColumnSchema).min(1, 'At least one column is required'),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.array(z.string()).optional(),
});

/**
 * Report subscription validation schema
 */
export const ReportSubscriptionSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  email: z.boolean(),
  inApp: z.boolean(),
  frequency: z.nativeEnum(ScheduleFrequency),
});

/**
 * KPI definition validation schema
 */
export const KPIDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  category: z.nativeEnum(ReportCategory),
  formula: z.string().min(1, 'Formula is required'),
  unit: z.string().min(1, 'Unit is required'),
  target: z.number().optional(),
  threshold: z.number().optional(),
  period: z.string().min(1, 'Period is required'),
});

/**
 * Analytics data point validation schema
 */
export const AnalyticsDataPointSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  value: z.number(),
  label: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Trend analysis validation schema
 */
export const TrendAnalysisSchema = z.object({
  metric: z.string().min(1, 'Metric is required'),
  period: z.string().min(1, 'Period is required'),
  data: z.array(AnalyticsDataPointSchema),
  trend: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
  growthRate: z.number(),
  forecast: z.array(AnalyticsDataPointSchema).optional(),
  seasonality: z.record(z.string(), z.number()).optional(),
});

/**
 * Forecast data validation schema
 */
export const ForecastDataSchema = z.object({
  metric: z.string().min(1, 'Metric is required'),
  period: z.string().min(1, 'Period is required'),
  historical: z.array(AnalyticsDataPointSchema),
  forecast: z.array(AnalyticsDataPointSchema),
  confidence: z.number().min(0).max(1),
  methodology: z.string().min(1, 'Methodology is required'),
  generatedAt: z.string().min(1, 'Generated at is required'),
});

/**
 * Validate report data
 */
export function validateReport(data: unknown): z.infer<typeof ReportSchema> {
  return ReportSchema.parse(data);
}

/**
 * Validate report template data
 */
export function validateReportTemplate(data: unknown): z.infer<typeof ReportTemplateSchema> {
  return ReportTemplateSchema.parse(data);
}

/**
 * Validate report subscription data
 */
export function validateReportSubscription(data: unknown): z.infer<typeof ReportSubscriptionSchema> {
  return ReportSubscriptionSchema.parse(data);
}

/**
 * Validate KPI definition data
 */
export function validateKPIDefinition(data: unknown): z.infer<typeof KPIDefinitionSchema> {
  return KPIDefinitionSchema.parse(data);
}

/**
 * Validate analytics data point
 */
export function validateAnalyticsDataPoint(data: unknown): z.infer<typeof AnalyticsDataPointSchema> {
  return AnalyticsDataPointSchema.parse(data);
}

/**
 * Validate trend analysis data
 */
export function validateTrendAnalysis(data: unknown): z.infer<typeof TrendAnalysisSchema> {
  return TrendAnalysisSchema.parse(data);
}

/**
 * Validate forecast data
 */
export function validateForecastData(data: unknown): z.infer<typeof ForecastDataSchema> {
  return ForecastDataSchema.parse(data);
}
