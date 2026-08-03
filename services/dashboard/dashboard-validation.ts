import { z } from 'zod';
import { ValidationError } from '../core/errors';
import { logger } from '../shared/logger';
import { DashboardRole, DateRange, WidgetType, ChartType, DashboardRequestOptions, AnalyticsRequestOptions } from './dashboard-types';

// ============================================================================
// Dashboard Validation
// Validation schemas and functions for dashboard operations
// ============================================================================

/**
 * Validate dashboard role
 */
export function validateDashboardRole(role: string): DashboardRole {
  const validRoles = Object.values(DashboardRole);
  
  if (!validRoles.includes(role as DashboardRole)) {
    throw new ValidationError(`Invalid dashboard role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
  }
  
  return role as DashboardRole;
}

/**
 * Validate date range
 */
export function validateDateRange(dateRange: DateRange): DateRange {
  const validRanges = Object.values(DateRange);
  
  if (!validRanges.includes(dateRange)) {
    throw new ValidationError(`Invalid date range: ${dateRange}. Valid ranges are: ${validRanges.join(', ')}`);
  }
  
  return dateRange;
}

/**
 * Validate custom date range
 */
export function validateCustomDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    throw new ValidationError('Invalid start date format');
  }
  
  if (isNaN(end.getTime())) {
    throw new ValidationError('Invalid end date format');
  }
  
  if (start > end) {
    throw new ValidationError('Start date must be before or equal to end date');
  }
  
  // Limit date range to 1 year
  const maxDate = new Date(start);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  if (end > maxDate) {
    throw new ValidationError('Date range cannot exceed 1 year');
  }
}

/**
 * Validate widget type
 */
export function validateWidgetType(widgetType: string): WidgetType {
  const validTypes = Object.values(WidgetType);
  
  if (!validTypes.includes(widgetType as WidgetType)) {
    throw new ValidationError(`Invalid widget type: ${widgetType}. Valid types are: ${validTypes.join(', ')}`);
  }
  
  return widgetType as WidgetType;
}

/**
 * Validate chart type
 */
export function validateChartType(chartType: string): ChartType {
  const validTypes = Object.values(ChartType);
  
  if (!validTypes.includes(chartType as ChartType)) {
    throw new ValidationError(`Invalid chart type: ${chartType}. Valid types are: ${validTypes.join(', ')}`);
  }
  
  return chartType as ChartType;
}

/**
 * Validate dashboard request options
 */
export const dashboardRequestOptionsSchema = z.object({
  role: z.nativeEnum(DashboardRole),
  dateRange: z.nativeEnum(DateRange).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  includeWidgets: z.array(z.nativeEnum(WidgetType)).optional(),
  includeCharts: z.array(z.nativeEnum(ChartType)).optional(),
  cacheKey: z.string().optional(),
  bypassCache: z.boolean().optional(),
}).refine((data) => {
  // If custom date range, both dates must be provided
  if (data.dateRange === DateRange.CUSTOM) {
    return data.startDate !== undefined && data.endDate !== undefined;
  }
  return true;
}, {
  message: 'Custom date range requires both startDate and endDate',
}).refine((data) => {
  // Validate date range consistency
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
});

/**
 * Validate dashboard request
 */
export function validateDashboardRequest(options: unknown): DashboardRequestOptions {
  try {
    return dashboardRequestOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Dashboard request validation failed', { errors: error.errors });
      throw new ValidationError('Invalid dashboard request', { errors: error.errors });
    }
    throw error;
  }
}

/**
 * Validate analytics request options
 */
export const analyticsRequestOptionsSchema = z.object({
  metric: z.string().min(1),
  aggregation: z.enum(['sum', 'count', 'average', 'min', 'max']).optional(),
  groupBy: z.string().optional(),
  filters: z.record(z.any()).optional(),
  dateRange: z.nativeEnum(DateRange).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Validate analytics request
 */
export function validateAnalyticsRequest(options: unknown): AnalyticsRequestOptions {
  try {
    return analyticsRequestOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Analytics request validation failed', { errors: error.errors });
      throw new ValidationError('Invalid analytics request', { errors: error.errors });
    }
    throw error;
  }
}

/**
 * Validate export format
 */
export function validateExportFormat(format: string): 'csv' | 'json' | 'excel' | 'pdf' {
  const validFormats = ['csv', 'json', 'excel', 'pdf'];
  
  if (!validFormats.includes(format)) {
    throw new ValidationError(`Invalid export format: ${format}. Valid formats are: ${validFormats.join(', ')}`);
  }
  
  return format as 'csv' | 'json' | 'excel' | 'pdf';
}

/**
 * Validate cache key
 */
export function validateCacheKey(cacheKey: string): void {
  if (!cacheKey || cacheKey.length === 0) {
    throw new ValidationError('Cache key cannot be empty');
  }
  
  if (cacheKey.length > 255) {
    throw new ValidationError('Cache key cannot exceed 255 characters');
  }
  
  // Only allow alphanumeric, hyphens, underscores, and colons
  const validPattern = /^[a-zA-Z0-9:_-]+$/;
  if (!validPattern.test(cacheKey)) {
    throw new ValidationError('Cache key contains invalid characters');
  }
}

/**
 * Validate clinic access
 */
export async function validateClinicAccess(clinicId: string, userClinicId: string): Promise<void> {
  if (clinicId !== userClinicId) {
    throw new ValidationError('Access denied: Cannot access data from another clinic');
  }
}

/**
 * Validate user access for patient dashboard
 */
export async function validatePatientDashboardAccess(
  requestingUserId: string,
  targetPatientId: string
): Promise<void> {
  // Patient can only view their own dashboard
  if (requestingUserId !== targetPatientId) {
    throw new ValidationError('Access denied: Patients can only view their own dashboard');
  }
}

/**
 * Validate doctor access for doctor dashboard
 */
export async function validateDoctorDashboardAccess(
  requestingUserId: string,
  targetDoctorId: string
): Promise<void> {
  // Doctor can only view their own dashboard (unless admin/owner)
  if (requestingUserId !== targetDoctorId) {
    throw new ValidationError('Access denied: Doctors can only view their own dashboard');
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
  const validatedLimit = limit !== undefined ? Math.min(Math.max(limit, 1), 1000) : 50;
  const validatedOffset = offset !== undefined ? Math.max(offset, 0) : 0;
  
  return { limit: validatedLimit, offset: validatedOffset };
}

/**
 * Validate sorting parameters
 */
export function validateSorting(sortBy?: string, sortOrder?: 'asc' | 'desc'): {
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  const validSortOrders = ['asc', 'desc'];
  const validatedSortOrder = sortOrder && validSortOrders.includes(sortOrder) ? sortOrder : 'desc';
  
  return { sortBy, sortOrder: validatedSortOrder };
}
