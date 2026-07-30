import { PaginationParams, calculatePagination } from '../core/pagination';
import { FilterParams, applyFilters } from '../core/filters';
import { SortParams, parseSortParams, applySorting } from '../core/sorting';

/**
 * Search parameters combining pagination, filtering, and sorting
 */
export interface SearchParams extends PaginationParams, FilterParams, SortParams {
  query?: string;
}

/**
 * Search result with pagination metadata
 */
export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Generic search function for Supabase queries
 */
export async function search<T>(
  queryBuilder: any,
  params: SearchParams
): Promise<SearchResult<T>> {
  // Apply pagination
  const pagination = calculatePagination(params);
  let query = queryBuilder.range(pagination.offset, pagination.offset + pagination.limit - 1);

  // Apply filters
  if (params.dateRanges || params.searches || params.statuses || params.booleans || params.numericRanges) {
    query = applyFilters(query, params);
  }

  // Apply sorting
  if (params.sortBy) {
    const sortFields = parseSortParams(params);
    query = applySorting(query, sortFields);
  }

  // Apply text search if provided
  if (params.query) {
    query = query.ilike('search_vector', `%${params.query}%`);
  }

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pagination.pageSize);

  return {
    data: data || [],
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrevious: pagination.page > 1,
  };
}

/**
 * Build search vector for full-text search
 */
export function buildSearchVector(...fields: (string | undefined | null)[]): string {
  return fields
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize search query
 */
export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  const terms = normalizeSearchQuery(query).split(' ');
  let highlighted = text;

  for (const term of terms) {
    if (term.length < 2) continue;
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }

  return highlighted;
}
