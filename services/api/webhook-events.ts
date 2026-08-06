import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { WebhookEvent, WebhookEventType } from './api-types';

// ============================================================================
// Webhook Events
// Webhook event management and triggering
// ============================================================================

/**
 * Webhook Event Storage
 */
interface WebhookEventStorage {
  events: Map<string, WebhookEvent>;
}

/**
 * Webhook event registry
 */
const webhookEventRegistry: WebhookEventStorage = {
  events: new Map(),
};

/**
 * Create webhook event
 */
export async function createWebhookEvent(
  clinicId: string,
  webhookId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>
): Promise<WebhookEvent> {
  const eventId = crypto.randomUUID();
  const now = new Date();

  const event: WebhookEvent = {
    id: eventId,
    clinicId,
    webhookId,
    eventType,
    payload,
    timestamp: now.toISOString(),
    processed: false,
  };

  webhookEventRegistry.events.set(eventId, event);
  cache.set(`webhook-event:${eventId}`, JSON.stringify(event), 86400000);

  logger.info('Webhook event created', { eventId, webhookId, eventType });
  return event;
}

/**
 * Get webhook event
 */
export async function getWebhookEvent(eventId: string): Promise<WebhookEvent | null> {
  const cached = cache.get<string>(`webhook-event:${eventId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const event = webhookEventRegistry.events.get(eventId);
  if (event) {
    cache.set(`webhook-event:${eventId}`, JSON.stringify(event), 86400000);
    return event;
  }

  return null;
}

/**
 * Get webhook events by webhook
 */
export async function getWebhookEventsByWebhook(
  webhookId: string
): Promise<WebhookEvent[]> {
  const events: WebhookEvent[] = [];

  for (const event of webhookEventRegistry.events.values()) {
    if (event.webhookId === webhookId) {
      events.push(event);
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get webhook events by clinic
 */
export async function getWebhookEventsByClinic(
  clinicId: string
): Promise<WebhookEvent[]> {
  const events: WebhookEvent[] = [];

  for (const event of webhookEventRegistry.events.values()) {
    if (event.clinicId === clinicId) {
      events.push(event);
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get webhook events by type
 */
export async function getWebhookEventsByType(
  clinicId: string,
  eventType: WebhookEventType
): Promise<WebhookEvent[]> {
  const events: WebhookEvent[] = [];

  for (const event of webhookEventRegistry.events.values()) {
    if (event.clinicId === clinicId && event.eventType === eventType) {
      events.push(event);
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Mark webhook event as processed
 */
export async function markWebhookEventProcessed(eventId: string): Promise<WebhookEvent | null> {
  const event = webhookEventRegistry.events.get(eventId);
  if (!event) {
    return null;
  }

  event.processed = true;

  webhookEventRegistry.events.set(eventId, event);
  cache.set(`webhook-event:${eventId}`, JSON.stringify(event), 86400000);

  logger.info('Webhook event marked as processed', { eventId });
  return event;
}

/**
 * Delete webhook event
 */
export async function deleteWebhookEvent(eventId: string): Promise<boolean> {
  const event = webhookEventRegistry.events.get(eventId);
  if (!event) {
    return false;
  }

  webhookEventRegistry.events.delete(eventId);
  cache.delete(`webhook-event:${eventId}`);

  logger.info('Webhook event deleted', { eventId });
  return true;
}

/**
 * Delete old webhook events
 */
export async function deleteOldWebhookEvents(daysToKeep: number = 30): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 86400000);
  let count = 0;

  for (const [eventId, event] of webhookEventRegistry.events.entries()) {
    if (new Date(event.timestamp) < cutoffDate) {
      webhookEventRegistry.events.delete(eventId);
      cache.delete(`webhook-event:${eventId}`);
      count++;
    }
  }

  logger.info('Old webhook events deleted', { count, daysToKeep });
  return count;
}

/**
 * Get webhook event statistics
 */
export async function getWebhookEventStats(clinicId: string): Promise<{
  total: number;
  processed: number;
  unprocessed: number;
  byType: Record<string, number>;
}> {
  const events = await getWebhookEventsByClinic(clinicId);
  const byType: Record<string, number> = {};

  for (const event of events) {
    byType[event.eventType] = (byType[event.eventType] || 0) + 1;
  }

  return {
    total: events.length,
    processed: events.filter((e) => e.processed).length,
    unprocessed: events.filter((e) => !e.processed).length,
    byType,
  };
}

/**
 * Retry unprocessed webhook events
 */
export async function retryUnprocessedWebhookEvents(webhookId?: string): Promise<number> {
  let count = 0;

  for (const [eventId, event] of webhookEventRegistry.events.entries()) {
    if (!event.processed && (!webhookId || event.webhookId === webhookId)) {
      event.processed = false;

      webhookEventRegistry.events.set(eventId, event);
      cache.set(`webhook-event:${eventId}`, JSON.stringify(event), 86400000);
      count++;
    }
  }

  logger.info('Unprocessed webhook events retried', { count, webhookId });
  return count;
}

/**
 * Get unprocessed webhook events
 */
export async function getUnprocessedWebhookEvents(clinicId?: string): Promise<WebhookEvent[]> {
  const events: WebhookEvent[] = [];

  for (const event of webhookEventRegistry.events.values()) {
    if (!event.processed && (!clinicId || event.clinicId === clinicId)) {
      events.push(event);
    }
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Trigger webhook event
 */
export async function triggerWebhookEvent(
  clinicId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>
): Promise<WebhookEvent[]> {
  // Import webhooks module dynamically to avoid circular dependency
  const { getWebhooksByEvent } = await import('./webhooks');
  
  const webhooks = await getWebhooksByEvent(clinicId, eventType);
  const events: WebhookEvent[] = [];

  for (const webhook of webhooks) {
    const event = await createWebhookEvent(clinicId, webhook.id, eventType, payload);
    events.push(event);
  }

  logger.info('Webhook events triggered', { eventType, count: events.length });
  return events;
}
