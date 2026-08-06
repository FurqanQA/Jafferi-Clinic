import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { WebhookDelivery, WebhookDeliveryStatus } from './api-types';

// ============================================================================
// Webhook Delivery
// Webhook delivery tracking and management
// ============================================================================

/**
 * Webhook Delivery Storage
 */
interface WebhookDeliveryStorage {
  deliveries: Map<string, WebhookDelivery>;
}

/**
 * Webhook delivery registry
 */
const webhookDeliveryRegistry: WebhookDeliveryStorage = {
  deliveries: new Map(),
};

/**
 * Create webhook delivery
 */
export async function createWebhookDelivery(
  clinicId: string,
  webhookId: string,
  eventId: string,
  url: string
): Promise<WebhookDelivery> {
  const deliveryId = crypto.randomUUID();
  const now = new Date();

  const delivery: WebhookDelivery = {
    id: deliveryId,
    clinicId,
    webhookId,
    eventId,
    url,
    status: WebhookDeliveryStatus.PENDING,
    attempt: 1,
    duration: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  webhookDeliveryRegistry.deliveries.set(deliveryId, delivery);
  cache.set(`webhook-delivery:${deliveryId}`, JSON.stringify(delivery), 86400000);

  logger.info('Webhook delivery created', { deliveryId, webhookId, eventId });
  return delivery;
}

/**
 * Get webhook delivery
 */
export async function getWebhookDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
  const cached = cache.get<string>(`webhook-delivery:${deliveryId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const delivery = webhookDeliveryRegistry.deliveries.get(deliveryId);
  if (delivery) {
    cache.set(`webhook-delivery:${deliveryId}`, JSON.stringify(delivery), 86400000);
    return delivery;
  }

  return null;
}

/**
 * Get webhook deliveries by webhook
 */
export async function getWebhookDeliveriesByWebhook(
  webhookId: string,
  status?: WebhookDeliveryStatus
): Promise<WebhookDelivery[]> {
  const deliveries: WebhookDelivery[] = [];

  for (const delivery of webhookDeliveryRegistry.deliveries.values()) {
    if (delivery.webhookId === webhookId) {
      if (!status || delivery.status === status) {
        deliveries.push(delivery);
      }
    }
  }

  return deliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get webhook deliveries by event
 */
export async function getWebhookDeliveriesByEvent(eventId: string): Promise<WebhookDelivery[]> {
  const deliveries: WebhookDelivery[] = [];

  for (const delivery of webhookDeliveryRegistry.deliveries.values()) {
    if (delivery.eventId === eventId) {
      deliveries.push(delivery);
    }
  }

  return deliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get webhook deliveries by clinic
 */
export async function getWebhookDeliveriesByClinic(
  clinicId: string,
  status?: WebhookDeliveryStatus
): Promise<WebhookDelivery[]> {
  const deliveries: WebhookDelivery[] = [];

  for (const delivery of webhookDeliveryRegistry.deliveries.values()) {
    if (delivery.clinicId === clinicId) {
      if (!status || delivery.status === status) {
        deliveries.push(delivery);
      }
    }
  }

  return deliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Update webhook delivery status
 */
export async function updateWebhookDeliveryStatus(
  deliveryId: string,
  status: WebhookDeliveryStatus,
  statusCode?: number
): Promise<WebhookDelivery | null> {
  const delivery = webhookDeliveryRegistry.deliveries.get(deliveryId);
  if (!delivery) {
    return null;
  }

  delivery.status = status;
  delivery.updatedAt = new Date().toISOString();
  
  if (statusCode !== undefined) {
    delivery.statusCode = statusCode;
  }
  if (status === WebhookDeliveryStatus.DELIVERED) {
    delivery.deliveredAt = new Date().toISOString();
  }
  if (status === WebhookDeliveryStatus.FAILED) {
    delivery.failedAt = new Date().toISOString();
  }

  webhookDeliveryRegistry.deliveries.set(deliveryId, delivery);
  cache.set(`webhook-delivery:${deliveryId}`, JSON.stringify(delivery), 86400000);

  logger.info('Webhook delivery status updated', { deliveryId, status });
  return delivery;
}

/**
 * Update webhook delivery with response
 */
export async function updateWebhookDeliveryResponse(
  deliveryId: string,
  statusCode: number,
  response: string,
  duration: number
): Promise<WebhookDelivery | null> {
  const delivery = webhookDeliveryRegistry.deliveries.get(deliveryId);
  if (!delivery) {
    return null;
  }

  delivery.statusCode = statusCode;
  delivery.response = response;
  delivery.duration = duration;
  delivery.updatedAt = new Date().toISOString();

  webhookDeliveryRegistry.deliveries.set(deliveryId, delivery);
  cache.set(`webhook-delivery:${deliveryId}`, JSON.stringify(delivery), 86400000);

  return delivery;
}

/**
 * Increment webhook delivery attempt
 */
export async function incrementWebhookDeliveryAttempt(deliveryId: string): Promise<WebhookDelivery | null> {
  const delivery = webhookDeliveryRegistry.deliveries.get(deliveryId);
  if (!delivery) {
    return null;
  }

  delivery.attempt += 1;
  delivery.updatedAt = new Date().toISOString();

  webhookDeliveryRegistry.deliveries.set(deliveryId, delivery);
  cache.set(`webhook-delivery:${deliveryId}`, JSON.stringify(delivery), 86400000);

  return delivery;
}

/**
 * Delete webhook delivery
 */
export async function deleteWebhookDelivery(deliveryId: string): Promise<boolean> {
  const delivery = webhookDeliveryRegistry.deliveries.get(deliveryId);
  if (!delivery) {
    return false;
  }

  webhookDeliveryRegistry.deliveries.delete(deliveryId);
  cache.delete(`webhook-delivery:${deliveryId}`);

  logger.info('Webhook delivery deleted', { deliveryId });
  return true;
}

/**
 * Delete old webhook deliveries
 */
export async function deleteOldWebhookDeliveries(daysToKeep: number = 30): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 86400000);
  let count = 0;

  for (const [deliveryId, delivery] of webhookDeliveryRegistry.deliveries.entries()) {
    if (new Date(delivery.createdAt) < cutoffDate) {
      webhookDeliveryRegistry.deliveries.delete(deliveryId);
      cache.delete(`webhook-delivery:${deliveryId}`);
      count++;
    }
  }

  logger.info('Old webhook deliveries deleted', { count, daysToKeep });
  return count;
}

/**
 * Get webhook delivery statistics
 */
export async function getWebhookDeliveryStats(clinicId: string): Promise<{
  total: number;
  pending: number;
  delivered: number;
  failed: number;
  averageDuration: number;
}> {
  const deliveries = await getWebhookDeliveriesByClinic(clinicId);
  
  const successfulDeliveries = deliveries.filter((d) => d.status === WebhookDeliveryStatus.DELIVERED && d.duration > 0);
  const averageDuration = successfulDeliveries.length > 0
    ? successfulDeliveries.reduce((sum, d) => sum + d.duration, 0) / successfulDeliveries.length
    : 0;

  return {
    total: deliveries.length,
    pending: deliveries.filter((d) => d.status === WebhookDeliveryStatus.PENDING).length,
    delivered: deliveries.filter((d) => d.status === WebhookDeliveryStatus.DELIVERED).length,
    failed: deliveries.filter((d) => d.status === WebhookDeliveryStatus.FAILED).length,
    averageDuration,
  };
}

/**
 * Get pending webhook deliveries
 */
export async function getPendingWebhookDeliveries(clinicId?: string): Promise<WebhookDelivery[]> {
  const deliveries: WebhookDelivery[] = [];

  for (const delivery of webhookDeliveryRegistry.deliveries.values()) {
    if (delivery.status === WebhookDeliveryStatus.PENDING && (!clinicId || delivery.clinicId === clinicId)) {
      deliveries.push(delivery);
    }
  }

  return deliveries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Get failed webhook deliveries
 */
export async function getFailedWebhookDeliveries(clinicId?: string): Promise<WebhookDelivery[]> {
  const deliveries: WebhookDelivery[] = [];

  for (const delivery of webhookDeliveryRegistry.deliveries.values()) {
    if (delivery.status === WebhookDeliveryStatus.FAILED && (!clinicId || delivery.clinicId === clinicId)) {
      deliveries.push(delivery);
    }
  }

  return deliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedWebhookDeliveries(webhookId?: string): Promise<number> {
  let count = 0;

  for (const [deliveryId, delivery] of webhookDeliveryRegistry.deliveries.entries()) {
    if (delivery.status === WebhookDeliveryStatus.FAILED && (!webhookId || delivery.webhookId === webhookId)) {
      delivery.status = WebhookDeliveryStatus.PENDING;
      delivery.attempt += 1;
      delivery.updatedAt = new Date().toISOString();
      delivery.failedAt = undefined;

      webhookDeliveryRegistry.deliveries.set(deliveryId, delivery);
      cache.set(`webhook-delivery:${deliveryId}`, JSON.stringify(delivery), 86400000);
      count++;
    }
  }

  logger.info('Failed webhook deliveries retried', { count, webhookId });
  return count;
}
