/**
 * API request/response types
 */
import { PaginationMetadata } from './pagination';

/**
 * Generic API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

/**
 * API error structure
 */
export interface ApiError {
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
 * API request with pagination
 */
export interface ApiRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T> {
  ids: string[];
  operation: 'delete' | 'update' | 'create';
  data?: Partial<T>;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean;
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
}
