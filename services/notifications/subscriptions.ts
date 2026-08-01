import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageSubscriptionPermission } from './notification-permissions';
import { validateNotificationSubscription } from './notification-validation';
import { NotificationSubscription, NotificationModule, NotificationChannel } from './notification-types';

// ============================================================================
// Notification Subscriptions
// Manages user subscriptions to notification types and modules
// ============================================================================

/**
 * Get user notification subscriptions
 */
export async function getUserSubscriptions(userId?: string): Promise<NotificationSubscription[]> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManageSubscriptionPermission();

    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch notification subscriptions', { error, userId: targetUserId });
      throw new DatabaseError('Failed to fetch notification subscriptions', { error });
    }

    return (data || []) as NotificationSubscription[];
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification subscriptions', { error, userId: targetUserId });
    throw new DatabaseError('Failed to fetch notification subscriptions', { error });
  }
}

/**
 * Get user subscription for specific module
 */
export async function getUserSubscriptionForModule(
  module: NotificationModule,
  userId?: string
): Promise<NotificationSubscription | null> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManageSubscriptionPermission();

    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Failed to fetch notification subscription', { error, userId: targetUserId, module });
      throw new DatabaseError('Failed to fetch notification subscription', { error });
    }

    return data as NotificationSubscription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification subscription', { error, userId: targetUserId, module });
    throw new DatabaseError('Failed to fetch notification subscription', { error });
  }
}

/**
 * Create or update notification subscription
 */
export async function upsertSubscription(
  subscription: Partial<NotificationSubscription>,
  userId?: string
): Promise<NotificationSubscription> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManageSubscriptionPermission();
    validateNotificationSubscription(subscription);

    const now = new Date().toISOString();

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('notification_subscriptions')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .eq('module', subscription.module)
      .single();

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('notification_subscriptions')
        .update({
          ...subscription,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update notification subscription', { error, userId: targetUserId });
        throw new DatabaseError('Failed to update notification subscription', { error });
      }

      logger.info('Notification subscription updated', { userId: targetUserId, module: subscription.module });
      return data as NotificationSubscription;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('notification_subscriptions')
        .insert({
          user_id: targetUserId,
          clinic_id: clinicId,
          ...subscription,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create notification subscription', { error, userId: targetUserId });
        throw new DatabaseError('Failed to create notification subscription', { error });
      }

      logger.info('Notification subscription created', { userId: targetUserId, module: subscription.module });
      return data as NotificationSubscription;
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error upserting notification subscription', { error, userId: targetUserId });
    throw new DatabaseError('Failed to upsert notification subscription', { error });
  }
}

/**
 * Subscribe user to module
 */
export async function subscribeToModule(
  module: NotificationModule,
  userId?: string
): Promise<NotificationSubscription> {
  return await upsertSubscription(
    {
      module,
      is_subscribed: true,
    },
    userId
  );
}

/**
 * Unsubscribe user from module
 */
export async function unsubscribeFromModule(
  module: NotificationModule,
  userId?: string
): Promise<NotificationSubscription> {
  return await upsertSubscription(
    {
      module,
      is_subscribed: false,
    },
    userId
  );
}

/**
 * Update subscription channels (placeholder - channels are managed via preferences)
 */
export async function updateSubscriptionChannels(
  module: NotificationModule,
  userId?: string
): Promise<NotificationSubscription> {
  // Channels are managed via notification preferences, not subscriptions
  // This function is a placeholder for future enhancement
  return await getUserSubscriptionForModule(module, userId) || (await subscribeToModule(module, userId));
}

/**
 * Delete subscription
 */
export async function deleteSubscription(
  module: NotificationModule,
  userId?: string
): Promise<void> {
  const user = await getCurrentUser();
  const targetUserId = userId || user.id;
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateManageSubscriptionPermission();

    const { error } = await supabase
      .from('notification_subscriptions')
      .delete()
      .eq('user_id', targetUserId)
      .eq('clinic_id', clinicId)
      .eq('module', module);

    if (error) {
      logger.error('Failed to delete notification subscription', { error, userId: targetUserId, module });
      throw new DatabaseError('Failed to delete notification subscription', { error });
    }

    logger.info('Notification subscription deleted', { userId: targetUserId, module });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting notification subscription', { error, userId: targetUserId, module });
    throw new DatabaseError('Failed to delete notification subscription', { error });
  }
}

/**
 * Get all subscriptions (admin only)
 */
export async function getAllSubscriptions(): Promise<NotificationSubscription[]> {
  await validateManageSubscriptionPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch all notification subscriptions', { error });
      throw new DatabaseError('Failed to fetch all notification subscriptions', { error });
    }

    return (data || []) as NotificationSubscription[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching all notification subscriptions', { error });
    throw new DatabaseError('Failed to fetch all notification subscriptions', { error });
  }
}

/**
 * Get subscriptions by module
 */
export async function getSubscriptionsByModule(module: NotificationModule): Promise<NotificationSubscription[]> {
  await validateManageSubscriptionPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .eq('is_subscribed', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch subscriptions by module', { error, module });
      throw new DatabaseError('Failed to fetch subscriptions by module', { error });
    }

    return (data || []) as NotificationSubscription[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching subscriptions by module', { error, module });
    throw new DatabaseError('Failed to fetch subscriptions by module', { error });
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStatistics(): Promise<{
  totalSubscriptions: number;
  byModule: Record<string, number>;
}> {
  await validateManageSubscriptionPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_subscribed', true);

    if (error) {
      logger.error('Failed to fetch subscription statistics', { error });
      throw new DatabaseError('Failed to fetch subscription statistics', { error });
    }

    const subscriptions = data || [];

    const byModule: Record<string, number> = {};

    subscriptions.forEach((sub: any) => {
      byModule[sub.module] = (byModule[sub.module] || 0) + 1;
    });

    return {
      totalSubscriptions: subscriptions.length,
      byModule,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching subscription statistics', { error });
    throw new DatabaseError('Failed to fetch subscription statistics', { error });
  }
}

/**
 * Check if user is subscribed to module
 */
export async function isUserSubscribedToModule(
  module: NotificationModule,
  userId?: string
): Promise<boolean> {
  const subscription = await getUserSubscriptionForModule(module, userId);
  return subscription?.is_subscribed || false;
}

/**
 * Get users subscribed to module
 */
export async function getUsersSubscribedToModule(
  module: NotificationModule
): Promise<string[]> {
  await validateManageSubscriptionPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('user_id')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .eq('is_subscribed', true);

    if (error) {
      logger.error('Failed to fetch users subscribed to module', { error, module });
      throw new DatabaseError('Failed to fetch users subscribed to module', { error });
    }

    const subscriptions = data || [];
    return subscriptions.map((sub: any) => sub.user_id);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching users subscribed to module', { error, module });
    throw new DatabaseError('Failed to fetch users subscribed to module', { error });
  }
}

/**
 * Bulk subscribe users to module
 */
export async function bulkSubscribeToModule(
  userIds: string[],
  module: NotificationModule
): Promise<NotificationSubscription[]> {
  const results: NotificationSubscription[] = [];

  for (const userId of userIds) {
    try {
      const subscription = await subscribeToModule(module, userId);
      results.push(subscription);
    } catch (error) {
      logger.error('Failed to subscribe user to module', { error, userId, module });
    }
  }

  return results;
}

/**
 * Bulk unsubscribe users from module
 */
export async function bulkUnsubscribeFromModule(
  userIds: string[],
  module: NotificationModule
): Promise<number> {
  let successCount = 0;

  for (const userId of userIds) {
    try {
      await unsubscribeFromModule(module, userId);
      successCount++;
    } catch (error) {
      logger.error('Failed to unsubscribe user from module', { error, userId, module });
    }
  }

  return successCount;
}
