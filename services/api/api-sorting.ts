import { logger } from '../shared/logger';

// ============================================================================
// API Sorting
// Query sorting and data sorting utilities
// ============================================================================

/**
 * Sort Direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort Option
 */
export interface SortOption {
  field: string;
  direction: SortDirection;
}

/**
 * Parse sort options from query
 */
export function parseSortOptions(query: Record<string, string>): SortOption[] {
  const sorts: SortOption[] = [];

  if (query.sortBy) {
    const fields = query.sortBy.split(',');
    const directions = (query.sortOrder || 'asc').split(',');

    fields.forEach((field, index) => {
      const direction = directions[index]?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      sorts.push({ field, direction });
    });
  }

  return sorts;
}

/**
 * Validate sort field against allowed fields
 */
export function validateSortFields(
  sorts: SortOption[],
  allowedFields: string[]
): SortOption[] {
  return sorts.filter((sort) => allowedFields.includes(sort.field));
}

/**
 * Apply sorting to array data
 */
export function applySorting<T extends Record<string, unknown>>(
  data: T[],
  sorts: SortOption[]
): T[] {
  if (sorts.length === 0) {
    return data;
  }

  return [...data].sort((a, b) => {
    for (const sort of sorts) {
      const comparison = compareValues(a[sort.field], b[sort.field], sort.direction);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });
}

/**
 * Compare two values for sorting
 */
function compareValues(
  a: unknown,
  b: unknown,
  direction: SortDirection
): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return direction === 'asc' ? -1 : 1;
  if (b === null || b === undefined) return direction === 'asc' ? 1 : -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    const comparison = a.localeCompare(b);
    return direction === 'asc' ? comparison : -comparison;
  }

  if (a instanceof Date && b instanceof Date) {
    const comparison = a.getTime() - b.getTime();
    return direction === 'asc' ? comparison : -comparison;
  }

  // Fallback to string comparison
  const aStr = String(a);
  const bStr = String(b);
  const comparison = aStr.localeCompare(bStr);
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Build sort query string
 */
export function buildSortQuery(sorts: SortOption[]): string {
  if (sorts.length === 0) {
    return '';
  }

  const fields = sorts.map((s) => s.field).join(',');
  const directions = sorts.map((s) => s.direction).join(',');

  const params = new URLSearchParams();
  params.append('sortBy', fields);
  params.append('sortOrder', directions);

  return params.toString();
}

/**
 * Create sort option
 */
export function createSortOption(field: string, direction: SortDirection = 'asc'): SortOption {
  return { field, direction };
}

/**
 * Reverse sort direction
 */
export function reverseDirection(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc';
}

/**
 * Get default sort options
 */
export function getDefaultSortOptions(defaultField: string, defaultDirection: SortDirection = 'asc'): SortOption[] {
  return [{ field: defaultField, direction: defaultDirection }];
}

/**
 * Merge sort options with defaults
 */
export function mergeSortOptions(
  requested: SortOption[],
  defaults: SortOption[]
): SortOption[] {
  return requested.length > 0 ? requested : defaults;
}

/**
 * Validate sort direction
 */
export function validateSortDirection(direction: string): SortDirection {
  return direction === 'desc' ? 'desc' : 'asc';
}

/**
 * Extract sort fields from options
 */
export function extractSortFields(sorts: SortOption[]): string[] {
  return sorts.map((s) => s.field);
}

/**
 * Extract sort directions from options
 */
export function extractSortDirections(sorts: SortOption[]): SortDirection[] {
  return sorts.map((s) => s.direction);
}

/**
 * Check if sorting is requested
 */
export function hasSorting(query: Record<string, string>): boolean {
  return !!query.sortBy;
}

/**
 * Log sorting application
 */
export function logSorting(sorts: SortOption[], duration: number): void {
  logger.info('Sorting applied', {
    sortCount: sorts.length,
    sorts: sorts.map((s) => `${s.field}:${s.direction}`).join(','),
    duration,
  });
}
