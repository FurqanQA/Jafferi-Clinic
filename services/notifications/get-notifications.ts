import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadNotificationPermission } from './notification-permissions';
import { Notification, NotificationStatus, NotificationType, NotificationPriority, NotificationChannel } from './notification-types';

// ============================================================================
// Get Notifications
// Retrieves multiple notifications with filtering and pagination
// ============================================================================

/**
 * Get notifications with filters
 */
export async function getNotifications(filters: {
  userId?: string;
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  module?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'sent_at' | 'read_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}): Promise<{
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const orderBy = filters.orderBy || 'created_at';
    const orderDirection = filters.orderDirection || 'desc';

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.module) {
      query = query.eq('module', filters.module);
    }
    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Channel filter (contains check since channels is an array)
    if (filters.channel) {
      query = query.contains('channels', [filters.channel]);
    }

    // Apply ordering and pagination
    query = query.order(orderBy, { ascending: orderDirection === 'asc' }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch notifications', { error, filters });
      throw new DatabaseError('Failed to fetch notifications', { error });
    }

    return {
      notifications: (data || []) as Notification[],
      total: count || 0,
      limit,
      offset,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notifications', { error, filters });
    throw new DatabaseError('Failed to fetch notifications', { error });
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch user notifications', { error, userId });
      throw new DatabaseError('Failed to fetch user notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching user notifications', { error, userId });
    throw new DatabaseError('Failed to fetch user notifications', { error });
  }
}

/**
 * Get notifications by module
 */
export async function getNotificationsByModule(
  module: string,
  options?: {
    entityId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.entityId) {
      query = query.eq('entity_id', options.entityId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch notifications by module', { error, module });
      throw new DatabaseError('Failed to fetch notifications by module', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notifications by module', { error, module });
    throw new DatabaseError('Failed to fetch notifications by module', { error });
  }
}

/**
 * Get notifications by status
 */
export async function getNotificationsByStatus(
  status: NotificationStatus,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch notifications by status', { error, status });
      throw new DatabaseError('Failed to fetch notifications by status', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notifications by status', { error, status });
    throw new DatabaseError('Failed to fetch notifications by status', { error });
  }
}

/**
 * Get notifications by type
 */
export async function getNotificationsByType(
  type: NotificationType,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('type', type)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch notifications by type', { error, type });
      throw new DatabaseError('Failed to fetch notifications by type', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notifications by type', { error, type });
    throw new DatabaseError('Failed to fetch notifications by type', { error });
  }
}

/**
 * Get notifications by priority
 */
export async function getNotificationsByPriority(
  priority: NotificationPriority,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('priority', priority)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch notifications by priority', { error, priority });
      throw new DatabaseError('Failed to fetch notifications by priority', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notifications by priority', { error, priority });
    throw new DatabaseError('Failed to fetch notifications by priority', { error });
  }
}

/**
 * Get recent notifications
 */
export async function getRecentNotifications(limit: number = 20): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch recent notifications', { error });
      throw new DatabaseError('Failed to fetch recent notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching recent notifications', { error });
    throw new DatabaseError('Failed to fetch recent notifications', { error });
  }
}

/**
 * Get active notifications (not archived, not deleted)
 */
export async function getActiveNotifications(options?: {
  limit?: number;
  offset?: number;
}): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .not('status', 'in', ['archived', 'deleted'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch active notifications', { error });
      throw new DatabaseError('Failed to fetch active notifications', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching active notifications', { error });
    throw new DatabaseError('Failed to fetch active notifications', { error });
  }
}

/**
 * Get notification count by status
 */
export async function getNotificationCountByStatus(): Promise<Record<NotificationStatus, number>> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const { data, error } = await supabase
      .from('notifications')
      .select('status')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to fetch notification count by status', { error });
      throw new DatabaseError('Failed to fetch notification count by status', { error });
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((n: any) => {
      counts[n.status] = (counts[n.status] || 0) + 1;
    });

    return counts as Record<NotificationStatus, number>;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification count by status', { error });
    throw new DatabaseError('Failed to fetch notification count by status', { error });
  }
}
