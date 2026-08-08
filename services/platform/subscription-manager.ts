import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';
import { Subscription, SubscriptionStatus, BillingCycle } from './platform-types';

// ============================================================================
// Subscription Manager
// Subscription management operations for tenants
// ============================================================================

/**
 * Create a new subscription
 */
export async function createSubscription(data: {
  tenantId: string;
  planId: string;
  billingCycle: BillingCycle;
  trialDays?: number;
  couponId?: string;
}): Promise<Subscription> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUBSCRIPTIONS);

    const supabase = getSupabaseClient();

    // Check if tenant already has an active subscription
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('status', SubscriptionStatus.ACTIVE)
      .single();

    if (existing) {
      throw new DatabaseError('Tenant already has an active subscription', { tenantId: data.tenantId });
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('price, currency, trial_days')
      .eq('id', data.planId)
      .single();

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    // Create subscription
    const subscriptionId = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const trialDays = data.trialDays || plan.trial_days || 0;

    let trialStart: string | null = null;
    let trialEnd: string | null = null;

    if (trialDays > 0) {
      trialStart = now;
      trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    }

    // Calculate period end based on billing cycle
    let periodEnd: string;
    const cycleMonths = data.billingCycle === BillingCycle.MONTHLY ? 1 : data.billingCycle === BillingCycle.QUARTERLY ? 3 : 12;
    periodEnd = new Date(Date.now() + cycleMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        id: subscriptionId,
        tenant_id: data.tenantId,
        plan_id: data.planId,
        status: trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        billing_cycle: data.billingCycle,
        current_period_start: now,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        canceled_at: null,
        trial_start: trialStart,
        trial_end: trialEnd,
        coupon_id: data.couponId || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create subscription', { error, data });
      throw new DatabaseError('Failed to create subscription', { error });
    }

    logger.info('Subscription created successfully', { subscriptionId, tenantId: data.tenantId, planId: data.planId });

    // Invalidate cache
    cache.delete(`subscription:${subscriptionId}`);
    cache.delete(`subscription:tenant:${data.tenantId}`);

    // Update tenant with subscription ID
    await supabase
      .from('tenants')
      .update({ subscription_id: subscriptionId })
      .eq('id', data.tenantId);

    return subscription as Subscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating subscription', { error, data });
    throw new DatabaseError('Failed to create subscription', { error });
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(subscriptionId: string, data: {
  planId?: string;
  billingCycle?: BillingCycle;
  cancelAtPeriodEnd?: boolean;
}): Promise<Subscription> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUBSCRIPTIONS);

    const supabase = getSupabaseClient();

    // Get current subscription
    const { data: current } = await supabase
      .from('subscriptions')
      .select('tenant_id, plan_id, billing_cycle')
      .eq('id', subscriptionId)
      .single();

    if (!current) {
      throw new NotFoundError('Subscription not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.planId !== undefined) updateData.plan_id = data.planId;
    if (data.billingCycle !== undefined) updateData.billing_cycle = data.billingCycle;
    if (data.cancelAtPeriodEnd !== undefined) {
      updateData.cancel_at_period_end = data.cancelAtPeriodEnd;
      if (data.cancelAtPeriodEnd) {
        updateData.canceled_at = new Date().toISOString();
      } else {
        updateData.canceled_at = null;
      }
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update subscription', { error, subscriptionId });
      throw new DatabaseError('Failed to update subscription', { error });
    }

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    logger.info('Subscription updated successfully', { subscriptionId });

    // Invalidate cache
    cache.delete(`subscription:${subscriptionId}`);
    cache.delete(`subscription:tenant:${current.tenant_id}`);

    return subscription as Subscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating subscription', { error, subscriptionId });
    throw new DatabaseError('Failed to update subscription', { error });
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUBSCRIPTIONS);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!cancelAtPeriodEnd) {
      updateData.status = SubscriptionStatus.CANCELLED;
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw new DatabaseError('Failed to cancel subscription', { error });
    }

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    logger.info('Subscription cancelled successfully', { subscriptionId, cancelAtPeriodEnd });

    // Invalidate cache
    cache.delete(`subscription:${subscriptionId}`);
    cache.delete(`subscription:tenant:${subscription.tenant_id}`);

    return subscription as Subscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling subscription', { error, subscriptionId });
    throw new DatabaseError('Failed to cancel subscription', { error });
  }
}

/**
 * Delete subscription
 */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.SUBSCRIPTIONS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      logger.error('Failed to delete subscription', { error, subscriptionId });
      throw new DatabaseError('Failed to delete subscription', { error });
    }

    logger.info('Subscription deleted successfully', { subscriptionId });

    // Invalidate cache
    cache.delete(`subscription:${subscriptionId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting subscription', { error, subscriptionId });
    throw new DatabaseError('Failed to delete subscription', { error });
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    // Check cache first
    const cached = cache.get<Subscription>(`subscription:${subscriptionId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error) {
      logger.error('Failed to fetch subscription', { error, subscriptionId });
      throw new DatabaseError('Failed to fetch subscription', { error });
    }

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // Cache result
    cache.set(`subscription:${subscriptionId}`, subscription, cacheHelpers.ttl.MEDIUM);

    return subscription as Subscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching subscription', { error, subscriptionId });
    throw new DatabaseError('Failed to fetch subscription', { error });
  }
}

/**
 * Get subscription by tenant ID
 */
export async function getSubscriptionByTenant(tenantId: string): Promise<Subscription> {
  try {
    // Check cache first
    const cacheKey = `subscription:tenant:${tenantId}`;
    const cached = cache.get<Subscription>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Failed to fetch subscription by tenant', { error, tenantId });
      throw new DatabaseError('Failed to fetch subscription', { error });
    }

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // Cache result
    cache.set(cacheKey, subscription, cacheHelpers.ttl.MEDIUM);
    cache.set(`subscription:${subscription.id}`, subscription, cacheHelpers.ttl.MEDIUM);

    return subscription as Subscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching subscription by tenant', { error, tenantId });
    throw new DatabaseError('Failed to fetch subscription', { error });
  }
}

/**
 * List subscriptions
 */
export async function listSubscriptions(options: {
  page?: number;
  pageSize?: number;
  status?: SubscriptionStatus;
  planId?: string;
  tenantId?: string;
  search?: string;
}): Promise<{ subscriptions: Subscription[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, planId, tenantId, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (search) {
      // Search by tenant name (requires join)
      query = query;
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: subscriptions, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list subscriptions', { error });
      throw new DatabaseError('Failed to list subscriptions', { error });
    }

    return {
      subscriptions: (subscriptions || []) as Subscription[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing subscriptions', { error });
    throw new DatabaseError('Failed to list subscriptions', { error });
  }
}

/**
 * Renew subscription
 */
export async function renewSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUBSCRIPTIONS);

    const supabase = getSupabaseClient();

    // Get current subscription
    const { data: current } = await supabase
      .from('subscriptions')
      .select('billing_cycle')
      .eq('id', subscriptionId)
      .single();

    if (!current) {
      throw new NotFoundError('Subscription not found');
    }

    // Calculate new period end
    const cycleMonths = current.billing_cycle === BillingCycle.MONTHLY ? 1 : current.billing_cycle === BillingCycle.QUARTERLY ? 3 : 12;
    const newPeriodEnd = new Date(Date.now() + cycleMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: SubscriptionStatus.ACTIVE,
        current_period_start: new Date().toISOString(),
        current_period_end: newPeriodEnd,
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to renew subscription', { error, subscriptionId });
      throw new DatabaseError('Failed to renew subscription', { error });
    }

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    logger.info('Subscription renewed successfully', { subscriptionId });

    // Invalidate cache
    cache.delete(`subscription:${subscriptionId}`);
    cache.delete(`subscription:tenant:${subscription.tenant_id}`);

    return subscription as Subscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error renewing subscription', { error, subscriptionId });
    throw new DatabaseError('Failed to renew subscription', { error });
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStatistics(): Promise<{
  total: number;
  active: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  byPlan: Record<string, number>;
  byCycle: Record<string, number>;
}> {
  try {
    const supabase = getSupabaseClient();

    const [{ data: allSubs }, { count: active }, { count: trialing }, { count: pastDue }, { count: cancelled }] = await Promise.all([
      supabase.from('subscriptions').select('plan_id, billing_cycle'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', SubscriptionStatus.ACTIVE),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', SubscriptionStatus.TRIALING),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', SubscriptionStatus.PAST_DUE),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', SubscriptionStatus.CANCELLED),
    ]);

    const byPlan: Record<string, number> = {};
    const byCycle: Record<string, number> = {};

    for (const sub of allSubs || []) {
      byPlan[sub.plan_id] = (byPlan[sub.plan_id] || 0) + 1;
      byCycle[sub.billing_cycle] = (byCycle[sub.billing_cycle] || 0) + 1;
    }

    return {
      total: allSubs?.length || 0,
      active: active || 0,
      trialing: trialing || 0,
      pastDue: pastDue || 0,
      cancelled: cancelled || 0,
      byPlan,
      byCycle,
    };
  } catch (error) {
    logger.error('Failed to get subscription statistics', { error });
    throw new DatabaseError('Failed to get subscription statistics', { error });
  }
}
