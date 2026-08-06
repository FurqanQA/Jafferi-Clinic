import { logger } from '../shared/logger';
import { ApiError } from './api-types';

// ============================================================================
// API Errors
// Centralized error handling and error types
// ============================================================================

/**
 * API Error Class
 */
export class ApiGatewayError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiGatewayError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      field: this.details?.field as string | undefined,
      details: this.details,
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ApiGatewayError {
  field?: string;

  constructor(message: string, field?: string) {
    super('VALIDATION_ERROR', message, 400, { field });
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ApiGatewayError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends ApiGatewayError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiGatewayError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends ApiGatewayError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends ApiGatewayError {
  retryAfter: number;

  constructor(retryAfter: number) {
    super('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Service Unavailable Error
 */
export class ServiceUnavailableError extends ApiGatewayError {
  constructor(message: string = 'Service temporarily unavailable') {
    super('SERVICE_UNAVAILABLE', message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Bad Request Error
 */
export class BadRequestError extends ApiGatewayError {
  constructor(message: string) {
    super('BAD_REQUEST', message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * Internal Server Error
 */
export class InternalServerError extends ApiGatewayError {
  constructor(message: string = 'Internal server error') {
    super('INTERNAL_ERROR', message, 500);
    this.name = 'InternalServerError';
  }
}

/**
 * Unprocessable Entity Error
 */
export class UnprocessableEntityError extends ApiGatewayError {
  constructor(message: string) {
    super('UNPROCESSABLE_ENTITY', message, 422);
    this.name = 'UnprocessableEntityError';
  }
}

/**
 * Handle error and convert to API error
 */
export function handleError(error: unknown): ApiGatewayError {
  if (error instanceof ApiGatewayError) {
    return error;
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', { error: error.message, stack: error.stack });
    return new InternalServerError(error.message);
  }

  logger.error('Unknown error', { error });
  return new InternalServerError('An unknown error occurred');
}

/**
 * Log error
 */
export function logError(error: ApiGatewayError, context?: Record<string, unknown>): void {
  logger.error('API error occurred', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    ...context,
  });
}

/**
 * Create error from HTTP status code
 */
export function errorFromStatusCode(statusCode: number, message?: string): ApiGatewayError {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message || 'Bad request');
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError('Resource');
    case 409:
      return new ConflictError(message || 'Resource conflict');
    case 422:
      return new UnprocessableEntityError(message || 'Unprocessable entity');
    case 429:
      return new RateLimitError(60);
    case 500:
      return new InternalServerError(message);
    case 503:
      return new ServiceUnavailableError(message);
    default:
      return new InternalServerError(message || 'An error occurred');
  }
}

/**
 * Get HTTP status code from error
 */
export function getStatusCodeFromError(error: ApiGatewayError): number {
  return error.statusCode;
}

/**
 * Format error for response
 */
export function formatErrorForResponse(error: ApiGatewayError): {
  code: string;
  message: string;
  details?: Record<string, unknown>;
} {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
  };
}

/**
 * Aggregate multiple errors
 */
export function aggregateErrors(errors: Array<ApiError | ApiGatewayError>): ApiError[] {
  return errors.map((error) => {
    if (error instanceof ApiGatewayError) {
      return error.toJSON();
    }
    return error;
  });
}

/**
 * Create validation error from Zod error
 */
export function createZodValidationError(zodError: any): ValidationError {
  const field = zodError.errors?.[0]?.path?.join('.');
  const message = zodError.errors?.[0]?.message || 'Validation failed';
  return new ValidationError(message, field);
}
