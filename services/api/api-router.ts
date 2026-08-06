import { logger } from '../shared/logger';
import { HttpMethod, ApiVersion } from './api-types';
import type { ApiHandlerContext } from './api-engine';

// ============================================================================
// API Router
// Route management and middleware orchestration
// ============================================================================

/**
 * Route Handler
 */
export type RouteHandler<T = unknown> = (context: ApiHandlerContext) => Promise<T>;

/**
 * Route Definition
 */
export interface Route {
  method: HttpMethod;
  path: string;
  version: ApiVersion;
  handler: RouteHandler;
  middleware?: Array<(context: ApiHandlerContext) => Promise<void>>;
  authRequired: boolean;
  scopes?: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Router Configuration
 */
export interface RouterConfig {
  version: ApiVersion;
  basePath: string;
  globalMiddleware?: Array<(context: ApiHandlerContext) => Promise<void>>;
}

/**
 * API Router
 */
export class ApiRouter {
  private routes: Map<string, Route> = new Map();
  private config: RouterConfig;

  constructor(config: RouterConfig) {
    this.config = config;
  }

  /**
   * Register a route
   */
  register(route: Route): void {
    const key = this.getRouteKey(route.method, route.path, route.version);
    this.routes.set(key, route);
    logger.info('Route registered', { method: route.method, path: route.path, version: route.version });
  }

  /**
   * Get a route
   */
  getRoute(method: HttpMethod, path: string, version: ApiVersion): Route | undefined {
    const key = this.getRouteKey(method, path, version);
    return this.routes.get(key);
  }

  /**
   * Get all routes
   */
  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get routes by version
   */
  getRoutesByVersion(version: ApiVersion): Route[] {
    return this.getAllRoutes().filter((route) => route.version === version);
  }

  /**
   * Get routes by method
   */
  getRoutesByMethod(method: HttpMethod): Route[] {
    return this.getAllRoutes().filter((route) => route.method === method);
  }

  /**
   * Remove a route
   */
  remove(method: HttpMethod, path: string, version: ApiVersion): boolean {
    const key = this.getRouteKey(method, path, version);
    return this.routes.delete(key);
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear();
  }

  /**
   * Generate route key
   */
  private getRouteKey(method: HttpMethod, path: string, version: ApiVersion): string {
    return `${version}:${method}:${path}`;
  }

  /**
   * Match route by path pattern
   */
  matchRoute(method: HttpMethod, path: string, version: ApiVersion): Route | undefined {
    const exactRoute = this.getRoute(method, path, version);
    if (exactRoute) {
      return exactRoute;
    }

    // Pattern matching for dynamic routes
    const routes = this.getRoutesByVersion(version).filter((route) => route.method === method);
    for (const route of routes) {
      if (this.matchPathPattern(route.path, path)) {
        return route;
      }
    }

    return undefined;
  }

  /**
   * Match path pattern
   */
  private matchPathPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        continue;
      }

      if (patternPart !== pathPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract path parameters
   */
  extractPathParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathParts[i];
      }
    }

    return params;
  }
}

/**
 * Create a new router instance
 */
export function createRouter(config: RouterConfig): ApiRouter {
  return new ApiRouter(config);
}

/**
 * Route builder helper
 */
export class RouteBuilder {
  private route: Partial<Route> = {
    authRequired: true,
    middleware: [],
  };

  method(method: HttpMethod): RouteBuilder {
    this.route.method = method;
    return this;
  }

  path(path: string): RouteBuilder {
    this.route.path = path;
    return this;
  }

  version(version: ApiVersion): RouteBuilder {
    this.route.version = version;
    return this;
  }

  handler(handler: RouteHandler): RouteBuilder {
    this.route.handler = handler;
    return this;
  }

  middleware(middleware: (context: ApiHandlerContext) => Promise<void>): RouteBuilder {
    if (!this.route.middleware) {
      this.route.middleware = [];
    }
    this.route.middleware.push(middleware);
    return this;
  }

  auth(authRequired: boolean): RouteBuilder {
    this.route.authRequired = authRequired;
    return this;
  }

  scopes(scopes: string[]): RouteBuilder {
    this.route.scopes = scopes;
    return this;
  }

  rateLimit(windowMs: number, maxRequests: number): RouteBuilder {
    this.route.rateLimit = { windowMs, maxRequests };
    return this;
  }

  build(): Route {
    if (!this.route.method || !this.route.path || !this.route.version || !this.route.handler) {
      throw new Error('Route must have method, path, version, and handler');
    }
    return this.route as Route;
  }
}

/**
 * Create a route builder
 */
export function createRouteBuilder(): RouteBuilder {
  return new RouteBuilder();
}
