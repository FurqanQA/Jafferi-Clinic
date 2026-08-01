import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadNotificationPermission } from './notification-permissions';
import { Notification } from './notification-types';

// ============================================================================
// Export Notifications
// Exports notifications to various formats (CSV, JSON, PDF)
// ============================================================================

/**
 * Export notifications to CSV
 */
export async function exportNotificationsToCSV(filters?: {
  userId?: string;
  status?: string;
  type?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
}): Promise<string> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.module) {
      query = query.eq('module', filters.module);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

    if (error) {
      logger.error('Failed to fetch notifications for CSV export', { error });
      throw new DatabaseError('Failed to fetch notifications for CSV export', { error });
    }

    // Generate CSV
    const headers = [
      'ID',
      'Notification Number',
      'User ID',
      'Module',
      'Type',
      'Priority',
      'Status',
      'Channels',
      'Subject',
      'Body',
      'Created At',
      'Sent At',
      'Delivered At',
      'Read At',
    ];

    const rows = (data || []).map((n: any) => [
      n.id,
      n.notification_number,
      n.user_id || '',
      n.module,
      n.type,
      n.priority,
      n.status,
      n.channels.join(', '),
      `"${n.subject.replace(/"/g, '""')}"`,
      `"${n.body.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      n.created_at,
      n.sent_at || '',
      n.delivered_at || '',
      n.read_at || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    logger.info('Notifications exported to CSV', { count: data?.length });
    return csv;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting notifications to CSV', { error });
    throw new DatabaseError('Failed to export notifications to CSV', { error });
  }
}

/**
 * Export notifications to JSON
 */
export async function exportNotificationsToJSON(filters?: {
  userId?: string;
  status?: string;
  type?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
}): Promise<string> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.module) {
      query = query.eq('module', filters.module);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

    if (error) {
      logger.error('Failed to fetch notifications for JSON export', { error });
      throw new DatabaseError('Failed to fetch notifications for JSON export', { error });
    }

    const json = JSON.stringify(data || [], null, 2);

    logger.info('Notifications exported to JSON', { count: data?.length });
    return json;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting notifications to JSON', { error });
    throw new DatabaseError('Failed to export notifications to JSON', { error });
  }
}

/**
 * Export notifications to Excel (placeholder)
 */
export async function exportNotificationsToExcel(filters?: {
  userId?: string;
  status?: string;
  type?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Blob> {
  // Placeholder for Excel export
  // In production, this would use a library like xlsx or exceljs
  logger.info('Excel export requested (placeholder)', { filters });
  
  const csv = await exportNotificationsToCSV(filters);
  return new Blob([csv], { type: 'text/csv' });
}

/**
 * Export notification analytics to CSV
 */
export async function exportAnalyticsToCSV(startDate?: string, endDate?: string): Promise<string> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    const { data, error } = await supabase
      .from('notifications')
      .select('status, type, priority, created_at, sent_at, delivered_at, read_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', endDate || new Date().toISOString());

    if (error) {
      logger.error('Failed to fetch analytics for CSV export', { error });
      throw new DatabaseError('Failed to fetch analytics for CSV export', { error });
    }

    // Calculate analytics
    const headers = [
      'Date',
      'Total Sent',
      'Total Delivered',
      'Total Read',
      'Total Failed',
      'Delivery Rate %',
      'Open Rate %',
    ];

    const byDate: Record<string, { sent: number; delivered: number; read: number; failed: number }> = {};

    (data || []).forEach((n: any) => {
      const date = n.created_at.split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { sent: 0, delivered: 0, read: 0, failed: 0 };
      }

      if (n.status === 'sent' || n.status === 'delivered' || n.status === 'read') {
        byDate[date].sent++;
      }
      if (n.status === 'delivered' || n.status === 'read') {
        byDate[date].delivered++;
      }
      if (n.status === 'read') {
        byDate[date].read++;
      }
      if (n.status === 'failed') {
        byDate[date].failed++;
      }
    });

    const rows = Object.entries(byDate).map(([date, stats]) => [
      date,
      stats.sent,
      stats.delivered,
      stats.read,
      stats.failed,
      stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(2) : '0',
      stats.delivered > 0 ? ((stats.read / stats.delivered) * 100).toFixed(2) : '0',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    logger.info('Analytics exported to CSV', { count: rows.length });
    return csv;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting analytics to CSV', { error });
    throw new DatabaseError('Failed to export analytics to CSV', { error });
  }
}

/**
 * Generate export filename
 */
export function generateExportFilename(format: 'csv' | 'json' | 'excel'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `notifications-export-${timestamp}.${format}`;
}

/**
 * Export notification with attachments
 */
export async function exportNotificationWithAttachments(notificationId: string): Promise<{
  notification: Notification;
  attachments: any[];
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateReadNotificationPermission();

    // Get notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('clinic_id', clinicId)
      .single();

    if (notifError) {
      throw new DatabaseError('Failed to fetch notification', { error: notifError });
    }

    // Get attachments
    const { data: attachments, error: attachmentError } = await supabase
      .from('notification_attachments')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('clinic_id', clinicId);

    if (attachmentError) {
      throw new DatabaseError('Failed to fetch attachments', { error: attachmentError });
    }

    logger.info('Notification with attachments exported', { notificationId, attachmentCount: attachments?.length });
    return {
      notification: notification as Notification,
      attachments: attachments || [],
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting notification with attachments', { error, notificationId });
    throw new DatabaseError('Failed to export notification with attachments', { error });
  }
}
