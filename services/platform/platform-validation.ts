import { z } from 'zod';
import { validateData, commonSchemas } from '../core/validation';
import { ValidationError } from '../core/errors';
import {
  TenantStatus,
  SubscriptionStatus,
  BillingCycle,
  JobStatus,
  JobPriority,
  HealthStatus,
  Environment,
} from './platform-types';

// ============================================================================
// Platform Validation Schemas
// Zod schemas for platform-specific validation
// ============================================================================

/**
 * Tenant validation schemas
 */
export const tenantSchemas = {
  create: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    slug: z.string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/),
    ownerId: commonSchemas.uuid,
    planId: commonSchemas.uuid.optional(),
    settings: z.object({
      timezone: z.string().default('UTC'),
      locale: z.string().default('en'),
      currency: z.string().length(3).default('USD'),
      customDomain: z.string().url().nullable().optional(),
      branding: z.object({
        logo: z.string().url().nullable().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format').optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        customCSS: z.string().nullable().optional(),
      }).optional(),
      features: z.record(z.string(), z.boolean()).optional(),
    }).optional(),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/).optional(),
    status: z.nativeEnum(TenantStatus).optional(),
    ownerId: commonSchemas.uuid.optional(),
    planId: commonSchemas.uuid.nullable().optional(),
    settings: z.object({
      timezone: z.string().optional(),
      locale: z.string().optional(),
      currency: z.string().length(3).optional(),
      customDomain: z.string().url().nullable().optional(),
      branding: z.object({
        logo: z.string().url().nullable().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format').optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        customCSS: z.string().nullable().optional(),
      }).optional(),
      features: z.record(z.string(), z.boolean()).optional(),
    }).optional(),
  }),

  suspend: z.object({
    reason: z.string().min(5).max(500),
    effectiveAt: z.string().datetime().optional(),
  }),

  restore: z.object({
    restorePlanId: commonSchemas.uuid.optional(),
  }),
};

/**
 * Subscription validation schemas
 */
export const subscriptionSchemas = {
  create: z.object({
    tenantId: commonSchemas.uuid,
    planId: commonSchemas.uuid,
    billingCycle: z.nativeEnum(BillingCycle),
    trialDays: z.number().int().nonnegative().optional(),
  }),

  update: z.object({
    planId: commonSchemas.uuid.optional(),
    billingCycle: z.nativeEnum(BillingCycle).optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
  }),

  cancel: z.object({
    effectiveImmediately: z.boolean().default(false),
    reason: z.string().min(5).max(500).optional(),
  }),
};

/**
 * Plan validation schemas
 */
export const planSchemas = {
  create: z.object({
    name: z.string().min(2).max(100),
    slug: z.string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
    description: z.string().min(10).max(500),
    price: z.number().positive(),
    currency: z.string().length(3),
    billingCycle: z.nativeEnum(BillingCycle),
    trialDays: z.number().int().nonnegative().default(0),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      included: z.boolean(),
      limit: z.number().nullable(),
    })),
    limits: z.object({
      users: z.number().int().positive(),
      patients: z.number().int().positive(),
      appointments: z.number().int().positive(),
      storage: z.number().int().positive(),
      apiCalls: z.number().int().positive(),
      aiTokens: z.number().int().positive(),
    }),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().min(10).max(500).optional(),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    billingCycle: z.nativeEnum(BillingCycle).optional(),
    trialDays: z.number().int().nonnegative().optional(),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      included: z.boolean(),
      limit: z.number().nullable(),
    })).optional(),
    limits: z.object({
      users: z.number().int().positive().optional(),
      patients: z.number().int().positive().optional(),
      appointments: z.number().int().positive().optional(),
      storage: z.number().int().positive().optional(),
      apiCalls: z.number().int().positive().optional(),
      aiTokens: z.number().int().positive().optional(),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
};

/**
 * Coupon validation schemas
 */
export const couponSchemas = {
  create: z.object({
    code: z.string()
      .min(3)
      .max(50)
      .regex(/^[A-Z0-9-_]+$/, 'Invalid coupon code format'),
    description: z.string().min(5).max(500),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    maxUses: z.number().int().positive().nullable().optional(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime().nullable().optional(),
    applicablePlans: z.array(commonSchemas.uuid).optional(),
  }),

  update: z.object({
    description: z.string().min(5).max(500).optional(),
    discountValue: z.number().positive().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    validUntil: z.string().datetime().nullable().optional(),
    applicablePlans: z.array(commonSchemas.uuid).optional(),
    isActive: z.boolean().optional(),
  }),
};

/**
 * Feature flag validation schemas
 */
export const featureFlagSchemas = {
  create: z.object({
    key: z.string()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9_.-]+$/, 'Invalid feature flag key format'),
    name: z.string().min(2).max(100),
    description: z.string().min(5).max(500).optional(),
    enabled: z.boolean().default(false),
    valueType: z.enum(['boolean', 'string', 'number', 'json']),
    value: z.string(),
    rolloutPercentage: z.number().min(0).max(100).default(0),
    conditions: z.array(z.object({
      type: z.enum(['tenant', 'user', 'subscription', 'environment']),
      operator: z.enum(['equals', 'not_equals', 'contains', 'in', 'not_in']),
      value: z.string(),
    })).optional(),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(5).max(500).optional(),
    enabled: z.boolean().optional(),
    value: z.string().optional(),
    rolloutPercentage: z.number().min(0).max(100).optional(),
    conditions: z.array(z.object({
      type: z.enum(['tenant', 'user', 'subscription', 'environment']),
      operator: z.enum(['equals', 'not_equals', 'contains', 'in', 'not_in']),
      value: z.string(),
    })).optional(),
  }),
};

/**
 * Module validation schemas
 */
export const moduleSchemas = {
  create: z.object({
    key: z.string()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'Invalid module key format'),
    name: z.string().min(2).max(100),
    description: z.string().min(5).max(500),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
    enabled: z.boolean().default(false),
    dependencies: z.array(z.string()).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(5).max(500).optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format').optional(),
    enabled: z.boolean().optional(),
    dependencies: z.array(z.string()).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
};

/**
 * Background job validation schemas
 */
export const jobSchemas = {
  create: z.object({
    type: z.string().min(2).max(100),
    priority: z.nativeEnum(JobPriority).default(JobPriority.NORMAL),
    payload: z.record(z.string(), z.unknown()),
    scheduledAt: z.string().datetime().optional(),
    delay: z.number().int().nonnegative().optional().default(0),
    maxAttempts: z.number().int().positive().optional().default(3),
  }),

  retry: z.object({
    maxAttempts: z.number().int().positive().optional(),
    initialDelay: z.number().int().positive().optional(),
    maxDelay: z.number().int().positive().optional(),
    backoffMultiplier: z.number().positive().optional(),
  }),
};

/**
 * Health check validation schemas
 */
export const healthSchemas = {
  check: z.object({
    name: z.string().min(2).max(100),
    timeout: z.number().int().positive().optional().default(5000),
  }),
};

/**
 * Cache validation schemas
 */
export const cacheSchemas = {
  set: z.object({
    key: z.string().min(1).max(250),
    ttl: z.number().int().positive().optional(),
  }),

  invalidate: z.object({
    pattern: z.string().optional(),
    keys: z.array(z.string()).optional(),
  }),
};

/**
 * Backup validation schemas
 */
export const backupSchemas = {
  create: z.object({
    name: z.string().min(2).max(100),
    type: z.enum(['manual', 'automatic']),
    expiresAt: z.string().datetime().nullable().optional(),
  }),

  restore: z.object({
    backupId: commonSchemas.uuid,
    pointInTime: z.string().datetime().optional(),
  }),
};

/**
 * Maintenance validation schemas
 */
export const maintenanceSchemas = {
  schedule: z.object({
    scheduledStart: z.string().datetime(),
    scheduledEnd: z.string().datetime(),
    message: z.string().min(5).max(500).optional(),
    allowedIps: z.array(z.string()).optional(),
    allowedUsers: z.array(commonSchemas.uuid).optional(),
  }),
};

/**
 * Environment validation schemas
 */
export const environmentSchemas = {
  config: z.object({
    name: z.nativeEnum(Environment),
    apiUrl: z.string().url(),
    databaseUrl: z.string().url(),
    redisUrl: z.string().url().nullable().optional(),
    features: z.record(z.string(), z.boolean()).optional(),
    limits: z.record(z.string(), z.number()).optional(),
  }),
};

/**
 * Secret validation schemas
 */
export const secretSchemas = {
  create: z.object({
    key: z.string()
      .min(2)
      .max(100)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid secret key format'),
    value: z.string().min(1),
    description: z.string().min(5).max(500).optional(),
    environment: z.nativeEnum(Environment),
    expiresAt: z.string().datetime().nullable().optional(),
  }),

  update: z.object({
    value: z.string().min(1).optional(),
    description: z.string().min(5).max(500).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
};

/**
 * Integration validation schemas
 */
export const integrationSchemas = {
  create: z.object({
    type: z.string().min(2).max(50),
    name: z.string().min(2).max(100),
    configuration: z.record(z.string(), z.unknown()),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    configuration: z.record(z.string(), z.unknown()).optional(),
  }),
};

/**
 * Plugin validation schemas
 */
export const pluginSchemas = {
  install: z.object({
    pluginId: z.string().min(2).max(100),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),

  update: z.object({
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
};

/**
 * Webhook validation schemas
 */
export const webhookSchemas = {
  create: z.object({
    name: z.string().min(2).max(100),
    url: z.string().url(),
    events: z.array(z.string()).min(1),
    secret: z.string().min(16).max(100),
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    url: z.string().url().optional(),
    events: z.array(z.string()).min(1).optional(),
    secret: z.string().min(16).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
};

/**
 * Support ticket validation schemas
 */
export const supportSchemas = {
  create: z.object({
    subject: z.string().min(5).max(200),
    description: z.string().min(10).max(5000),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    category: z.string().min(2).max(50),
  }),

  update: z.object({
    subject: z.string().min(5).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    category: z.string().min(2).max(50).optional(),
    assignedTo: commonSchemas.uuid.nullable().optional(),
  }),
};

/**
 * Announcement validation schemas
 */
export const announcementSchemas = {
  create: z.object({
    title: z.string().min(5).max(200),
    content: z.string().min(10).max(5000),
    type: z.enum(['info', 'warning', 'maintenance', 'feature']),
    target: z.enum(['all', 'admins', 'specific']).default('all'),
    targetTenants: z.array(commonSchemas.uuid).optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),

  update: z.object({
    title: z.string().min(5).max(200).optional(),
    content: z.string().min(10).max(5000).optional(),
    type: z.enum(['info', 'warning', 'maintenance', 'feature']).optional(),
    target: z.enum(['all', 'admins', 'specific']).optional(),
    targetTenants: z.array(commonSchemas.uuid).optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
};

// ============================================================================
// Validation Functions
// Helper functions for common platform validation operations
// ============================================================================

/**
 * Validate tenant creation data
 */
export function validateTenantCreate(data: unknown) {
  return validateData(tenantSchemas.create, data);
}

/**
 * Validate tenant update data
 */
export function validateTenantUpdate(data: unknown) {
  return validateData(tenantSchemas.update, data);
}

/**
 * Validate subscription creation data
 */
export function validateSubscriptionCreate(data: unknown) {
  return validateData(subscriptionSchemas.create, data);
}

/**
 * Validate plan creation data
 */
export function validatePlanCreate(data: unknown) {
  return validateData(planSchemas.create, data);
}

/**
 * Validate feature flag creation data
 */
export function validateFeatureFlagCreate(data: unknown) {
  return validateData(featureFlagSchemas.create, data);
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string): string {
  return commonSchemas.url.parse(url);
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): string {
  const schema = z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format');
  return schema.parse(slug);
}

/**
 * Validate percentage value
 */
export function validatePercentage(value: number): number {
  const schema = z.number().min(0).max(100);
  return schema.parse(value);
}

/**
 * Validate version string (semver)
 */
export function validateVersion(version: string): string {
  const schema = z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format');
  return schema.parse(version);
}
