import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { ApiRequestContext, ApiVersion, HttpMethod, ApiKey, ApiResponse } from './api-types';

// ============================================================================
// API Engine
// Central orchestration service for API Gateway operations
// ============================================================================

/**
 * API Request Handler Context
 */
export interface ApiHandlerContext {
  requestId: string;
  apiKey?: ApiKey;
  clinicId: string;
  userId?: string;
  version: ApiVersion;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * API Handler Result
 */
export interface ApiHandlerResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  statusCode: number;
  duration: number;
}

/**
 * Execute API request with full context
 */
export async function executeApiRequest<T = unknown>(
  handler: (context: ApiHandlerContext) => Promise<T>,
  context: Partial<ApiHandlerContext>
): Promise<ApiHandlerResult<T>> {
  const startTime = Date.now();
  const requestId = context.requestId || crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const user = await getCurrentUser();
    const clinicId = await getUserClinicId();

    const fullContext: ApiHandlerContext = {
      requestId,
      apiKey: context.apiKey,
      clinicId,
      userId: user.id,
      version: context.version || ApiVersion.V1,
      method: context.method || HttpMethod.GET,
      path: context.path || '/',
      headers: context.headers || {},
      query: context.query || {},
      body: context.body,
      timestamp,
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent || 'unknown',
    };

    logger.info('API request started', {
      requestId,
      method: fullContext.method,
      path: fullContext.path,
      clinicId,
      userId: fullContext.userId,
    });

    const data = await handler(fullContext);
    const duration = Date.now() - startTime;

    logger.info('API request completed', {
      requestId,
      duration,
      success: true,
    });

    return {
      success: true,
      data,
      statusCode: 200,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('API request failed', {
      requestId,
      duration,
      error: errorMessage,
    });

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: errorMessage,
      },
      statusCode: 500,
      duration,
    };
  }
}

/**
 * Create API request context
 */
export function createApiRequestContext(
  method: HttpMethod,
  path: string,
  headers: Record<string, string>,
  query: Record<string, string>,
  body?: unknown,
  ipAddress?: string,
  userAgent?: string
): Partial<ApiHandlerContext> {
  return {
    requestId: crypto.randomUUID(),
    method,
    path,
    headers,
    query,
    body,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate API request context
 */
export function validateApiContext(context: ApiHandlerContext): boolean {
  if (!context.requestId) {
    return false;
  }
  if (!context.clinicId) {
    return false;
  }
  if (!context.method) {
    return false;
  }
  if (!context.path) {
    return false;
  }
  return true;
}

/**
 * Get API statistics
 */
export async function getApiStatistics(clinicId?: string): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
}> {
  // Placeholder for statistics calculation
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
  };
}

/**
 * Get API health status
 */
export async function getApiHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
  }>;
}> {
  // Placeholder for health checks
  return {
    status: 'healthy',
    checks: [
      {
        name: 'database',
        status: 'pass',
      },
      {
        name: 'cache',
        status: 'pass',
      },
      {
        name: 'queue',
        status: 'pass',
      },
    ],
  };
}

/**
 * Execute batch API requests
 */
export async function executeBatchRequests<T = unknown>(
  requests: Array<{
    method: HttpMethod;
    path: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
  }>,
  handler: (context: ApiHandlerContext) => Promise<T>
): Promise<Array<ApiHandlerResult<T>>> {
  const results: Array<ApiHandlerResult<T>> = [];

  for (const request of requests) {
    const context = createApiRequestContext(
      request.method,
      request.path,
      request.headers || {},
      request.query || {},
      request.body
    );
    const result = await executeApiRequest(handler, context);
    results.push(result);
  }

  return results;
}

/**
 * Get API version compatibility
 */
export function getApiVersionCompatibility(version: ApiVersion): {
  supported: boolean;
  deprecated: boolean;
  sunsetDate?: string;
  recommendedVersion: ApiVersion;
} {
  const compatibilityMap: Record<ApiVersion, {
    supported: boolean;
    deprecated: boolean;
    sunsetDate?: string;
  }> = {
    [ApiVersion.V1]: { supported: true, deprecated: false },
    [ApiVersion.V2]: { supported: true, deprecated: false },
    [ApiVersion.V3]: { supported: false, deprecated: false },
  };

  const info = compatibilityMap[version] || { supported: false, deprecated: false };

  return {
    ...info,
    recommendedVersion: ApiVersion.V2,
  };
}
