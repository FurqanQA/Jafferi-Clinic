import { PaginationMetadata } from './response';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Calculated pagination values
 */
export interface PaginationValues {
  offset: number;
  limit: number;
  page: number;
  pageSize: number;
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Validate and calculate pagination values
 */
export function calculatePagination(params: PaginationParams): PaginationValues {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize || DEFAULT_PAGE_SIZE)
  );

  return {
    offset: (page - 1) * pageSize,
    limit: pageSize,
    page,
    pageSize,
  };
}

/**
 * Create pagination metadata from total count
 */
export function createPaginationMetadata(
  total: number,
  pagination: PaginationValues
): PaginationMetadata {
  const totalPages = Math.ceil(total / pagination.pageSize);

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrevious: pagination.page > 1,
  };
}

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination<T>(
  query: T,
  pagination: PaginationValues
): T {
  const { offset, limit } = pagination;
  
  // Type assertion for Supabase query methods
  const q = query as { range: (from: number, to: number) => T };
  return q.range(offset, offset + limit - 1);
}
