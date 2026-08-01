import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { CriticalValueAlert } from './laboratory-types';

/**
 * Create critical value alert
 */
export async function createCriticalValueAlert(input: CriticalValueAlert): Promise<CriticalValueAlert> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .insert({
        ...input,
        clinic_id: clinicId,
        notification_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create critical value alert', { error, input });
      throw new DatabaseError('Failed to create critical value alert', { error });
    }

    logger.info('Critical value alert created successfully', { alertId: data.id });
    return data as CriticalValueAlert;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating critical value alert', { error, input });
    throw new DatabaseError('Failed to create critical value alert', { error });
  }
}

/**
 * Get critical value alert by ID
 */
export async function getCriticalValueAlertById(alertId: string): Promise<CriticalValueAlert> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch critical value alert', { error, alertId });
      throw new DatabaseError('Failed to fetch critical value alert', { error });
    }

    if (!data) {
      throw new NotFoundError('Critical value alert not found');
    }

    return data as CriticalValueAlert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching critical value alert', { error, alertId });
    throw new DatabaseError('Failed to fetch critical value alert', { error });
  }
}

/**
 * Get critical value alerts by lab order ID
 */
export async function getCriticalValueAlertsByLabOrder(labOrderId: string): Promise<CriticalValueAlert[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('alert_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch critical value alerts by lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch critical value alerts by lab order', { error });
    }

    return (data || []) as CriticalValueAlert[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching critical value alerts by lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch critical value alerts by lab order', { error });
  }
}

/**
 * Get unacknowledged critical value alerts
 */
export async function getUnacknowledgedCriticalAlerts(): Promise<CriticalValueAlert[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('acknowledged_at', null)
      .is('deleted_at', null)
      .order('alert_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch unacknowledged critical alerts', { error });
      throw new DatabaseError('Failed to fetch unacknowledged critical alerts', { error });
    }

    return (data || []) as CriticalValueAlert[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching unacknowledged critical alerts', { error });
    throw new DatabaseError('Failed to fetch unacknowledged critical alerts', { error });
  }
}

/**
 * Get critical value alerts by patient
 */
export async function getCriticalValueAlertsByPatient(patientId: string): Promise<CriticalValueAlert[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('alert_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch critical value alerts by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch critical value alerts by patient', { error });
    }

    return (data || []) as CriticalValueAlert[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching critical value alerts by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch critical value alerts by patient', { error });
  }
}

/**
 * Acknowledge critical value alert
 */
export async function acknowledgeCriticalValueAlert(alertId: string, notes?: string): Promise<CriticalValueAlert> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .update({
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to acknowledge critical value alert', { error, alertId });
      throw new DatabaseError('Failed to acknowledge critical value alert', { error });
    }

    if (!data) {
      throw new NotFoundError('Critical value alert not found');
    }

    logger.info('Critical value alert acknowledged successfully', { alertId });
    return data as CriticalValueAlert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error acknowledging critical value alert', { error, alertId });
    throw new DatabaseError('Failed to acknowledge critical value alert', { error });
  }
}

/**
 * Mark critical value alert as notification sent
 */
export async function markCriticalAlertNotificationSent(alertId: string): Promise<CriticalValueAlert> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .update({
        notification_sent: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark critical alert notification as sent', { error, alertId });
      throw new DatabaseError('Failed to mark critical alert notification as sent', { error });
    }

    if (!data) {
      throw new NotFoundError('Critical value alert not found');
    }

    logger.info('Critical alert notification marked as sent', { alertId });
    return data as CriticalValueAlert;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error marking critical alert notification as sent', { error, alertId });
    throw new DatabaseError('Failed to mark critical alert notification as sent', { error });
  }
}

/**
 * Get critical value alerts by critical type
 */
export async function getCriticalAlertsByType(criticalType: 'critical_high' | 'critical_low' | 'positive_infectious' | 'emergency_finding'): Promise<CriticalValueAlert[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('critical_value_alerts')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('critical_type', criticalType)
      .is('deleted_at', null)
      .order('alert_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch critical alerts by type', { error, criticalType });
      throw new DatabaseError('Failed to fetch critical alerts by type', { error });
    }

    return (data || []) as CriticalValueAlert[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching critical alerts by type', { error, criticalType });
    throw new DatabaseError('Failed to fetch critical alerts by type', { error });
  }
}

/**
 * Send critical value notification (placeholder)
 */
export async function sendCriticalValueNotification(alertId: string): Promise<void> {
  // TODO: Implement notification system for critical values
  // This should send notifications via SMS, email, in-app alerts, etc.
  logger.info('Critical value notification placeholder', { alertId });
}

/**
 * Get critical value statistics
 */
export async function getCriticalValueStatistics(days: number = 30): Promise<{
  total: number;
  acknowledged: number;
  unacknowledged: number;
  byType: Record<string, number>;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('critical_value_alerts')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('alert_time', startDate.toISOString())
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to fetch critical value statistics', { error });
      throw new DatabaseError('Failed to fetch critical value statistics', { error });
    }

    const alerts = data || [];
    const total = alerts.length;
    const acknowledged = alerts.filter((a: any) => a.acknowledged_at !== null).length;
    const unacknowledged = total - acknowledged;

    const byType: Record<string, number> = {};
    alerts.forEach((alert: any) => {
      byType[alert.critical_type] = (byType[alert.critical_type] || 0) + 1;
    });

    return {
      total,
      acknowledged,
      unacknowledged,
      byType,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching critical value statistics', { error });
    throw new DatabaseError('Failed to fetch critical value statistics', { error });
  }
}
