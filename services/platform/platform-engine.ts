import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { AppError } from '../core/errors';
import { Environment } from './platform-types';

// ============================================================================
// Platform Engine
// Core platform lifecycle, configuration, and service registry
// ============================================================================

/**
 * Platform error class
 */
export class PlatformError extends AppError {
  constructor(message: string = 'Platform operation failed', details?: Record<string, unknown>) {
    super(message, 'PLATFORM_ERROR', 500, details);
  }
}

/**
 * Platform configuration
 */
interface PlatformConfig {
  environment: Environment;
  version: string;
  apiUrl: string;
  databaseUrl: string;
  redisUrl: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

/**
 * Service registration
 */
interface ServiceRegistration {
  name: string;
  version: string;
  instance: unknown;
  dependencies: string[];
  status: 'registered' | 'active' | 'inactive' | 'error';
  registeredAt: string;
}

/**
 * Module registration
 */
interface ModuleRegistration {
  key: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  settings: Record<string, unknown>;
  status: 'loaded' | 'active' | 'inactive' | 'error';
  loadedAt: string;
}

/**
 * Platform engine state
 */
interface PlatformState {
  initialized: boolean;
  startTime: string;
  config: PlatformConfig | null;
  services: Map<string, ServiceRegistration>;
  modules: Map<string, ModuleRegistration>;
}

// ============================================================================
// Platform Engine Class
// ============================================================================

class PlatformEngine {
  private state: PlatformState = {
    initialized: false,
    startTime: new Date().toISOString(),
    config: null,
    services: new Map(),
    modules: new Map(),
  };

  private configCacheKey = 'platform:config';
  private servicesCacheKey = 'platform:services';
  private modulesCacheKey = 'platform:modules';

  /**
   * Initialize the platform engine
   */
  async initialize(config: PlatformConfig): Promise<void> {
    try {
      logger.info('Initializing platform engine', { environment: config.environment });

      this.state.config = config;
      this.state.initialized = true;

      // Cache configuration
      cache.set(this.configCacheKey, config, cacheHelpers.ttl.LONG);

      logger.info('Platform engine initialized', {
        version: config.version,
        environment: config.environment,
      });
    } catch (error) {
      logger.error('Failed to initialize platform engine', { error });
      throw new PlatformError('Platform initialization failed', { error });
    }
  }

  /**
   * Get platform configuration
   */
  getConfig(): PlatformConfig | null {
    if (!this.state.config) {
      // Try to load from cache
      const cached = cache.get<PlatformConfig>(this.configCacheKey);
      if (cached) {
        this.state.config = cached;
        return cached;
      }
    }
    return this.state.config;
  }

  /**
   * Check if platform is initialized
   */
  isInitialized(): boolean {
    return this.state.initialized;
  }

  /**
   * Get platform uptime
   */
  getUptime(): number {
    return Date.now() - new Date(this.state.startTime).getTime();
  }

  /**
   * Register a service
   */
  registerService(
    name: string,
    version: string,
    instance: unknown,
    dependencies: string[] = []
  ): void {
    try {
      // Check dependencies
      for (const dep of dependencies) {
        if (!this.state.services.has(dep)) {
          throw new PlatformError(`Dependency not found: ${dep}`);
        }
      }

      const registration: ServiceRegistration = {
        name,
        version,
        instance,
        dependencies,
        status: 'registered',
        registeredAt: new Date().toISOString(),
      };

      this.state.services.set(name, registration);

      logger.info('Service registered', { name, version, dependencies });
    } catch (error) {
      logger.error('Failed to register service', { name, error });
      throw new PlatformError(`Service registration failed: ${name}`, { error });
    }
  }

  /**
   * Get a registered service
   */
  getService<T = unknown>(name: string): T | null {
    const registration = this.state.services.get(name);
    return registration ? (registration.instance as T) : null;
  }

  /**
   * Check if service is registered
   */
  hasService(name: string): boolean {
    return this.state.services.has(name);
  }

  /**
   * Unregister a service
   */
  unregisterService(name: string): void {
    const registration = this.state.services.get(name);
    if (!registration) {
      throw new PlatformError(`Service not found: ${name}`);
    }

    // Check if other services depend on this one
    for (const [serviceName, service] of this.state.services.entries()) {
      if (service.dependencies.includes(name) && service.status === 'active') {
        throw new PlatformError(`Cannot unregister service ${name}: ${serviceName} depends on it`);
      }
    }

    this.state.services.delete(name);
    logger.info('Service unregistered', { name });
  }

  /**
   * Activate a service
   */
  activateService(name: string): void {
    const registration = this.state.services.get(name);
    if (!registration) {
      throw new PlatformError(`Service not found: ${name}`);
    }

    registration.status = 'active';
    logger.info('Service activated', { name });
  }

  /**
   * Deactivate a service
   */
  deactivateService(name: string): void {
    const registration = this.state.services.get(name);
    if (!registration) {
      throw new PlatformError(`Service not found: ${name}`);
    }

    // Check if other services depend on this one
    for (const [serviceName, service] of this.state.services.entries()) {
      if (service.dependencies.includes(name) && service.status === 'active') {
        throw new PlatformError(`Cannot deactivate service ${name}: ${serviceName} depends on it`);
      }
    }

    registration.status = 'inactive';
    logger.info('Service deactivated', { name });
  }

  /**
   * List all registered services
   */
  listServices(): ServiceRegistration[] {
    return Array.from(this.state.services.values());
  }

  /**
   * Register a module
   */
  registerModule(
    key: string,
    version: string,
    settings: Record<string, unknown> = {},
    dependencies: string[] = []
  ): void {
    try {
      // Check dependencies
      for (const dep of dependencies) {
        if (!this.state.modules.has(dep)) {
          throw new PlatformError(`Module dependency not found: ${dep}`);
        }
      }

      const registration: ModuleRegistration = {
        key,
        version,
        enabled: false,
        dependencies,
        settings,
        status: 'loaded',
        loadedAt: new Date().toISOString(),
      };

      this.state.modules.set(key, registration);

      logger.info('Module registered', { key, version, dependencies });
    } catch (error) {
      logger.error('Failed to register module', { key, error });
      throw new PlatformError(`Module registration failed: ${key}`, { error });
    }
  }

  /**
   * Enable a module
   */
  enableModule(key: string): void {
    const registration = this.state.modules.get(key);
    if (!registration) {
      throw new PlatformError(`Module not found: ${key}`);
    }

    // Enable dependencies first
    for (const dep of registration.dependencies) {
      const depModule = this.state.modules.get(dep);
      if (depModule && !depModule.enabled) {
        this.enableModule(dep);
      }
    }

    registration.enabled = true;
    registration.status = 'active';

    logger.info('Module enabled', { key });
  }

  /**
   * Disable a module
   */
  disableModule(key: string): void {
    const registration = this.state.modules.get(key);
    if (!registration) {
      throw new PlatformError(`Module not found: ${key}`);
    }

    // Check if other modules depend on this one
    for (const [moduleKey, module] of this.state.modules.entries()) {
      if (module.dependencies.includes(key) && module.enabled) {
        throw new PlatformError(`Cannot disable module ${key}: ${moduleKey} depends on it`);
      }
    }

    registration.enabled = false;
    registration.status = 'inactive';

    logger.info('Module disabled', { key });
  }

  /**
   * Get a registered module
   */
  getModule(key: string): ModuleRegistration | null {
    return this.state.modules.get(key) || null;
  }

  /**
   * Check if module is registered
   */
  hasModule(key: string): boolean {
    return this.state.modules.has(key);
  }

  /**
   * Check if module is enabled
   */
  isModuleEnabled(key: string): boolean {
    const registration = this.state.modules.get(key);
    return registration ? registration.enabled : false;
  }

  /**
   * List all registered modules
   */
  listModules(): ModuleRegistration[] {
    return Array.from(this.state.modules.values());
  }

  /**
   * Get platform health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    services: number;
    activeServices: number;
    modules: number;
    activeModules: number;
  } {
    const services = this.listServices();
    const modules = this.listModules();
    const activeServices = services.filter(s => s.status === 'active').length;
    const activeModules = modules.filter(m => m.enabled).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (activeServices < services.length * 0.5) {
      status = 'unhealthy';
    } else if (activeServices < services.length * 0.8) {
      status = 'degraded';
    }

    return {
      status,
      uptime: this.getUptime(),
      services: services.length,
      activeServices,
      modules: modules.length,
      activeModules,
    };
  }

  /**
   * Shutdown the platform engine
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down platform engine');

    // Deactivate all services
    for (const [name] of this.state.services.entries()) {
      try {
        this.deactivateService(name);
      } catch (error) {
        logger.warn('Failed to deactivate service during shutdown', { name, error });
      }
    }

    // Disable all modules
    for (const [key] of this.state.modules.entries()) {
      try {
        this.disableModule(key);
      } catch (error) {
        logger.warn('Failed to disable module during shutdown', { key, error });
      }
    }

    // Clear cache
    cache.delete(this.configCacheKey);
    cache.delete(this.servicesCacheKey);
    cache.delete(this.modulesCacheKey);

    this.state.initialized = false;

    logger.info('Platform engine shutdown complete');
  }

  /**
   * Get platform statistics
   */
  getStatistics(): {
    uptime: number;
    startTime: string;
    services: {
      total: number;
      active: number;
      inactive: number;
      error: number;
    };
    modules: {
      total: number;
      enabled: number;
      disabled: number;
      error: number;
    };
  } {
    const services = this.listServices();
    const modules = this.listModules();

    return {
      uptime: this.getUptime(),
      startTime: this.state.startTime,
      services: {
        total: services.length,
        active: services.filter(s => s.status === 'active').length,
        inactive: services.filter(s => s.status === 'inactive').length,
        error: services.filter(s => s.status === 'error').length,
      },
      modules: {
        total: modules.length,
        enabled: modules.filter(m => m.enabled).length,
        disabled: modules.filter(m => !m.enabled).length,
        error: modules.filter(m => m.status === 'error').length,
      },
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const platformEngine = new PlatformEngine();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Initialize platform with default configuration
 */
export async function initializePlatform(config: Partial<PlatformConfig> = {}): Promise<void> {
  const defaultConfig: PlatformConfig = {
    environment: config.environment || (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT,
    version: config.version || '1.0.0',
    apiUrl: config.apiUrl || process.env.API_URL || '',
    databaseUrl: config.databaseUrl || process.env.DATABASE_URL || '',
    redisUrl: config.redisUrl || process.env.REDIS_URL || null,
    features: config.features || {},
    limits: config.limits || {},
  };

  await platformEngine.initialize(defaultConfig);
}

/**
 * Get platform configuration
 */
export function getPlatformConfig(): PlatformConfig | null {
  return platformEngine.getConfig();
}

/**
 * Check if platform is ready
 */
export function isPlatformReady(): boolean {
  return platformEngine.isInitialized();
}
