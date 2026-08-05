import { ReportCategory, ReportFilter } from './report-types';

// ============================================================================
// Report Filters
// Filter management and utilities for reports
// ============================================================================

/**
 * Available filter operators
 */
export const FILTER_OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'contains', 'startsWith', 'endsWith'] as const;

/**
 * Create a report filter
 */
export function createReportFilter(
  field: string,
  operator: typeof FILTER_OPERATORS[number],
  value: any,
  label?: string
): ReportFilter {
  return {
    field,
    operator,
    value,
    label: label || field,
  };
}

/**
 * Create date range filter
 */
export function createDateRangeFilter(
  field: string,
  from?: string | Date,
  to?: string | Date
): ReportFilter[] {
  const filters: ReportFilter[] = [];

  if (from) {
    filters.push(createReportFilter(field, 'gte', from, `${field} from`));
  }

  if (to) {
    filters.push(createReportFilter(field, 'lte', to, `${field} to`));
  }

  return filters;
}

/**
 * Create status filter
 */
export function createStatusFilter(field: string, statuses: string[]): ReportFilter {
  return createReportFilter(field, 'in', statuses, `${field} status`);
}

/**
 * Create text search filter
 */
export function createTextSearchFilter(field: string, query: string): ReportFilter {
  return createReportFilter(field, 'contains', query, `${field} search`);
}

/**
 * Create numeric range filter
 */
export function createNumericRangeFilter(
  field: string,
  min?: number,
  max?: number
): ReportFilter[] {
  const filters: ReportFilter[] = [];

  if (min !== undefined) {
    filters.push(createReportFilter(field, 'gte', min, `${field} min`));
  }

  if (max !== undefined) {
    filters.push(createReportFilter(field, 'lte', max, `${field} max`));
  }

  return filters;
}

/**
 * Validate filter
 */
export function validateFilter(filter: ReportFilter): { valid: boolean; error?: string } {
  if (!filter.field || filter.field.trim().length === 0) {
    return { valid: false, error: 'Filter field is required' };
  }

  if (!FILTER_OPERATORS.includes(filter.operator as any)) {
    return { valid: false, error: 'Invalid filter operator' };
  }

  if (filter.value === undefined || filter.value === null) {
    return { valid: false, error: 'Filter value is required' };
  }

  return { valid: true };
}

/**
 * Validate multiple filters
 */
export function validateFilters(filters: ReportFilter[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const filter of filters) {
    const validation = validateFilter(filter);
    if (!validation.valid) {
      errors.push(validation.error || 'Invalid filter');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge filters
 */
export function mergeFilters(...filterGroups: ReportFilter[][]): ReportFilter[] {
  return filterGroups.flat();
}

/**
 * Remove filter by field
 */
export function removeFilterByField(filters: ReportFilter[], field: string): ReportFilter[] {
  return filters.filter(f => f.field !== field);
}

/**
 * Remove filter by index
 */
export function removeFilterByIndex(filters: ReportFilter[], index: number): ReportFilter[] {
  return filters.filter((_, i) => i !== index);
}

/**
 * Update filter value
 */
export function updateFilterValue(filters: ReportFilter[], field: string, value: any): ReportFilter[] {
  return filters.map(f => f.field === field ? { ...f, value } : f);
}

/**
 * Get filter by field
 */
export function getFilterByField(filters: ReportFilter[], field: string): ReportFilter | undefined {
  return filters.find(f => f.field === field);
}

/**
 * Convert filters to query string
 */
export function filtersToQueryString(filters: ReportFilter[]): string {
  return filters
    .map(f => `${f.field}[${f.operator}]=${encodeURIComponent(JSON.stringify(f.value))}`)
    .join('&');
}

/**
 * Parse query string to filters
 */
export function queryStringToFilters(queryString: string): ReportFilter[] {
  const filters: ReportFilter[] = [];
  const params = new URLSearchParams(queryString);

  params.forEach((value, key) => {
    const match = key.match(/(.+)\[(.+)\]/);
    if (match) {
      const field = match[1];
      const operator = match[2];
      try {
        const parsedValue = JSON.parse(decodeURIComponent(value));
        filters.push(createReportFilter(field, operator as any, parsedValue));
      } catch {
        // Skip invalid values
      }
    }
  });

  return filters;
}

/**
 * Get available filters for category
 */
export function getAvailableFiltersForCategory(category: ReportCategory): Array<{
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}> {
  const filterMap: Record<ReportCategory, Array<any>> = {
    [ReportCategory.FINANCIAL]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'amount', label: 'Amount', type: 'number' },
      { field: 'type', label: 'Type', type: 'select', options: ['income', 'expense'] },
      { field: 'status', label: 'Status', type: 'select', options: ['pending', 'completed', 'cancelled'] },
    ],
    [ReportCategory.PATIENT]: [
      { field: 'name', label: 'Name', type: 'text' },
      { field: 'age', label: 'Age', type: 'number' },
      { field: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
      { field: 'registration_date', label: 'Registration Date', type: 'date' },
    ],
    [ReportCategory.DOCTOR]: [
      { field: 'name', label: 'Name', type: 'text' },
      { field: 'specialty', label: 'Specialty', type: 'text' },
      { field: 'department', label: 'Department', type: 'text' },
    ],
    [ReportCategory.APPOINTMENT]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled', 'no_show'] },
      { field: 'doctor', label: 'Doctor', type: 'text' },
    ],
    [ReportCategory.PRESCRIPTION]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'medicine', label: 'Medicine', type: 'text' },
      { field: 'doctor', label: 'Doctor', type: 'text' },
    ],
    [ReportCategory.LABORATORY]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'test_type', label: 'Test Type', type: 'text' },
      { field: 'result', label: 'Result', type: 'select', options: ['positive', 'negative', 'pending'] },
    ],
    [ReportCategory.INVENTORY]: [
      { field: 'item_name', label: 'Item Name', type: 'text' },
      { field: 'category', label: 'Category', type: 'text' },
      { field: 'expiry_date', label: 'Expiry Date', type: 'date' },
    ],
    [ReportCategory.BILLING]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'amount', label: 'Amount', type: 'number' },
      { field: 'status', label: 'Status', type: 'select', options: ['pending', 'paid', 'overdue'] },
    ],
    [ReportCategory.PAYMENT]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'amount', label: 'Amount', type: 'number' },
      { field: 'method', label: 'Method', type: 'select', options: ['cash', 'card', 'insurance'] },
    ],
    [ReportCategory.NOTIFICATION]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'type', label: 'Type', type: 'text' },
      { field: 'status', label: 'Status', type: 'select', options: ['sent', 'delivered', 'failed'] },
    ],
    [ReportCategory.DASHBOARD]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'metric', label: 'Metric', type: 'text' },
    ],
    [ReportCategory.OPERATIONAL]: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'metric', label: 'Metric', type: 'text' },
      { field: 'department', label: 'Department', type: 'text' },
    ],
    [ReportCategory.COMPLIANCE]: [
      { field: 'audit_date', label: 'Audit Date', type: 'date' },
      { field: 'type', label: 'Type', type: 'text' },
      { field: 'status', label: 'Status', type: 'select', options: ['compliant', 'non_compliant', 'pending'] },
    ],
    [ReportCategory.KPI]: [
      { field: 'kpi_name', label: 'KPI Name', type: 'text' },
      { field: 'period', label: 'Period', type: 'text' },
    ],
    [ReportCategory.FORECASTING]: [
      { field: 'period', label: 'Period', type: 'text' },
      { field: 'metric', label: 'Metric', type: 'text' },
    ],
    [ReportCategory.CUSTOM]: [],
  };

  return filterMap[category] || [];
}

/**
 * Serialize filters for storage
 */
export function serializeFilters(filters: ReportFilter[]): string {
  return JSON.stringify(filters);
}

/**
 * Deserialize filters from storage
 */
export function deserializeFilters(serialized: string): ReportFilter[] {
  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
}

/**
 * Clone filters
 */
export function cloneFilters(filters: ReportFilter[]): ReportFilter[] {
  return JSON.parse(JSON.stringify(filters));
}
