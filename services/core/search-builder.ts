/**
 * Search query builder utilities
 */

/**
 * Search field configuration
 */
export interface SearchField {
  name: string;
  operator?: 'ilike' | 'eq' | 'gte' | 'lte';
}

/**
 * Build text search query for multiple fields
 * @param query - Supabase query builder
 * @param searchTerm - Search term
 * @param fields - Array of field names to search
 * @returns Modified query
 */
export function buildTextSearch(
  query: any,
  searchTerm: string,
  fields: string[]
): any {
  if (!searchTerm || fields.length === 0) {
    return query;
  }

  const searchPattern = `%${searchTerm}%`;
  const orConditions = fields.map(field => `${field}.ilike.${searchPattern}`).join(',');

  return query.or(orConditions);
}

/**
 * Apply filters to query
 */
export function applyQueryFilters(query: any, filters: Record<string, unknown>): any {
  let modifiedQuery = query;

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value === 'string' && value.includes('%')) {
      modifiedQuery = modifiedQuery.ilike(key, value);
    } else if (key.endsWith('_min')) {
      const fieldName = key.replace('_min', '');
      modifiedQuery = modifiedQuery.gte(fieldName, value);
    } else if (key.endsWith('_max')) {
      const fieldName = key.replace('_max', '');
      modifiedQuery = modifiedQuery.lte(fieldName, value);
    } else if (key.endsWith('_from')) {
      const fieldName = key.replace('_from', '');
      modifiedQuery = modifiedQuery.gte(fieldName, value);
    } else if (key.endsWith('_to')) {
      const fieldName = key.replace('_to', '');
      modifiedQuery = modifiedQuery.lte(fieldName, value);
    } else {
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  }

  return modifiedQuery;
}
