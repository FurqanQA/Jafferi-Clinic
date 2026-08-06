import { logger } from '../shared/logger';
import { ApiResponse, ApiResponseStatus, ApiVersion, ApiError } from './api-types';

// ============================================================================
// API Response
// Standardized response formatting
// ============================================================================

/**
 * Response Configuration
 */
export interface ResponseConfig {
  version: ApiVersion;
  requestId: string;
  includeTimestamp: boolean;
  includeMeta: boolean;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  config: ResponseConfig,
  message?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    status: ApiResponseStatus.SUCCESS,
    code: 'SUCCESS',
    message: message || 'Request completed successfully',
    data,
  };

  if (config.includeMeta) {
    response.meta = {
      requestId: config.requestId,
      timestamp: new Date().toISOString(),
      version: config.version,
    };
  }

  return response;
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  config: ResponseConfig,
  errors?: ApiError[]
): ApiResponse {
  const response: ApiResponse = {
    status: ApiResponseStatus.ERROR,
    code,
    message,
    errors,
  };

  if (config.includeMeta) {
    response.meta = {
      requestId: config.requestId,
      timestamp: new Date().toISOString(),
      version: config.version,
    };
  }

  return response;
}

/**
 * Create a partial success response
 */
export function createPartialResponse<T = unknown>(
  data: T,
  message: string,
  config: ResponseConfig,
  errors?: ApiError[]
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    status: ApiResponseStatus.PARTIAL,
    code: 'PARTIAL_SUCCESS',
    message,
    data,
    errors,
  };

  if (config.includeMeta) {
    response.meta = {
      requestId: config.requestId,
      timestamp: new Date().toISOString(),
      version: config.version,
    };
  }

  return response;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T = unknown>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  config: ResponseConfig,
  message?: string
): ApiResponse<T[]> {
  const response: ApiResponse<T[]> = {
    status: ApiResponseStatus.SUCCESS,
    code: 'SUCCESS',
    message: message || 'Request completed successfully',
    data,
  };

  if (config.includeMeta) {
    response.meta = {
      requestId: config.requestId,
      timestamp: new Date().toISOString(),
      version: config.version,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  return response;
}

/**
 * Add pagination metadata to response
 */
export function addPaginationMeta(
  response: ApiResponse,
  page: number,
  pageSize: number,
  total: number
): ApiResponse {
  if (!response.meta) {
    response.meta = {
      requestId: '',
      timestamp: new Date().toISOString(),
      version: ApiVersion.V1,
    };
  }

  response.meta!.pagination = {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };

  return response;
}

/**
 * Add custom metadata to response
 */
export function addCustomMeta(
  response: ApiResponse,
  meta: Record<string, unknown>
): ApiResponse {
  if (!response.meta) {
    response.meta = {
      requestId: '',
      timestamp: new Date().toISOString(),
      version: ApiVersion.V1,
    };
  }

  Object.assign(response.meta!, meta);

  return response;
}

/**
 * Add error to response
 */
export function addError(
  response: ApiResponse,
  error: ApiError
): ApiResponse {
  if (!response.errors) {
    response.errors = [];
  }

  response.errors.push(error);

  if (response.status === ApiResponseStatus.SUCCESS) {
    response.status = ApiResponseStatus.PARTIAL;
    response.code = 'PARTIALsuccess';
  }

  return response;
}

/**
 * Format response for HTTP
 */
export function formatResponseForHttp(response: ApiResponse): {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
} {
  const statusCode = getStatusCodeForStatus(response.status);

  return {
    statusCode,
    body: JSON.stringify(response),
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.meta?.requestId || '',
      'X-API-Version': response.meta?.version || '',
    },
  };
}

/**
 * Get HTTP status code for API status
 */
export function getStatusCodeForStatus(status: ApiResponseStatus): number {
  switch (status) {
    case ApiResponseStatus.SUCCESS:
      return 200;
    case ApiResponseStatus.PARTIAL:
      return 207;
    case ApiResponseStatus.ERROR:
      return 400;
    default:
      return 500;
  }
}

/**
 * Create standard error codes
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
};

/**
 * Create error from exception
 */
export function createErrorFromException(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message,
      details: {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }

  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'An unknown error occurred',
  };
}

/**
 * Create validation error
 */
export function createValidationError(field: string, message: string): ApiError {
  return {
    code: ErrorCodes.VALIDATION_ERROR,
    message,
    field,
  };
}

/**
 * Create not found error
 */
export function createNotFoundError(resource: string): ApiError {
  return {
    code: ErrorCodes.NOT_FOUND,
    message: `${resource} not found`,
  };
}

/**
 * Create unauthorized error
 */
export function createUnauthorizedError(): ApiError {
  return {
    code: ErrorCodes.UNAUTHORIZED,
    message: 'Authentication required',
  };
}

/**
 * Create forbidden error
 */
export function createForbiddenError(): ApiError {
  return {
    code: ErrorCodes.FORBIDDEN,
    message: 'Access denied',
  };
}

/**
 * Create rate limit error
 */
export function createRateLimitError(retryAfter: number): ApiError {
  return {
    code: ErrorCodes.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded',
    details: { retryAfter },
  };
}

/**
 * Log response
 */
export function logResponse(response: ApiResponse, duration: number): void {
  logger.info('API response sent', {
    status: response.status,
    code: response.code,
    duration,
    requestId: response.meta?.requestId,
  });
}
