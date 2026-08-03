import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';

// ============================================================================
// Real-time Dashboard Updates
// Real-time data streaming and live updates for dashboards
// ============================================================================

/**
 * Real-time event types
 */
export enum RealtimeEventType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  PATIENT_REGISTERED = 'patient_registered',
  PAYMENT_RECEIVED = 'payment_received',
  LAB_RESULT_READY = 'lab_result_ready',
  NOTIFICATION_SENT = 'notification_sent',
  DOCTOR_STATUS_CHANGED = 'doctor_status_changed',
}

/**
 * Real-time event data
 */
export interface RealtimeEvent {
  type: RealtimeEventType;
  data: any;
  timestamp: string;
  clinicId: string;
  userId?: string;
}

/**
 * Real-time subscription
 */
export interface RealtimeSubscription {
  id: string;
  userId: string;
  clinicId: string;
  eventTypes: RealtimeEventType[];
  callback: (event: RealtimeEvent) => void;
  active: boolean;
}

// In-memory subscription storage (placeholder for Redis/WebSocket implementation)
const subscriptions: Map<string, RealtimeSubscription> = new Map();

/**
 * Subscribe to real-time events
 */
export function subscribeToRealtimeEvents(
  userId: string,
  clinicId: string,
  eventTypes: RealtimeEventType[],
  callback: (event: RealtimeEvent) => void
): string {
  const subscriptionId = `${userId}_${clinicId}_${Date.now()}`;

  const subscription: RealtimeSubscription = {
    id: subscriptionId,
    userId,
    clinicId,
    eventTypes,
    callback,
    active: true,
  };

  subscriptions.set(subscriptionId, subscription);
  logger.info('Real-time subscription created', { subscriptionId, userId, clinicId, eventTypes });

  return subscriptionId;
}

/**
 * Unsubscribe from real-time events
 */
export function unsubscribeFromRealtimeEvents(subscriptionId: string): boolean {
  const subscription = subscriptions.get(subscriptionId);

  if (!subscription) {
    return false;
  }

  subscription.active = false;
  subscriptions.delete(subscriptionId);
  logger.info('Real-time subscription removed', { subscriptionId });

  return true;
}

/**
 * Publish real-time event
 */
export function publishRealtimeEvent(event: RealtimeEvent): void {
  logger.info('Publishing real-time event', { type: event.type, clinicId: event.clinicId });

  for (const subscription of subscriptions.values()) {
    if (!subscription.active) {
      continue;
    }

    if (subscription.clinicId !== event.clinicId) {
      continue;
    }

    if (!subscription.eventTypes.includes(event.type)) {
      continue;
    }

    try {
      subscription.callback(event);
    } catch (error) {
      logger.error('Error in real-time subscription callback', { error, subscriptionId: subscription.id });
    }
  }
}

/**
 * Get active subscriptions
 */
export function getActiveSubscriptions(clinicId?: string): RealtimeSubscription[] {
  const activeSubscriptions = Array.from(subscriptions.values()).filter((s) => s.active);

  if (clinicId) {
    return activeSubscriptions.filter((s) => s.clinicId === clinicId);
  }

  return activeSubscriptions;
}

/**
 * Get real-time dashboard updates
 */
export async function getRealtimeDashboardUpdates(
  clinicId?: string,
  lastUpdate?: string
): Promise<{
  events: RealtimeEvent[];
  lastUpdate: string;
}> {
  const targetClinicId = clinicId || await getUserClinicId();

  // Placeholder for fetching real-time events from database or cache
  // In production, this would query a real-time event store or use WebSocket connections
  const events: RealtimeEvent[] = [];

  return {
    events,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Simulate real-time event (for testing)
 */
export function simulateRealtimeEvent(
  type: RealtimeEventType,
  clinicId: string,
  data: any
): void {
  const event: RealtimeEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
    clinicId,
  };

  publishRealtimeEvent(event);
}

/**
 * Get real-time metrics
 */
export async function getRealtimeMetrics(
  clinicId?: string
): Promise<{
  activeUsers: number;
  activeSubscriptions: number;
  eventsPerMinute: number;
  lastEventTimestamp: string;
}> {
  const targetClinicId = clinicId || await getUserClinicId();

  const activeSubscriptions = getActiveSubscriptions(targetClinicId);
  const uniqueUsers = new Set(activeSubscriptions.map((s) => s.userId));

  return {
    activeUsers: uniqueUsers.size,
    activeSubscriptions: activeSubscriptions.length,
    eventsPerMinute: 0, // Placeholder - would be calculated from event history
    lastEventTimestamp: new Date().toISOString(),
  };
}

/**
 * Clear all subscriptions for a user
 */
export function clearUserSubscriptions(userId: string): number {
  let count = 0;

  for (const [subscriptionId, subscription] of subscriptions.entries()) {
    if (subscription.userId === userId) {
      subscription.active = false;
      subscriptions.delete(subscriptionId);
      count++;
    }
  }

  logger.info('Cleared user subscriptions', { userId, count });
  return count;
}

/**
 * Clear all subscriptions for a clinic
 */
export function clearClinicSubscriptions(clinicId: string): number {
  let count = 0;

  for (const [subscriptionId, subscription] of subscriptions.entries()) {
    if (subscription.clinicId === clinicId) {
      subscription.active = false;
      subscriptions.delete(subscriptionId);
      count++;
    }
  }

  logger.info('Cleared clinic subscriptions', { clinicId, count });
  return count;
}

/**
 * Get subscription statistics
 */
export function getSubscriptionStatistics(): {
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionsByEventType: Record<string, number>;
  subscriptionsByClinic: Record<string, number>;
} {
  const allSubscriptions = Array.from(subscriptions.values());
  const activeSubscriptions = allSubscriptions.filter((s) => s.active);

  const subscriptionsByEventType: Record<string, number> = {};
  const subscriptionsByClinic: Record<string, number> = {};

  for (const subscription of activeSubscriptions) {
    for (const eventType of subscription.eventTypes) {
      subscriptionsByEventType[eventType] = (subscriptionsByEventType[eventType] || 0) + 1;
    }

    subscriptionsByClinic[subscription.clinicId] = (subscriptionsByClinic[subscription.clinicId] || 0) + 1;
  }

  return {
    totalSubscriptions: allSubscriptions.length,
    activeSubscriptions: activeSubscriptions.length,
    subscriptionsByEventType,
    subscriptionsByClinic,
  };
}

/**
 * Initialize real-time service (placeholder for WebSocket server setup)
 */
export function initializeRealtimeService(): void {
  logger.info('Real-time service initialized');
  // Placeholder for WebSocket server initialization
  // In production, this would set up WebSocket connections, Redis pub/sub, etc.
}

/**
 * Shutdown real-time service
 */
export function shutdownRealtimeService(): void {
  logger.info('Real-time service shutting down');

  for (const subscription of subscriptions.values()) {
    subscription.active = false;
  }

  subscriptions.clear();
  logger.info('All real-time subscriptions cleared');
}
