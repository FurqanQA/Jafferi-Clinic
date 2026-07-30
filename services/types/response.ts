/**
 * Response types
 */
import { PaginationMetadata } from './pagination';

/**
 * Standard response structure
 */
export interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ResponseError;
  metadata?: ResponseMetadata;
}

/**
 * Response error
 */
export interface ResponseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMetadata;
}

/**
 * Success response
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: ResponseMetadata;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: ResponseError;
  metadata?: ResponseMetadata;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  metadata: ResponseMetadata & {
    pagination: PaginationMetadata;
  };
}
