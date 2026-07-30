/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Single sort field
 */
export interface SortField {
  field: string;
  direction: SortDirection;
}

/**
 * Sorting parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: SortDirection;
}

/**
 * Parse sort parameters into sort fields
 */
export function parseSortParams(params: SortParams): SortField[] {
  const fields: SortField[] = [];

  if (params.sortBy) {
    fields.push({
      field: params.sortBy,
      direction: params.sortOrder || 'asc',
    });
  }

  return fields;
}

/**
 * Apply sorting to a Supabase query
 * Note: This function assumes the query has an order method
 */
export function applySorting<T extends { order: (column: string, options?: { ascending?: boolean }) => T }>(
  query: T,
  sortFields: SortField[]
): T {
  let q = query;

  for (const sort of sortFields) {
    q = q.order(sort.field, {
      ascending: sort.direction === 'asc',
    });
  }

  return q;
}

/**
 * Default sort field for common use cases
 */
export const DEFAULT_SORT: SortField = {
  field: 'created_at',
  direction: 'desc',
};

/**
 * Get default sort parameters
 */
export function getDefaultSortParams(): SortParams {
  return {
    sortBy: DEFAULT_SORT.field,
    sortOrder: DEFAULT_SORT.direction,
  };
}
