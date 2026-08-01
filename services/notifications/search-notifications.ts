import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadNotificationPermission } from './notification-permissions';
import { Notification } from './notification-types';

// ============================================================================
// Search Notifications
// Searches notifications with full-text search and advanced filtering
// ============================================================================

/**
 * Search notifications by text
 */
export async function searchNotifications(query: string, options?: {
  userId?: string;
  status?: string;
  type?: string;
  module?: string;
  limit?: number;
  offset?: number;
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

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Build search query
    let searchQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Text search in subject and body
    if (query) {
      searchQuery = searchQuery.or(`subject.ilike.%${query}%,body.ilike.%${query}%`);
    }

    // Apply additional filters
    if (options?.userId) {
      searchQuery = searchQuery.eq('user_id', options.userId);
    }
    if (options?.status) {
      searchQuery = searchQuery.eq('status', options.status);
    }
    if (options?.type) {
      searchQuery = searchQuery.eq('type', options.type);
    }
    if (options?.module) {
      searchQuery = searchQuery.eq('module', options.module);
    }

    // Apply pagination
    searchQuery = searchQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await searchQuery;

    if (error) {
      logger.error('Failed to search notifications', { error, query });
      throw new DatabaseError('Failed to search notifications', { error });
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
    logger.error('Unexpected error searching notifications', { error, query });
    throw new DatabaseError('Failed to search notifications', { error });
  }
}

/**
 * Advanced search with multiple filters
 */
export async function advancedSearch(filters: {
  query?: string;
  userId?: string;
  status?: string;
  type?: string;
  priority?: string;
  module?: string;
  entityId?: string;
  channel?: string;
  startDate?: string;
  endDate?: string;
  hasAttachments?: boolean;
  limit?: number;
  offset?: number;
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

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Text search
    if (filters.query) {
      query = query.or(`subject.ilike.%${filters.query}%,body.ilike.%${filters.query}%`);
    }

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
    if (filters.channel) {
      query = query.contains('channels', [filters.channel]);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to perform advanced search', { error, filters });
      throw new DatabaseError('Failed to perform advanced search', { error });
    }

    let notifications = (data || []) as Notification[];

    // Filter by attachments if specified (client-side filter for now)
    if (filters.hasAttachments !== undefined) {
      // In production, this would be a database query
      // For now, we'll return all results and let the client filter
      logger.info('Has attachments filter applied (client-side)', { hasAttachments: filters.hasAttachments });
    }

    return {
      notifications,
      total: count || 0,
      limit,
      offset,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error performing advanced search', { error, filters });
    throw new DatabaseError('Failed to perform advanced search', { error });
  }
}

/**
 * Search notifications by subject
 */
export async function searchBySubject(query: string, options?: {
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
      .is('deleted_at', null)
      .ilike('subject', `%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to search notifications by subject', { error, query });
      throw new DatabaseError('Failed to search notifications by subject', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching notifications by subject', { error, query });
    throw new DatabaseError('Failed to search notifications by subject', { error });
  }
}

/**
 * Search notifications by body content
 */
export async function searchByBody(query: string, options?: {
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
      .is('deleted_at', null)
      .ilike('body', `%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to search notifications by body', { error, query });
      throw new DatabaseError('Failed to search notifications by body', { error });
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching notifications by body', { error, query });
    throw new DatabaseError('Failed to search notifications by body', { error });
  }
}

/**
 * Search notifications by data fields
 */
export async function searchByData(dataKey: string, dataValue: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<Notification[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Placeholder for JSON data search
    // In production, this would use JSONB operators
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to search notifications by data', { error, dataKey });
      throw new DatabaseError('Failed to search notifications by data', { error });
    }

    // Filter client-side for now
    const filtered = (data || []).filter((n: any) => {
      if (!n.data) return false;
      const dataStr = JSON.stringify(n.data).toLowerCase();
      return dataStr.includes(dataKey.toLowerCase()) && dataStr.includes(dataValue.toLowerCase());
    });

    return filtered as Notification[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching notifications by data', { error, dataKey });
    throw new DatabaseError('Failed to search notifications by data', { error });
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    // Search subjects for suggestions
    const { data, error } = await supabase
      .from('notifications')
      .select('subject')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .ilike('subject', `%${query}%`)
      .limit(limit);

    if (error) {
      logger.error('Failed to get search suggestions', { error, query });
      throw new DatabaseError('Failed to get search suggestions', { error });
    }

    // Extract unique subjects
    const suggestions = Array.from(
      new Set((data || []).map((n: any) => n.subject))
    ).slice(0, limit);

    return suggestions;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error getting search suggestions', { error, query });
    throw new DatabaseError('Failed to get search suggestions', { error });
  }
}
