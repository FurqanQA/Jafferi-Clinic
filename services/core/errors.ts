/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    // Error.captureStackTrace is Node.js specific, check if it exists
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Authentication error for failed auth operations
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * Database error for database operations
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
  }
}

/**
 * Conflict error for duplicate or conflicting resources
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, details);
  }
}

/**
 * Internal server error for unexpected errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, details);
  }
}

/**
 * Tenant error for multi-tenant operations
 */
export class TenantError extends AppError {
  constructor(message: string = 'Tenant operation failed', details?: Record<string, unknown>) {
    super(message, 'TENANT_ERROR', 400, details);
  }
}

/**
 * Rate limit error for API rate limiting
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * Upload error for file operations
 */
export class UploadError extends AppError {
  constructor(message: string = 'File upload failed', details?: Record<string, unknown>) {
    super(message, 'UPLOAD_ERROR', 400, details);
  }
}
