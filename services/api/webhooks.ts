import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { Webhook, WebhookEventType } from './api-types';

// ============================================================================
// Webhooks
// Webhook configuration and management
// ============================================================================

/**
 * Webhook Storage
 */
interface WebhookStorage {
  webhooks: Map<string, Webhook>;
}

/**
 * Webhook registry
 */
const webhookRegistry: WebhookStorage = {
  webhooks: new Map(),
};

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create webhook
 */
export async function createWebhook(
  clinicId: string,
  name: string,
  url: string,
  events: WebhookEventType[],
  createdBy: string,
  secret?: string
): Promise<Webhook> {
  const webhookId = crypto.randomUUID();
  const now = new Date();

  const webhook: Webhook = {
    id: webhookId,
    clinicId,
    name,
    url,
    events,
    secret: secret || generateWebhookSecret(),
    isActive: true,
    headers: {
      'Content-Type': 'application/json',
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 5000,
      backoffMultiplier: 2,
    },
    timeout: 30000,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy,
  };

  webhookRegistry.webhooks.set(webhookId, webhook);
  cache.set(`webhook:${webhookId}`, JSON.stringify(webhook), 86400000);

  logger.info('Webhook created', { webhookId, clinicId, name, url });
  return webhook;
}

/**
 * Get webhook
 */
export async function getWebhook(webhookId: string): Promise<Webhook | null> {
  const cached = cache.get<string>(`webhook:${webhookId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (webhook) {
    cache.set(`webhook:${webhookId}`, JSON.stringify(webhook), 86400000);
    return webhook;
  }

  return null;
}

/**
 * Get webhooks by clinic
 */
export async function getWebhooksByClinic(clinicId: string): Promise<Webhook[]> {
  const webhooks: Webhook[] = [];

  for (const webhook of webhookRegistry.webhooks.values()) {
    if (webhook.clinicId === clinicId) {
      webhooks.push(webhook);
    }
  }

  return webhooks;
}

/**
 * Get webhooks by event
 */
export async function getWebhooksByEvent(
  clinicId: string,
  event: WebhookEventType
): Promise<Webhook[]> {
  const webhooks: Webhook[] = [];

  for (const webhook of webhookRegistry.webhooks.values()) {
    if (webhook.clinicId === clinicId && webhook.isActive && webhook.events.includes(event)) {
      webhooks.push(webhook);
    }
  }

  return webhooks;
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  updates: Partial<Omit<Webhook, 'id' | 'clinicId' | 'createdAt' | 'createdBy'>>
): Promise<Webhook | null> {
  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (!webhook) {
    return null;
  }

  const updated: Webhook = {
    ...webhook,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  webhookRegistry.webhooks.set(webhookId, updated);
  cache.set(`webhook:${webhookId}`, JSON.stringify(updated), 86400000);

  logger.info('Webhook updated', { webhookId });
  return updated;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string): Promise<boolean> {
  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (!webhook) {
    return false;
  }

  webhookRegistry.webhooks.delete(webhookId);
  cache.delete(`webhook:${webhookId}`);

  logger.info('Webhook deleted', { webhookId });
  return true;
}

/**
 * Activate webhook
 */
export async function activateWebhook(webhookId: string): Promise<boolean> {
  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (!webhook) {
    return false;
  }

  webhook.isActive = true;
  webhook.updatedAt = new Date().toISOString();

  webhookRegistry.webhooks.set(webhookId, webhook);
  cache.set(`webhook:${webhookId}`, JSON.stringify(webhook), 86400000);

  logger.info('Webhook activated', { webhookId });
  return true;
}

/**
 * Deactivate webhook
 */
export async function deactivateWebhook(webhookId: string): Promise<boolean> {
  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (!webhook) {
    return false;
  }

  webhook.isActive = false;
  webhook.updatedAt = new Date().toISOString();

  webhookRegistry.webhooks.set(webhookId, webhook);
  cache.set(`webhook:${webhookId}`, JSON.stringify(webhook), 86400000);

  logger.info('Webhook deactivated', { webhookId });
  return true;
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(webhookId: string): Promise<string | null> {
  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (!webhook) {
    return null;
  }

  const newSecret = generateWebhookSecret();
  webhook.secret = newSecret;
  webhook.updatedAt = new Date().toISOString();

  webhookRegistry.webhooks.set(webhookId, webhook);
  cache.set(`webhook:${webhookId}`, JSON.stringify(webhook), 86400000);

  logger.info('Webhook secret rotated', { webhookId });
  return newSecret;
}

/**
 * Test webhook
 */
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode?: number;
  error?: string;
}> {
  const webhook = webhookRegistry.webhooks.get(webhookId);
  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  try {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
    };

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: webhook.headers,
      body: JSON.stringify(testPayload),
    });

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(clinicId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  byEvent: Record<string, number>;
}> {
  const webhooks = await getWebhooksByClinic(clinicId);
  const byEvent: Record<string, number> = {};

  for (const webhook of webhooks) {
    for (const event of webhook.events) {
      byEvent[event] = (byEvent[event] || 0) + 1;
    }
  }

  return {
    total: webhooks.length,
    active: webhooks.filter((w) => w.isActive).length,
    inactive: webhooks.filter((w) => !w.isActive).length,
    byEvent,
  };
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveryHistory(
  webhookId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  eventType: string;
  status: 'success' | 'failed';
  timestamp: string;
  attempt: number;
}>> {
  // Placeholder for delivery history
  // In production, this would query a delivery history table
  return [];
}
