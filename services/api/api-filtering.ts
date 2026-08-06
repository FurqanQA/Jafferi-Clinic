import { logger } from '../shared/logger';
import { FilterOptions } from './api-types';

// ============================================================================
// API Filtering
// Query filtering and data filtering utilities
// ============================================================================

/**
 * Filter Operator
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  BETWEEN = 'between',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
}

/**
 * Filter Condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Parse filter from query string
 */
export function parseFilterFromQuery(query: Record<string, string>): FilterCondition[] {
  const filters: FilterCondition[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const match = key.match(/filter\[(\w+)\]\[(\w+)\]/);
      if (match) {
        const field = match[1];
        const operatorStr = match[2];
        const operator = mapOperatorString(operatorStr);

        filters.push({
          field,
          operator,
          value: parseFilterValue(value),
        });
      }
    }
  }

  return filters;
}

/**
 * Map operator string to enum
 */
function mapOperatorString(operator: string): FilterOperator {
  const operatorMap: Record<string, FilterOperator> = {
    eq: FilterOperator.EQUALS,
    ne: FilterOperator.NOT_EQUALS,
    gt: FilterOperator.GREATER_THAN,
    gte: FilterOperator.GREATER_THAN_OR_EQUAL,
    lt: FilterOperator.LESS_THAN,
    lte: FilterOperator.LESS_THAN_OR_EQUAL,
    contains: FilterOperator.CONTAINS,
    startsWith: FilterOperator.STARTS_WITH,
    endsWith: FilterOperator.ENDS_WITH,
    in: FilterOperator.IN,
    notIn: FilterOperator.NOT_IN,
    between: FilterOperator.BETWEEN,
    isNull: FilterOperator.IS_NULL,
    isNotNull: FilterOperator.IS_NOT_NULL,
  };

  return operatorMap[operator] || FilterOperator.EQUALS;
}

/**
 * Parse filter value
 */
function parseFilterValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  const numValue = Number(value);
  if (!isNaN(numValue)) return numValue;

  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((v) => v.trim());
    }
  }

  return value;
}

/**
 * Apply filters to data
 */
export function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  conditions: FilterCondition[]
): T[] {
  return data.filter((item) => {
    return conditions.every((condition) => {
      return evaluateCondition(item, condition);
    });
  });
}

/**
 * Evaluate a single filter condition
 */
function evaluateCondition<T extends Record<string, unknown>>(
  item: T,
  condition: FilterCondition
): boolean {
  const fieldValue = item[condition.field];

  switch (condition.operator) {
    case FilterOperator.EQUALS:
      return fieldValue === condition.value;
    case FilterOperator.NOT_EQUALS:
      return fieldValue !== condition.value;
    case FilterOperator.GREATER_THAN:
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue > condition.value
        : false;
    case FilterOperator.GREATER_THAN_OR_EQUAL:
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue >= condition.value
        : false;
    case FilterOperator.LESS_THAN:
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue < condition.value
        : false;
    case FilterOperator.LESS_THAN_OR_EQUAL:
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue <= condition.value
        : false;
    case FilterOperator.CONTAINS:
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.toLowerCase().includes(condition.value.toLowerCase())
        : false;
    case FilterOperator.STARTS_WITH:
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.toLowerCase().startsWith(condition.value.toLowerCase())
        : false;
    case FilterOperator.ENDS_WITH:
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.toLowerCase().endsWith(condition.value.toLowerCase())
        : false;
    case FilterOperator.IN:
      return Array.isArray(condition.value) ? condition.value.includes(fieldValue) : false;
    case FilterOperator.NOT_IN:
      return Array.isArray(condition.value) ? !condition.value.includes(fieldValue) : false;
    case FilterOperator.BETWEEN:
      if (Array.isArray(condition.value) && condition.value.length === 2) {
        const [min, max] = condition.value;
        return typeof fieldValue === 'number'
          ? fieldValue >= (min as number) && fieldValue <= (max as number)
          : false;
      }
      return false;
    case FilterOperator.IS_NULL:
      return fieldValue === null || fieldValue === undefined;
    case FilterOperator.IS_NOT_NULL:
      return fieldValue !== null && fieldValue !== undefined;
    default:
      return true;
  }
}

/**
 * Build filter query string
 */
export function buildFilterQuery(conditions: FilterCondition[]): string {
  const params = new URLSearchParams();

  conditions.forEach((condition, index) => {
    const key = `filter[${condition.field}][${condition.operator}]`;
    const value = formatFilterValue(condition.value);
    params.append(key, value);
  });

  return params.toString();
}

/**
 * Format filter value for query string
 */
function formatFilterValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

/**
 * Create filter condition
 */
export function createFilterCondition(
  field: string,
  operator: FilterOperator,
  value: unknown
): FilterCondition {
  return { field, operator, value };
}

/**
 * Combine filter conditions with AND logic
 */
export function combineFiltersAnd(...conditions: FilterCondition[]): FilterCondition[] {
  return conditions;
}

/**
 * Combine filter conditions with OR logic (placeholder for complex filtering)
 */
export function combineFiltersOr(...conditionGroups: FilterCondition[][]): FilterCondition[] {
  // Placeholder - in a real implementation, this would create an OR structure
  return conditionGroups.flat();
}

/**
 * Validate filter options
 */
export function validateFilterOptions(options: FilterOptions): FilterOptions {
  const validated: FilterOptions = {};

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null && value !== '') {
      validated[key] = value;
    }
  }

  return validated;
}

/**
 * Extract allowed filters from query
 */
export function extractAllowedFilters(
  query: Record<string, string>,
  allowedFields: string[]
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  }

  return filters;
}

/**
 * Log filter application
 */
export function logFiltering(conditions: FilterCondition[], duration: number): void {
  logger.info('Filters applied', {
    conditionCount: conditions.length,
    duration,
  });
}
