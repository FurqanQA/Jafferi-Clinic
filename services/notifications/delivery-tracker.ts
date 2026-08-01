import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { NotificationDelivery, DeliveryStatus, NotificationChannel } from './notification-types';

// ============================================================================
// Delivery Tracker
// Tracks notification delivery status across all channels
// ============================================================================

/**
 * Track delivery event
 */
export async function trackDelivery(
  notificationId: string,
  channel: NotificationChannel,
  status: DeliveryStatus,
  recipient: string,
  metadata?: Record<string, any>
): Promise<NotificationDelivery> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();

    const deliveryData: any = {
      notification_id: notificationId,
      channel,
      status,
      recipient,
      created_at: now,
      updated_at: now,
    };

    // Set timestamp based on status
    switch (status) {
      case 'sent':
        deliveryData.sent_at = now;
        break;
      case 'delivered':
        deliveryData.delivered_at = now;
        break;
      case 'opened':
        deliveryData.opened_at = now;
        break;
      case 'clicked':
        deliveryData.clicked_at = now;
        break;
      case 'read':
        deliveryData.read_at = now;
        break;
      case 'failed':
        deliveryData.failed_at = now;
        break;
    }

    if (metadata) {
      deliveryData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('notification_deliveries')
      .insert(deliveryData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to track delivery', { error, notificationId, channel, status });
      throw new DatabaseError('Failed to track delivery', { error });
    }

    logger.info('Delivery tracked successfully', { notificationId, channel, status });
    return data as NotificationDelivery;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error tracking delivery', { error, notificationId, channel, status });
    throw new DatabaseError('Failed to track delivery', { error });
  }
}

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  metadata?: Record<string, any>
): Promise<NotificationDelivery> {
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();

    const updateData: any = {
      status,
      updated_at: now,
    };

    // Set timestamp based on status
    switch (status) {
      case 'sent':
        updateData.sent_at = now;
        break;
      case 'delivered':
        updateData.delivered_at = now;
        break;
      case 'opened':
        updateData.opened_at = now;
        break;
      case 'clicked':
        updateData.clicked_at = now;
        break;
      case 'read':
        updateData.read_at = now;
        break;
      case 'failed':
        updateData.failed_at = now;
        break;
      case 'bounce':
        updateData.failed_at = now;
        break;
      case 'spam':
        updateData.failed_at = now;
        break;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('notification_deliveries')
      .update(updateData)
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update delivery status', { error, deliveryId, status });
      throw new DatabaseError('Failed to update delivery status', { error });
    }

    logger.info('Delivery status updated successfully', { deliveryId, status });
    return data as NotificationDelivery;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating delivery status', { error, deliveryId, status });
    throw new DatabaseError('Failed to update delivery status', { error });
  }
}

/**
 * Get delivery by ID
 */
export async function getDelivery(deliveryId: string): Promise<NotificationDelivery | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (error) {
      return null;
    }

    return data as NotificationDelivery;
  } catch (error) {
    logger.error('Unexpected error fetching delivery', { error, deliveryId });
    return null;
  }
}

/**
 * Get deliveries by notification ID
 */
export async function getDeliveriesByNotification(notificationId: string): Promise<NotificationDelivery[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch deliveries by notification', { error, notificationId });
      throw new DatabaseError('Failed to fetch deliveries by notification', { error });
    }

    return (data || []) as NotificationDelivery[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching deliveries by notification', { error, notificationId });
    throw new DatabaseError('Failed to fetch deliveries by notification', { error });
  }
}

/**
 * Get deliveries by channel
 */
export async function getDeliveriesByChannel(channel: NotificationChannel, limit: number = 100): Promise<NotificationDelivery[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch deliveries by channel', { error, channel });
      throw new DatabaseError('Failed to fetch deliveries by channel', { error });
    }

    return (data || []) as NotificationDelivery[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching deliveries by channel', { error, channel });
    throw new DatabaseError('Failed to fetch deliveries by channel', { error });
  }
}

/**
 * Get deliveries by status
 */
export async function getDeliveriesByStatus(status: DeliveryStatus, limit: number = 100): Promise<NotificationDelivery[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch deliveries by status', { error, status });
      throw new DatabaseError('Failed to fetch deliveries by status', { error });
    }

    return (data || []) as NotificationDelivery[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching deliveries by status', { error, status });
    throw new DatabaseError('Failed to fetch deliveries by status', { error });
  }
}

/**
 * Get delivery statistics
 */
export async function getDeliveryStatistics(notificationId?: string): Promise<{
  total: number;
  byStatus: Record<DeliveryStatus, number>;
  byChannel: Record<NotificationChannel, number>;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase.from('notification_deliveries').select('*');

    if (notificationId) {
      query = query.eq('notification_id', notificationId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch delivery statistics', { error });
      throw new DatabaseError('Failed to fetch delivery statistics', { error });
    }

    const byStatus: Record<DeliveryStatus, number> = {
      queued: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      read: 0,
      failed: 0,
      bounce: 0,
      spam: 0,
    };

    const byChannel: Record<NotificationChannel, number> = {
      in_app: 0,
      email: 0,
      sms: 0,
      whatsapp: 0,
      push: 0,
      browser: 0,
      webhook: 0,
      slack: 0,
      teams: 0,
      discord: 0,
    };

    let total = 0;
    let delivered = 0;
    let opened = 0;
    let clicked = 0;

    (data || []).forEach((delivery: NotificationDelivery) => {
      total++;
      byStatus[delivery.status] = (byStatus[delivery.status] || 0) + 1;
      byChannel[delivery.channel] = (byChannel[delivery.channel] || 0) + 1;

      if (delivery.status === 'delivered' || delivery.status === 'opened' || delivery.status === 'clicked' || delivery.status === 'read') {
        delivered++;
      }
      if (delivery.status === 'opened' || delivery.status === 'clicked' || delivery.status === 'read') {
        opened++;
      }
      if (delivery.status === 'clicked') {
        clicked++;
      }
    });

    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    return {
      total,
      byStatus,
      byChannel,
      deliveryRate,
      openRate,
      clickRate,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching delivery statistics', { error });
    throw new DatabaseError('Failed to fetch delivery statistics', { error });
  }
}

/**
 * Track email open (via tracking pixel)
 */
export async function trackEmailOpen(deliveryId: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'opened');
    logger.info('Email open tracked', { deliveryId });
  } catch (error) {
    logger.error('Failed to track email open', { error, deliveryId });
  }
}

/**
 * Track email click (via tracking link)
 */
export async function trackEmailClick(deliveryId: string, url: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'clicked', { clicked_url: url });
    logger.info('Email click tracked', { deliveryId, url });
  } catch (error) {
    logger.error('Failed to track email click', { error, deliveryId });
  }
}

/**
 * Track SMS delivery
 */
export async function trackSMSDelivery(deliveryId: string, providerMessageId: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'delivered', { provider_message_id: providerMessageId });
    logger.info('SMS delivery tracked', { deliveryId, providerMessageId });
  } catch (error) {
    logger.error('Failed to track SMS delivery', { error, deliveryId });
  }
}

/**
 * Track push notification open
 */
export async function trackPushOpen(deliveryId: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'opened');
    logger.info('Push notification open tracked', { deliveryId });
  } catch (error) {
    logger.error('Failed to track push notification open', { error, deliveryId });
  }
}

/**
 * Mark delivery as failed
 */
export async function markDeliveryAsFailed(deliveryId: string, failureReason: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'failed', { failure_reason: failureReason });
    logger.info('Delivery marked as failed', { deliveryId, failureReason });
  } catch (error) {
    logger.error('Failed to mark delivery as failed', { error, deliveryId });
  }
}

/**
 * Mark delivery as bounced
 */
export async function markDeliveryAsBounced(deliveryId: string, bounceReason: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'bounce', { bounce_reason: bounceReason });
    logger.info('Delivery marked as bounced', { deliveryId, bounceReason });
  } catch (error) {
    logger.error('Failed to mark delivery as bounced', { error, deliveryId });
  }
}

/**
 * Mark delivery as spam
 */
export async function markDeliveryAsSpam(deliveryId: string): Promise<void> {
  try {
    await updateDeliveryStatus(deliveryId, 'spam');
    logger.info('Delivery marked as spam', { deliveryId });
  } catch (error) {
    logger.error('Failed to mark delivery as spam', { error, deliveryId });
  }
}

/**
 * Get failed deliveries for retry
 */
export async function getFailedDeliveries(olderThanMinutes: number = 5): Promise<NotificationDelivery[]> {
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('status', 'failed')
      .lte('failed_at', cutoffDate)
      .order('failed_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch failed deliveries', { error });
      throw new DatabaseError('Failed to fetch failed deliveries', { error });
    }

    return (data || []) as NotificationDelivery[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching failed deliveries', { error });
    throw new DatabaseError('Failed to fetch failed deliveries', { error });
  }
}

/**
 * Get delivery timeline for notification
 */
export async function getDeliveryTimeline(notificationId: string): Promise<Array<{
  status: DeliveryStatus;
  timestamp: string;
  channel: NotificationChannel;
}>> {
  const deliveries = await getDeliveriesByNotification(notificationId);

  const timeline: Array<{
    status: DeliveryStatus;
    timestamp: string;
    channel: NotificationChannel;
  }> = [];

  deliveries.forEach(delivery => {
    if (delivery.sent_at) {
      timeline.push({ status: 'sent', timestamp: delivery.sent_at, channel: delivery.channel });
    }
    if (delivery.delivered_at) {
      timeline.push({ status: 'delivered', timestamp: delivery.delivered_at, channel: delivery.channel });
    }
    if (delivery.opened_at) {
      timeline.push({ status: 'opened', timestamp: delivery.opened_at, channel: delivery.channel });
    }
    if (delivery.clicked_at) {
      timeline.push({ status: 'clicked', timestamp: delivery.clicked_at, channel: delivery.channel });
    }
    if (delivery.read_at) {
      timeline.push({ status: 'read', timestamp: delivery.read_at, channel: delivery.channel });
    }
    if (delivery.failed_at) {
      timeline.push({ status: delivery.status === 'bounce' ? 'bounce' : delivery.status === 'spam' ? 'spam' : 'failed', timestamp: delivery.failed_at, channel: delivery.channel });
    }
  });

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return timeline;
}
