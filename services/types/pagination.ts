/**
 * Pagination types
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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
