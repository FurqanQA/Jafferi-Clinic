import { logger } from '../shared/logger';
import { PaginationOptions } from './api-types';

// ============================================================================
// API Pagination
// Pagination utilities and helpers
// ============================================================================

/**
 * Pagination Result
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Parse pagination options from request
 */
export function parsePaginationOptions(
  query: Record<string, string>,
  defaults: {
    page?: number;
    pageSize?: number;
  } = {}
): PaginationOptions {
  const page = parseInt(query.page || String(defaults.page || 1), 10);
  const pageSize = parseInt(query.pageSize || String(defaults.pageSize || 20), 10);
  const sortBy = query.sortBy;
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: isNaN(pageSize) || pageSize < 1 || pageSize > 100 ? 20 : pageSize,
    sortBy,
    sortOrder,
  };
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(options: PaginationOptions): PaginationOptions {
  return {
    page: Math.max(1, options.page || 1),
    pageSize: Math.min(100, Math.max(1, options.pageSize || 20)),
    sortBy: options.sortBy,
    sortOrder: options.sortOrder || 'asc',
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  const totalPages = Math.ceil(total / pageSize);
  const adjustedPage = Math.min(page, totalPages || 1);

  return {
    page: adjustedPage,
    pageSize,
    total,
    totalPages,
    hasNext: adjustedPage < totalPages,
    hasPrevious: adjustedPage > 1,
  };
}

/**
 * Paginate array data
 */
export function paginateArray<T>(
  data: T[],
  page: number,
  pageSize: number
): PaginationResult<T> {
  const total = data.length;
  const pagination = calculatePagination(total, page, pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination,
  };
}

/**
 * Get offset for pagination
 */
export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Get limit for pagination
 */
export function getLimit(pageSize: number): number {
  return Math.min(100, Math.max(1, pageSize));
}

/**
 * Build pagination query parameters
 */
export function buildPaginationQuery(options: PaginationOptions): Record<string, string> {
  const query: Record<string, string> = {
    page: String(options.page),
    pageSize: String(options.pageSize),
  };

  if (options.sortBy) {
    query.sortBy = options.sortBy;
  }

  if (options.sortOrder) {
    query.sortOrder = options.sortOrder;
  }

  return query;
}

/**
 * Get next page URL
 */
export function getNextPageUrl(
  baseUrl: string,
  options: PaginationOptions,
  total: number
): string | null {
  const totalPages = Math.ceil(total / (options.pageSize || 20));
  if ((options.page || 1) >= totalPages) {
    return null;
  }

  const query = buildPaginationQuery({ ...options, page: (options.page || 1) + 1 });
  const queryString = new URLSearchParams(query).toString();
  return `${baseUrl}?${queryString}`;
}

/**
 * Get previous page URL
 */
export function getPreviousPageUrl(
  baseUrl: string,
  options: PaginationOptions
): string | null {
  if ((options.page || 1) <= 1) {
    return null;
  }

  const query = buildPaginationQuery({ ...options, page: (options.page || 1) - 1 });
  const queryString = new URLSearchParams(query).toString();
  return `${baseUrl}?${queryString}`;
}

/**
 * Get first page URL
 */
export function getFirstPageUrl(baseUrl: string, options: PaginationOptions): string {
  const query = buildPaginationQuery({ ...options, page: 1 });
  const queryString = new URLSearchParams(query).toString();
  return `${baseUrl}?${queryString}`;
}

/**
 * Get last page URL
 */
export function getLastPageUrl(
  baseUrl: string,
  options: PaginationOptions,
  total: number
): string {
  const totalPages = Math.ceil(total / (options.pageSize || 20));
  const query = buildPaginationQuery({ ...options, page: totalPages });
  const queryString = new URLSearchParams(query).toString();
  return `${baseUrl}?${queryString}`;
}

/**
 * Get pagination links
 */
export function getPaginationLinks(
  baseUrl: string,
  options: PaginationOptions,
  total: number
): {
  first: string;
  last: string;
  next: string | null;
  previous: string | null;
} {
  return {
    first: getFirstPageUrl(baseUrl, options),
    last: getLastPageUrl(baseUrl, options, total),
    next: getNextPageUrl(baseUrl, options, total),
    previous: getPreviousPageUrl(baseUrl, options),
  };
}

/**
 * Apply cursor-based pagination
 */
export function applyCursorPagination<T>(
  data: T[],
  cursor: string | null,
  limit: number,
  getCursor: (item: T) => string
): {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
} {
  let startIndex = 0;

  if (cursor) {
    startIndex = data.findIndex((item) => getCursor(item) === cursor);
    if (startIndex !== -1) {
      startIndex += 1;
    }
  }

  const paginatedData = data.slice(startIndex, startIndex + limit);
  const nextCursor = paginatedData.length > 0 ? getCursor(paginatedData[paginatedData.length - 1]) : null;
  const hasMore = startIndex + limit < data.length;

  return {
    data: paginatedData,
    nextCursor,
    hasMore,
  };
}

/**
 * Log pagination info
 */
export function logPagination(
  page: number,
  pageSize: number,
  total: number,
  duration: number
): void {
  logger.info('Pagination applied', {
    page,
    pageSize,
    total,
    duration,
  });
}
