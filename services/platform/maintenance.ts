import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Maintenance Manager
// System maintenance and scheduled operations
// ============================================================================

/**
 * Maintenance window interface
 */
export interface MaintenanceWindow {
  id: string;
  name: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  duration: number;
  type: 'routine' | 'emergency' | 'upgrade';
  impact: 'none' | 'low' | 'medium' | 'high';
  affectedServices: string[];
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Create maintenance window
 */
export async function createMaintenanceWindow(data: {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  type: 'routine' | 'emergency' | 'upgrade';
  impact: 'none' | 'low' | 'medium' | 'high';
  affectedServices: string[];
  createdBy: string;
}): Promise<MaintenanceWindow> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const windowId = `maintenance-${Date.now()}`;
    const now = new Date().toISOString();
    const duration = new Date(data.endTime).getTime() - new Date(data.startTime).getTime();

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .insert({
        id: windowId,
        name: data.name,
        description: data.description,
        status: 'scheduled',
        start_time: data.startTime,
        end_time: data.endTime,
        duration,
        type: data.type,
        impact: data.impact,
        affected_services: data.affectedServices,
        created_by: data.createdBy,
        created_at: now,
        completed_at: null,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create maintenance window', { error, data });
      throw new DatabaseError('Failed to create maintenance window', { error });
    }

    logger.info('Maintenance window created', { windowId, name: data.name, startTime: data.startTime });

    // Invalidate cache
    cache.delete(`maintenance:${windowId}`);
    cache.delete('maintenance:all');

    return window as MaintenanceWindow;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating maintenance window', { error, data });
    throw new DatabaseError('Failed to create maintenance window', { error });
  }
}

/**
 * Get maintenance window by ID
 */
export async function getMaintenanceWindow(windowId: string): Promise<MaintenanceWindow> {
  try {
    const supabase = getSupabaseClient();

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .select('*')
      .eq('id', windowId)
      .single();

    if (error) {
      logger.error('Failed to fetch maintenance window', { error, windowId });
      throw new DatabaseError('Failed to fetch maintenance window', { error });
    }

    if (!window) {
      throw new NotFoundError('Maintenance window not found');
    }

    return window as MaintenanceWindow;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching maintenance window', { error, windowId });
    throw new DatabaseError('Failed to fetch maintenance window', { error });
  }
}

/**
 * List maintenance windows
 */
export async function listMaintenanceWindows(options: {
  page?: number;
  pageSize?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type?: 'routine' | 'emergency' | 'upgrade';
  from?: string;
  to?: string;
}): Promise<{ windows: MaintenanceWindow[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, type, from, to } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('maintenance_windows')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (from) {
      query = query.gte('start_time', from);
    }

    if (to) {
      query = query.lte('start_time', to);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: windows, error, count } = await query
      .range(fromIndex, toIndex)
      .order('start_time', { ascending: false });

    if (error) {
      logger.error('Failed to list maintenance windows', { error });
      throw new DatabaseError('Failed to list maintenance windows', { error });
    }

    return {
      windows: (windows || []) as MaintenanceWindow[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing maintenance windows', { error });
    throw new DatabaseError('Failed to list maintenance windows', { error });
  }
}

/**
 * Update maintenance window
 */
export async function updateMaintenanceWindow(windowId: string, data: {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  impact?: 'none' | 'low' | 'medium' | 'high';
  affectedServices?: string[];
}): Promise<MaintenanceWindow> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.impact !== undefined) updateData.impact = data.impact;
    if (data.affectedServices !== undefined) updateData.affected_services = data.affectedServices;

    if (data.startTime !== undefined && data.endTime !== undefined) {
      updateData.duration = new Date(data.endTime).getTime() - new Date(data.startTime).getTime();
    }

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .update(updateData)
      .eq('id', windowId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update maintenance window', { error, windowId });
      throw new DatabaseError('Failed to update maintenance window', { error });
    }

    if (!window) {
      throw new NotFoundError('Maintenance window not found');
    }

    logger.info('Maintenance window updated', { windowId });

    // Invalidate cache
    cache.delete(`maintenance:${windowId}`);

    return window as MaintenanceWindow;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating maintenance window', { error, windowId });
    throw new DatabaseError('Failed to update maintenance window', { error });
  }
}

/**
 * Start maintenance window
 */
export async function startMaintenanceWindow(windowId: string): Promise<MaintenanceWindow> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .update({ status: 'in_progress' })
      .eq('id', windowId)
      .eq('status', 'scheduled')
      .select()
      .single();

    if (error) {
      logger.error('Failed to start maintenance window', { error, windowId });
      throw new DatabaseError('Failed to start maintenance window', { error });
    }

    if (!window) {
      throw new NotFoundError('Maintenance window not found or not in scheduled state');
    }

    logger.info('Maintenance window started', { windowId });

    // Invalidate cache
    cache.delete(`maintenance:${windowId}`);

    return window as MaintenanceWindow;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error starting maintenance window', { error, windowId });
    throw new DatabaseError('Failed to start maintenance window', { error });
  }
}

/**
 * Complete maintenance window
 */
export async function completeMaintenanceWindow(windowId: string): Promise<MaintenanceWindow> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', windowId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete maintenance window', { error, windowId });
      throw new DatabaseError('Failed to complete maintenance window', { error });
    }

    if (!window) {
      throw new NotFoundError('Maintenance window not found');
    }

    logger.info('Maintenance window completed', { windowId });

    // Invalidate cache
    cache.delete(`maintenance:${windowId}`);

    return window as MaintenanceWindow;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing maintenance window', { error, windowId });
    throw new DatabaseError('Failed to complete maintenance window', { error });
  }
}

/**
 * Cancel maintenance window
 */
export async function cancelMaintenanceWindow(windowId: string): Promise<MaintenanceWindow> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const { data: window, error } = await supabase
      .from('maintenance_windows')
      .update({ status: 'cancelled' })
      .eq('id', windowId)
      .in('status', ['scheduled', 'in_progress'])
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel maintenance window', { error, windowId });
      throw new DatabaseError('Failed to cancel maintenance window', { error });
    }

    if (!window) {
      throw new NotFoundError('Maintenance window not found or cannot be cancelled');
    }

    logger.info('Maintenance window cancelled', { windowId });

    // Invalidate cache
    cache.delete(`maintenance:${windowId}`);

    return window as MaintenanceWindow;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling maintenance window', { error, windowId });
    throw new DatabaseError('Failed to cancel maintenance window', { error });
  }
}

/**
 * Delete maintenance window
 */
export async function deleteMaintenanceWindow(windowId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.MAINTENANCE);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('maintenance_windows')
      .delete()
      .eq('id', windowId);

    if (error) {
      logger.error('Failed to delete maintenance window', { error, windowId });
      throw new DatabaseError('Failed to delete maintenance window', { error });
    }

    logger.info('Maintenance window deleted', { windowId });

    // Invalidate cache
    cache.delete(`maintenance:${windowId}`);
    cache.delete('maintenance:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting maintenance window', { error, windowId });
    throw new DatabaseError('Failed to delete maintenance window', { error });
  }
}

/**
 * Get active maintenance windows
 */
export async function getActiveMaintenanceWindows(): Promise<MaintenanceWindow[]> {
  try {
    const { windows } = await listMaintenanceWindows({ status: 'in_progress', pageSize: 100 });
    return windows;
  } catch (error) {
    logger.error('Failed to get active maintenance windows', { error });
    throw new DatabaseError('Failed to get active maintenance windows', { error });
  }
}

/**
 * Get upcoming maintenance windows
 */
export async function getUpcomingMaintenanceWindows(limit: number = 10): Promise<MaintenanceWindow[]> {
  try {
    const now = new Date().toISOString();
    const { windows } = await listMaintenanceWindows({ 
      status: 'scheduled', 
      from: now, 
      pageSize: limit 
    });
    return windows;
  } catch (error) {
    logger.error('Failed to get upcoming maintenance windows', { error });
    throw new DatabaseError('Failed to get upcoming maintenance windows', { error });
  }
}

/**
 * Get maintenance statistics
 */
export async function getMaintenanceStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byImpact: Record<string, number>;
  totalDuration: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: windows } = await supabase
      .from('maintenance_windows')
      .select('status, type, impact, duration');

    if (!windows || windows.length === 0) {
      return {
        total: 0,
        byStatus: {},
        byType: {},
        byImpact: {},
        totalDuration: 0,
      };
    }

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byImpact: Record<string, number> = {};
    let totalDuration = 0;

    for (const window of windows) {
      byStatus[window.status] = (byStatus[window.status] || 0) + 1;
      byType[window.type] = (byType[window.type] || 0) + 1;
      byImpact[window.impact] = (byImpact[window.impact] || 0) + 1;
      totalDuration += window.duration;
    }

    return {
      total: windows.length,
      byStatus,
      byType,
      byImpact,
      totalDuration,
    };
  } catch (error) {
    logger.error('Failed to get maintenance statistics', { error });
    throw new DatabaseError('Failed to get maintenance statistics', { error });
  }
}

/**
 * Check if maintenance is currently active
 */
export async function isMaintenanceActive(): Promise<{
  isActive: boolean;
  windows: MaintenanceWindow[];
}> {
  try {
    const windows = await getActiveMaintenanceWindows();
    return {
      isActive: windows.length > 0,
      windows,
    };
  } catch (error) {
    logger.error('Failed to check maintenance status', { error });
    throw new DatabaseError('Failed to check maintenance status', { error });
  }
}

/**
 * Get maintenance history
 */
export async function getMaintenanceHistory(days: number = 30): Promise<MaintenanceWindow[]> {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { windows } = await listMaintenanceWindows({ 
      from, 
      pageSize: 100 
    });
    return windows;
  } catch (error) {
    logger.error('Failed to get maintenance history', { error });
    throw new DatabaseError('Failed to get maintenance history', { error });
  }
}

/**
 * Schedule recurring maintenance
 */
export async function scheduleRecurringMaintenance(data: {
  name: string;
  description: string;
  schedule: string;
  duration: number;
  type: 'routine' | 'emergency' | 'upgrade';
  impact: 'none' | 'low' | 'medium' | 'high';
  affectedServices: string[];
  createdBy: string;
}): Promise<string> {
  try {
    await validatePlatformWritePermission(PlatformResource.MAINTENANCE);

    // Placeholder for recurring maintenance scheduling
    // In production, this would integrate with the scheduler service
    logger.info('Recurring maintenance scheduled', { data });
    return `scheduled-${Date.now()}`;
  } catch (error) {
    logger.error('Failed to schedule recurring maintenance', { error, data });
    throw new DatabaseError('Failed to schedule recurring maintenance', { error });
  }
}
