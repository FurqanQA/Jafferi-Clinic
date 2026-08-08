import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Announcements Manager
// Platform announcements and notifications
// ============================================================================

/**
 * Announcement interface
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';
  targetAudience: 'all' | 'admins' | 'tenants' | 'users';
  tenantId?: string;
  startDate: string;
  endDate: string | null;
  dismissible: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create announcement
 */
export async function createAnnouncement(data: {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'admins' | 'tenants' | 'users';
  tenantId?: string;
  startDate: string;
  endDate?: string;
  dismissible: boolean;
  createdBy: string;
}): Promise<Announcement> {
  try {
    await validatePlatformWritePermission(PlatformResource.ANNOUNCEMENTS);

    const supabase = getSupabaseClient();

    const announcementId = `announcement-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        id: announcementId,
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority,
        status: 'published',
        target_audience: data.targetAudience,
        tenant_id: data.tenantId || null,
        start_date: data.startDate,
        end_date: data.endDate || null,
        dismissible: data.dismissible,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create announcement', { error, data });
      throw new DatabaseError('Failed to create announcement', { error });
    }

    logger.info('Announcement created', { announcementId, title: data.title });

    // Invalidate cache
    cache.delete(`announcement:${announcementId}`);
    cache.delete('announcements:all');

    return announcement as Announcement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating announcement', { error, data });
    throw new DatabaseError('Failed to create announcement', { error });
  }
}

/**
 * Get announcement by ID
 */
export async function getAnnouncement(announcementId: string): Promise<Announcement> {
  try {
    const supabase = getSupabaseClient();

    const { data: announcement, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (error) {
      logger.error('Failed to fetch announcement', { error, announcementId });
      throw new DatabaseError('Failed to fetch announcement', { error });
    }

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return announcement as Announcement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching announcement', { error, announcementId });
    throw new DatabaseError('Failed to fetch announcement', { error });
  }
}

/**
 * List announcements
 */
export async function listAnnouncements(options: {
  page?: number;
  pageSize?: number;
  type?: 'info' | 'warning' | 'success' | 'error';
  status?: 'draft' | 'published' | 'archived';
  targetAudience?: 'all' | 'admins' | 'tenants' | 'users';
  tenantId?: string;
  active?: boolean;
}): Promise<{ announcements: Announcement[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, type, status, targetAudience, tenantId, active } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (targetAudience) {
      query = query.eq('target_audience', targetAudience);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (active) {
      const now = new Date().toISOString();
      query = query
        .eq('status', 'published')
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: announcements, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list announcements', { error });
      throw new DatabaseError('Failed to list announcements', { error });
    }

    return {
      announcements: (announcements || []) as Announcement[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing announcements', { error });
    throw new DatabaseError('Failed to list announcements', { error });
  }
}

/**
 * Update announcement
 */
export async function updateAnnouncement(announcementId: string, data: {
  title?: string;
  content?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  priority?: 'low' | 'medium' | 'high';
  status?: 'draft' | 'published' | 'archived';
  targetAudience?: 'all' | 'admins' | 'tenants' | 'users';
  startDate?: string;
  endDate?: string;
  dismissible?: boolean;
}): Promise<Announcement> {
  try {
    await validatePlatformWritePermission(PlatformResource.ANNOUNCEMENTS);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.targetAudience !== undefined) updateData.target_audience = data.targetAudience;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.dismissible !== undefined) updateData.dismissible = data.dismissible;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update announcement', { error, announcementId });
      throw new DatabaseError('Failed to update announcement', { error });
    }

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    logger.info('Announcement updated', { announcementId });

    // Invalidate cache
    cache.delete(`announcement:${announcementId}`);
    cache.delete('announcements:all');

    return announcement as Announcement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating announcement', { error, announcementId });
    throw new DatabaseError('Failed to update announcement', { error });
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(announcementId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.ANNOUNCEMENTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) {
      logger.error('Failed to delete announcement', { error, announcementId });
      throw new DatabaseError('Failed to delete announcement', { error });
    }

    logger.info('Announcement deleted', { announcementId });

    // Invalidate cache
    cache.delete(`announcement:${announcementId}`);
    cache.delete('announcements:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting announcement', { error, announcementId });
    throw new DatabaseError('Failed to delete announcement', { error });
  }
}

/**
 * Get active announcements
 */
export async function getActiveAnnouncements(targetAudience?: 'all' | 'admins' | 'tenants' | 'users'): Promise<Announcement[]> {
  try {
    const { announcements } = await listAnnouncements({ 
      active: true, 
      targetAudience, 
      pageSize: 100 
    });
    return announcements;
  } catch (error) {
    logger.error('Failed to get active announcements', { error });
    throw new DatabaseError('Failed to get active announcements', { error });
  }
}

/**
 * Get announcements by tenant
 */
export async function getAnnouncementsByTenant(tenantId: string): Promise<Announcement[]> {
  try {
    const { announcements } = await listAnnouncements({ 
      tenantId, 
      pageSize: 1000 
    });
    return announcements;
  } catch (error) {
    logger.error('Failed to get announcements by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get announcements by tenant', { error });
  }
}

/**
 * Get announcement statistics
 */
export async function getAnnouncementStatistics(): Promise<{
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  active: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: announcements } = await supabase
      .from('announcements')
      .select('type, status, priority, start_date, end_date');

    if (!announcements || announcements.length === 0) {
      return {
        total: 0,
        byType: {},
        byStatus: {},
        byPriority: {},
        active: 0,
      };
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let active = 0;
    const now = new Date();

    for (const announcement of announcements) {
      byType[announcement.type] = (byType[announcement.type] || 0) + 1;
      byStatus[announcement.status] = (byStatus[announcement.status] || 0) + 1;
      byPriority[announcement.priority] = (byPriority[announcement.priority] || 0) + 1;

      if (announcement.status === 'published') {
        const startDate = new Date(announcement.start_date);
        const endDate = announcement.end_date ? new Date(announcement.end_date) : null;

        if (startDate <= now && (!endDate || endDate >= now)) {
          active++;
        }
      }
    }

    return {
      total: announcements.length,
      byType,
      byStatus,
      byPriority,
      active,
    };
  } catch (error) {
    logger.error('Failed to get announcement statistics', { error });
    throw new DatabaseError('Failed to get announcement statistics', { error });
  }
}

/**
 * Archive announcement
 */
export async function archiveAnnouncement(announcementId: string): Promise<Announcement> {
  try {
    await validatePlatformWritePermission(PlatformResource.ANNOUNCEMENTS);

    return updateAnnouncement(announcementId, { status: 'archived' });
  } catch (error) {
    logger.error('Failed to archive announcement', { error, announcementId });
    throw new DatabaseError('Failed to archive announcement', { error });
  }
}

/**
 * Publish announcement
 */
export async function publishAnnouncement(announcementId: string): Promise<Announcement> {
  try {
    await validatePlatformWritePermission(PlatformResource.ANNOUNCEMENTS);

    return updateAnnouncement(announcementId, { status: 'published' });
  } catch (error) {
    logger.error('Failed to publish announcement', { error, announcementId });
    throw new DatabaseError('Failed to publish announcement', { error });
  }
}
