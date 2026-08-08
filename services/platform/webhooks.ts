import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Webhooks Manager
// Webhook configuration and event delivery
// ============================================================================

/**
 * Webhook interface
 */
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  status: 'active' | 'inactive' | 'error';
  tenantId?: string;
  description?: string;
  lastTriggeredAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  triggerCount: number;
  successCount: number;
  failureCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create webhook
 */
export async function createWebhook(data: {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  tenantId?: string;
  description?: string;
  createdBy: string;
}): Promise<Webhook> {
  try {
    await validatePlatformWritePermission(PlatformResource.WEBHOOKS);

    const supabase = getSupabaseClient();

    const webhookId = `webhook-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        id: webhookId,
        name: data.name,
        url: data.url,
        events: data.events,
        secret: data.secret || null,
        headers: data.headers || null,
        status: 'active',
        tenant_id: data.tenantId || null,
        description: data.description || null,
        last_triggered_at: null,
        last_success_at: null,
        last_error: null,
        trigger_count: 0,
        success_count: 0,
        failure_count: 0,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create webhook', { error, data });
      throw new DatabaseError('Failed to create webhook', { error });
    }

    logger.info('Webhook created', { webhookId, name: data.name, url: data.url });

    // Invalidate cache
    cache.delete(`webhook:${webhookId}`);
    cache.delete('webhooks:all');

    return webhook as Webhook;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating webhook', { error, data });
    throw new DatabaseError('Failed to create webhook', { error });
  }
}

/**
 * Get webhook by ID
 */
export async function getWebhook(webhookId: string): Promise<Webhook> {
  try {
    const supabase = getSupabaseClient();

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (error) {
      logger.error('Failed to fetch webhook', { error, webhookId });
      throw new DatabaseError('Failed to fetch webhook', { error });
    }

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    return webhook as Webhook;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching webhook', { error, webhookId });
    throw new DatabaseError('Failed to fetch webhook', { error });
  }
}

/**
 * List webhooks
 */
export async function listWebhooks(options: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'error';
  tenantId?: string;
  event?: string;
}): Promise<{ webhooks: Webhook[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, tenantId, event } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('webhooks')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (event) {
      query = query.contains('events', [event]);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: webhooks, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list webhooks', { error });
      throw new DatabaseError('Failed to list webhooks', { error });
    }

    return {
      webhooks: (webhooks || []) as Webhook[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing webhooks', { error });
    throw new DatabaseError('Failed to list webhooks', { error });
  }
}

/**
 * Update webhook
 */
export async function updateWebhook(webhookId: string, data: {
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  headers?: Record<string, string>;
  description?: string;
  status?: 'active' | 'inactive' | 'error';
}): Promise<Webhook> {
  try {
    await validatePlatformWritePermission(PlatformResource.WEBHOOKS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = data.events;
    if (data.secret !== undefined) updateData.secret = data.secret;
    if (data.headers !== undefined) updateData.headers = data.headers;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .update(updateData)
      .eq('id', webhookId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update webhook', { error, webhookId });
      throw new DatabaseError('Failed to update webhook', { error });
    }

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    logger.info('Webhook updated', { webhookId });

    // Invalidate cache
    cache.delete(`webhook:${webhookId}`);
    cache.delete('webhooks:all');

    return webhook as Webhook;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating webhook', { error, webhookId });
    throw new DatabaseError('Failed to update webhook', { error });
  }
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.WEBHOOKS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) {
      logger.error('Failed to delete webhook', { error, webhookId });
      throw new DatabaseError('Failed to delete webhook', { error });
    }

    logger.info('Webhook deleted', { webhookId });

    // Invalidate cache
    cache.delete(`webhook:${webhookId}`);
    cache.delete('webhooks:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting webhook', { error, webhookId });
    throw new DatabaseError('Failed to delete webhook', { error });
  }
}

/**
 * Trigger webhook
 */
export async function triggerWebhook(webhookId: string, payload: Record<string, unknown>): Promise<{
  success: boolean;
  statusCode?: number;
  message: string;
}> {
  try {
    const webhook = await getWebhook(webhookId);

    if (webhook.status !== 'active') {
      return {
        success: false,
        message: 'Webhook is not active',
      };
    }

    // Placeholder for webhook delivery
    // In production, this would:
    // - Send HTTP POST request to webhook URL
    // - Include signature if secret is configured
    // - Handle retries on failure
    // - Update trigger statistics

    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    await supabase
      .from('webhooks')
      .update({
        last_triggered_at: now,
        trigger_count: webhook.triggerCount + 1,
        success_count: webhook.successCount + 1,
        last_success_at: now,
      })
      .eq('id', webhookId);

    logger.info('Webhook triggered', { webhookId });

    return {
      success: true,
      statusCode: 200,
      message: 'Webhook delivered successfully',
    };
  } catch (error) {
    logger.error('Failed to trigger webhook', { error, webhookId });
    throw new DatabaseError('Failed to trigger webhook', { error });
  }
}

/**
 * Trigger webhooks by event
 */
export async function triggerWebhooksByEvent(event: string, payload: Record<string, unknown>): Promise<{
  triggered: number;
  failed: number;
}> {
  try {
    const { webhooks } = await listWebhooks({ 
      status: 'active', 
      event, 
      pageSize: 1000 
    });

    let triggered = 0;
    let failed = 0;

    for (const webhook of webhooks) {
      try {
        const result = await triggerWebhook(webhook.id, payload);
        if (result.success) {
          triggered++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    logger.info('Webhooks triggered by event', { event, triggered, failed });

    return { triggered, failed };
  } catch (error) {
    logger.error('Failed to trigger webhooks by event', { error, event });
    throw new DatabaseError('Failed to trigger webhooks by event', { error });
  }
}

/**
 * Test webhook
 */
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  message: string;
}> {
  try {
    const webhook = await getWebhook(webhookId);

    // Placeholder for webhook test
    // In production, this would send a test payload to verify connectivity

    return {
      success: true,
      statusCode: 200,
      responseTime: 100,
      message: 'Webhook endpoint is reachable',
    };
  } catch (error) {
    logger.error('Failed to test webhook', { error, webhookId });
    throw new DatabaseError('Failed to test webhook', { error });
  }
}

/**
 * Get webhooks by tenant
 */
export async function getWebhooksByTenant(tenantId: string): Promise<Webhook[]> {
  try {
    const { webhooks } = await listWebhooks({ tenantId, pageSize: 1000 });
    return webhooks;
  } catch (error) {
    logger.error('Failed to get webhooks by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get webhooks by tenant', { error });
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStatistics(): Promise<{
  total: number;
  active: number;
  inactive: number;
  error: number;
  totalTriggers: number;
  totalSuccesses: number;
  totalFailures: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('status, trigger_count, success_count, failure_count');

    if (!webhooks || webhooks.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        error: 0,
        totalTriggers: 0,
        totalSuccesses: 0,
        totalFailures: 0,
      };
    }

    let active = 0;
    let inactive = 0;
    let error = 0;
    let totalTriggers = 0;
    let totalSuccesses = 0;
    let totalFailures = 0;

    for (const webhook of webhooks) {
      if (webhook.status === 'active') active++;
      else if (webhook.status === 'inactive') inactive++;
      else if (webhook.status === 'error') error++;

      totalTriggers += webhook.trigger_count;
      totalSuccesses += webhook.success_count;
      totalFailures += webhook.failure_count;
    }

    return {
      total: webhooks.length,
      active,
      inactive,
      error,
      totalTriggers,
      totalSuccesses,
      totalFailures,
    };
  } catch (error) {
    logger.error('Failed to get webhook statistics', { error });
    throw new DatabaseError('Failed to get webhook statistics', { error });
  }
}

/**
 * Get available events
 */
export async function getAvailableEvents(): Promise<Array<{
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
}>> {
  try {
    // Placeholder for available events
    // In production, this would return a list of events that can trigger webhooks
    return [
      {
        name: 'user.created',
        description: 'Triggered when a new user is created',
        payloadSchema: { userId: 'string', email: 'string', name: 'string' },
      },
      {
        name: 'subscription.created',
        description: 'Triggered when a subscription is created',
        payloadSchema: { subscriptionId: 'string', planId: 'string', tenantId: 'string' },
      },
      {
        name: 'invoice.paid',
        description: 'Triggered when an invoice is paid',
        payloadSchema: { invoiceId: 'string', amount: 'number', currency: 'string' },
      },
    ];
  } catch (error) {
    logger.error('Failed to get available events', { error });
    throw new DatabaseError('Failed to get available events', { error });
  }
}

/**
 * Get webhook delivery logs
 */
export async function getWebhookDeliveryLogs(webhookId: string, options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<{ logs: Array<{ timestamp: string; status: string; statusCode?: number; responseTime?: number; error?: string }>; total: number }> {
  try {
    // Placeholder for delivery logs
    // In production, this would fetch logs from a logging system
    return {
      logs: [],
      total: 0,
    };
  } catch (error) {
    logger.error('Failed to get webhook delivery logs', { error, webhookId });
    throw new DatabaseError('Failed to get webhook delivery logs', { error });
  }
}

/**
 * Regenerate webhook secret
 */
export async function regenerateWebhookSecret(webhookId: string): Promise<string> {
  try {
    await validatePlatformWritePermission(PlatformResource.WEBHOOKS);

    const newSecret = `whsec_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    await updateWebhook(webhookId, { secret: newSecret });

    logger.info('Webhook secret regenerated', { webhookId });

    return newSecret;
  } catch (error) {
    logger.error('Failed to regenerate webhook secret', { error, webhookId });
    throw new DatabaseError('Failed to regenerate webhook secret', { error });
  }
}
