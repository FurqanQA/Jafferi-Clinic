import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Report, ReportCategory, ReportType, ReportFilter, ReportColumn } from './report-types';
import { validateReportEditPermission, validateReportCategoryAccess } from './report-permissions';

// ============================================================================
// Report Builder
// Custom report builder for creating and configuring reports
// ============================================================================

/**
 * Report builder state
 */
export interface ReportBuilderState {
  title?: string;
  description?: string;
  category?: ReportCategory;
  type?: ReportType;
  parameters: Record<string, any>;
  filters: ReportFilter[];
  columns: ReportColumn[];
  groupBy?: string[];
  sortBy?: string[];
  isPublic: boolean;
  isTemplate: boolean;
  templateId?: string;
}

/**
 * Initialize report builder
 */
export function initializeReportBuilder(): ReportBuilderState {
  return {
    parameters: {},
    filters: [],
    columns: [],
    isPublic: false,
    isTemplate: false,
  };
}

/**
 * Set report title
 */
export function setReportTitle(builder: ReportBuilderState, title: string): ReportBuilderState {
  return { ...builder, title };
}

/**
 * Set report description
 */
export function setReportDescription(builder: ReportBuilderState, description: string): ReportBuilderState {
  return { ...builder, description };
}

/**
 * Set report category
 */
export function setReportCategory(builder: ReportBuilderState, category: ReportCategory): ReportBuilderState {
  return { ...builder, category };
}

/**
 * Set report type
 */
export function setReportType(builder: ReportBuilderState, type: ReportType): ReportBuilderState {
  return { ...builder, type };
}

/**
 * Add filter to report
 */
export function addReportFilter(builder: ReportBuilderState, filter: ReportFilter): ReportBuilderState {
  return {
    ...builder,
    filters: [...builder.filters, filter],
  };
}

/**
 * Remove filter from report
 */
export function removeReportFilter(builder: ReportBuilderState, field: string): ReportBuilderState {
  return {
    ...builder,
    filters: builder.filters.filter(f => f.field !== field),
  };
}

/**
 * Add column to report
 */
export function addReportColumn(builder: ReportBuilderState, column: ReportColumn): ReportBuilderState {
  return {
    ...builder,
    columns: [...builder.columns, column],
  };
}

/**
 * Remove column from report
 */
export function removeReportColumn(builder: ReportBuilderState, field: string): ReportBuilderState {
  return {
    ...builder,
    columns: builder.columns.filter(c => c.field !== field),
  };
}

/**
 * Set group by fields
 */
export function setGroupBy(builder: ReportBuilderState, groupBy: string[]): ReportBuilderState {
  return { ...builder, groupBy };
}

/**
 * Set sort by fields
 */
export function setSortBy(builder: ReportBuilderState, sortBy: string[]): ReportBuilderState {
  return { ...builder, sortBy };
}

/**
 * Set report parameter
 */
export function setReportParameter(builder: ReportBuilderState, key: string, value: any): ReportBuilderState {
  return {
    ...builder,
    parameters: { ...builder.parameters, [key]: value },
  };
}

/**
 * Set report visibility
 */
export function setReportVisibility(builder: ReportBuilderState, isPublic: boolean): ReportBuilderState {
  return { ...builder, isPublic };
}

/**
 * Set template mode
 */
export function setTemplateMode(builder: ReportBuilderState, isTemplate: boolean): ReportBuilderState {
  return { ...builder, isTemplate };
}

/**
 * Set template reference
 */
export function setTemplateReference(builder: ReportBuilderState, templateId: string): ReportBuilderState {
  return { ...builder, templateId };
}

/**
 * Build report from builder state
 */
export function buildReport(builder: ReportBuilderState): Partial<Report> {
  return {
    title: builder.title,
    description: builder.description,
    category: builder.category,
    type: builder.type,
    parameters: builder.parameters,
    filters: builder.filters,
    columns: builder.columns,
    groupBy: builder.groupBy,
    sortBy: builder.sortBy,
    isPublic: builder.isPublic,
    isTemplate: builder.isTemplate,
    templateId: builder.templateId,
  };
}

/**
 * Validate builder state
 */
export function validateBuilderState(builder: ReportBuilderState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!builder.title || builder.title.trim().length === 0) {
    errors.push('Report title is required');
  }

  if (!builder.category) {
    errors.push('Report category is required');
  }

  if (!builder.type) {
    errors.push('Report type is required');
  }

  if (!builder.columns || builder.columns.length === 0) {
    errors.push('At least one column is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available columns for category
 */
export function getAvailableColumns(category: ReportCategory): ReportColumn[] {
  // Placeholder for column definitions based on category
  const columnMap: Record<ReportCategory, ReportColumn[]> = {
    [ReportCategory.FINANCIAL]: [
      { field: 'date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'amount', label: 'Amount', type: 'currency', aggregatable: true, sortable: true, filterable: true },
      { field: 'description', label: 'Description', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.PATIENT]: [
      { field: 'patient_id', label: 'Patient ID', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'name', label: 'Name', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'age', label: 'Age', type: 'number', aggregatable: true, sortable: true, filterable: true },
    ],
    [ReportCategory.DOCTOR]: [
      { field: 'doctor_id', label: 'Doctor ID', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'name', label: 'Name', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'specialty', label: 'Specialty', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.APPOINTMENT]: [
      { field: 'appointment_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'duration', label: 'Duration', type: 'number', aggregatable: true, sortable: true, filterable: true },
    ],
    [ReportCategory.PRESCRIPTION]: [
      { field: 'prescription_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'medicine', label: 'Medicine', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'quantity', label: 'Quantity', type: 'number', aggregatable: true, sortable: true, filterable: true },
    ],
    [ReportCategory.LABORATORY]: [
      { field: 'test_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'test_type', label: 'Test Type', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'result', label: 'Result', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.INVENTORY]: [
      { field: 'item_name', label: 'Item Name', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'quantity', label: 'Quantity', type: 'number', aggregatable: true, sortable: true, filterable: true },
      { field: 'expiry_date', label: 'Expiry Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.BILLING]: [
      { field: 'invoice_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'amount', label: 'Amount', type: 'currency', aggregatable: true, sortable: true, filterable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.PAYMENT]: [
      { field: 'payment_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'amount', label: 'Amount', type: 'currency', aggregatable: true, sortable: true, filterable: true },
      { field: 'method', label: 'Method', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.NOTIFICATION]: [
      { field: 'sent_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'type', label: 'Type', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.DASHBOARD]: [
      { field: 'metric', label: 'Metric', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'value', label: 'Value', type: 'number', aggregatable: true, sortable: true, filterable: true },
      { field: 'date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.OPERATIONAL]: [
      { field: 'date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'metric', label: 'Metric', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'value', label: 'Value', type: 'number', aggregatable: true, sortable: true, filterable: true },
    ],
    [ReportCategory.COMPLIANCE]: [
      { field: 'audit_date', label: 'Date', type: 'date', aggregatable: false, sortable: true, filterable: true },
      { field: 'type', label: 'Type', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, sortable: true, filterable: true },
    ],
    [ReportCategory.KPI]: [
      { field: 'kpi_name', label: 'KPI Name', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'value', label: 'Value', type: 'number', aggregatable: true, sortable: true, filterable: true },
      { field: 'target', label: 'Target', type: 'number', aggregatable: true, sortable: true, filterable: true },
    ],
    [ReportCategory.FORECASTING]: [
      { field: 'period', label: 'Period', type: 'string', aggregatable: false, sortable: true, filterable: true },
      { field: 'actual', label: 'Actual', type: 'number', aggregatable: true, sortable: true, filterable: true },
      { field: 'forecast', label: 'Forecast', type: 'number', aggregatable: true, sortable: true, filterable: true },
    ],
    [ReportCategory.CUSTOM]: [],
  };

  return columnMap[category] || [];
}

/**
 * Get available filters for category
 */
export function getAvailableFilters(category: ReportCategory): string[] {
  // Placeholder for filter definitions based on category
  const filterMap: Record<ReportCategory, string[]> = {
    [ReportCategory.FINANCIAL]: ['date', 'amount', 'type', 'status'],
    [ReportCategory.PATIENT]: ['name', 'age', 'gender', 'registration_date'],
    [ReportCategory.DOCTOR]: ['name', 'specialty', 'department'],
    [ReportCategory.APPOINTMENT]: ['date', 'status', 'doctor', 'patient'],
    [ReportCategory.PRESCRIPTION]: ['date', 'medicine', 'doctor'],
    [ReportCategory.LABORATORY]: ['date', 'test_type', 'result'],
    [ReportCategory.INVENTORY]: ['item_name', 'category', 'expiry_date'],
    [ReportCategory.BILLING]: ['date', 'amount', 'status', 'patient'],
    [ReportCategory.PAYMENT]: ['date', 'amount', 'method', 'status'],
    [ReportCategory.NOTIFICATION]: ['date', 'type', 'status', 'recipient'],
    [ReportCategory.DASHBOARD]: ['date', 'metric'],
    [ReportCategory.OPERATIONAL]: ['date', 'metric', 'department'],
    [ReportCategory.COMPLIANCE]: ['date', 'type', 'status'],
    [ReportCategory.KPI]: ['kpi_name', 'period'],
    [ReportCategory.FORECASTING]: ['period', 'metric'],
    [ReportCategory.CUSTOM]: [],
  };

  return filterMap[category] || [];
}
