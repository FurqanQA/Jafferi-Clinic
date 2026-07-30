import { AppError } from './errors';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: ResponseMetadata;
}

/**
 * Response metadata for pagination and additional info
 */
export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMetadata;
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
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  metadata?: ResponseMetadata
): ApiResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  error: AppError | Error,
  requestId?: string
): ApiResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMetadata,
  requestId?: string
): ApiResponse<T[]> {
  return successResponse(data, {
    timestamp: new Date().toISOString(),
    requestId,
    pagination,
  });
}
