import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { ActivityEntry, ActivityEntityType } from './dashboard-types';

// ============================================================================
// Dashboard Activity
// Aggregate timeline activity from various sources
// ============================================================================

/**
 * Get activity feed for dashboard
 */
export async function getActivityFeed(
  clinicId?: string,
  dateRange?: { start: string; end: string },
  limit: number = 50
): Promise<ActivityEntry[]> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const activities: ActivityEntry[] = [];

    // Fetch activities from various sources in parallel
    const [appointmentActivities, paymentActivities, invoiceActivities, laboratoryActivities] =
      await Promise.all([
        getAppointmentActivities(targetClinicId, dateRange, limit),
        getPaymentActivities(targetClinicId, dateRange, limit),
        getInvoiceActivities(targetClinicId, dateRange, limit),
        getLaboratoryActivities(targetClinicId, dateRange, limit),
      ]);

    activities.push(...appointmentActivities);
    activities.push(...paymentActivities);
    activities.push(...invoiceActivities);
    activities.push(...laboratoryActivities);

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, limit);
  } catch (error) {
    logger.error('Failed to fetch activity feed', { error, clinicId: targetClinicId });
    throw new DatabaseError('Failed to fetch activity feed', { error });
  }
}

/**
 * Get appointment activities
 */
async function getAppointmentActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, status, appointment_date, appointment_time, created_at, updated_at')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch appointment activities', { error });
      return [];
    }

    return (data || []).map((appointment) => ({
      id: `appointment_${appointment.id}`,
      entityType: ActivityEntityType.APPOINTMENT,
      entityId: appointment.id,
      action: getStatusAction(appointment.status),
      description: `Appointment ${getStatusAction(appointment.status).toLowerCase()} for patient ${appointment.patient_id}`,
      userId: appointment.doctor_id,
      timestamp: appointment.updated_at || appointment.created_at,
      metadata: {
        status: appointment.status,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
      },
    }));
  } catch (error) {
    logger.error('Failed to get appointment activities', { error });
    return [];
  }
}

/**
 * Get payment activities
 */
async function getPaymentActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('payments')
      .select('id, patient_id, amount, status, payment_method, created_at, updated_at')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch payment activities', { error });
      return [];
    }

    return (data || []).map((payment) => ({
      id: `payment_${payment.id}`,
      entityType: ActivityEntityType.PAYMENT,
      entityId: payment.id,
      action: 'Payment',
      description: `Payment of $${payment.amount} ${payment.status} via ${payment.payment_method}`,
      userId: payment.patient_id,
      timestamp: payment.updated_at || payment.created_at,
      metadata: {
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.payment_method,
      },
    }));
  } catch (error) {
    logger.error('Failed to get payment activities', { error });
    return [];
  }
}

/**
 * Get invoice activities
 */
async function getInvoiceActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('invoices')
      .select('id, patient_id, total_amount, status, created_at, updated_at')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch invoice activities', { error });
      return [];
    }

    return (data || []).map((invoice) => ({
      id: `invoice_${invoice.id}`,
      entityType: ActivityEntityType.INVOICE,
      entityId: invoice.id,
      action: 'Invoice',
      description: `Invoice of $${invoice.total_amount} ${invoice.status}`,
      userId: invoice.patient_id,
      timestamp: invoice.updated_at || invoice.created_at,
      metadata: {
        amount: invoice.total_amount,
        status: invoice.status,
      },
    }));
  } catch (error) {
    logger.error('Failed to get invoice activities', { error });
    return [];
  }
}

/**
 * Get laboratory activities
 */
async function getLaboratoryActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('laboratory_tests')
      .select('id, patient_id, test_name, status, created_at, updated_at')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch laboratory activities', { error });
      return [];
    }

    return (data || []).map((test) => ({
      id: `lab_${test.id}`,
      entityType: ActivityEntityType.LABORATORY,
      entityId: test.id,
      action: 'Laboratory Test',
      description: `Lab test "${test.test_name}" ${test.status}`,
      userId: test.patient_id,
      timestamp: test.updated_at || test.created_at,
      metadata: {
        testName: test.test_name,
        status: test.status,
      },
    }));
  } catch (error) {
    logger.error('Failed to get laboratory activities', { error });
    return [];
  }
}

/**
 * Get medical record activities (placeholder)
 */
async function getMedicalRecordActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  // Placeholder for medical record activities
  return [];
}

/**
 * Get prescription activities (placeholder)
 */
async function getPrescriptionActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  // Placeholder for prescription activities
  return [];
}

/**
 * Get notification activities (placeholder)
 */
async function getNotificationActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  // Placeholder for notification activities
  return [];
}

/**
 * Get authentication activities (placeholder)
 */
async function getAuthenticationActivities(
  clinicId: string,
  dateRange?: { start: string; end: string },
  limit: number = 20
): Promise<ActivityEntry[]> {
  // Placeholder for authentication activities
  return [];
}

/**
 * Get user-specific activity feed
 */
export async function getUserActivityFeed(
  userId: string,
  clinicId?: string,
  dateRange?: { start: string; end: string },
  limit: number = 50
): Promise<ActivityEntry[]> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const activities: ActivityEntry[] = [];

    // Get user's appointments
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, status, appointment_date, appointment_time, created_at, updated_at')
      .eq('clinic_id', targetClinicId)
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!appointmentError && appointments) {
      activities.push(
        ...appointments.map((appointment) => ({
          id: `appointment_${appointment.id}`,
          entityType: ActivityEntityType.APPOINTMENT,
          entityId: appointment.id,
          action: getStatusAction(appointment.status),
          description: `Appointment ${getStatusAction(appointment.status).toLowerCase()}`,
          userId,
          timestamp: appointment.updated_at || appointment.created_at,
          metadata: {
            status: appointment.status,
            appointmentDate: appointment.appointment_date,
          },
        }))
      );
    }

    // Get user's payments
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('id, patient_id, amount, status, payment_method, created_at, updated_at')
      .eq('clinic_id', targetClinicId)
      .eq('patient_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!paymentError && payments) {
      activities.push(
        ...payments.map((payment) => ({
          id: `payment_${payment.id}`,
          entityType: ActivityEntityType.PAYMENT,
          entityId: payment.id,
          action: 'Payment',
          description: `Payment of $${payment.amount} ${payment.status}`,
          userId,
          timestamp: payment.updated_at || payment.created_at,
          metadata: {
            amount: payment.amount,
            status: payment.status,
          },
        }))
      );
    }

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, limit);
  } catch (error) {
    logger.error('Failed to fetch user activity feed', { error, userId });
    throw new DatabaseError('Failed to fetch user activity feed', { error });
  }
}

/**
 * Get activity by entity type
 */
export async function getActivityByEntityType(
  entityType: ActivityEntityType,
  clinicId?: string,
  limit: number = 50
): Promise<ActivityEntry[]> {
  const targetClinicId = clinicId || await getUserClinicId();

  switch (entityType) {
    case ActivityEntityType.APPOINTMENT:
      return getAppointmentActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.PAYMENT:
      return getPaymentActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.INVOICE:
      return getInvoiceActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.LABORATORY:
      return getLaboratoryActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.MEDICAL_RECORD:
      return getMedicalRecordActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.PRESCRIPTION:
      return getPrescriptionActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.NOTIFICATION:
      return getNotificationActivities(targetClinicId, undefined, limit);
    case ActivityEntityType.AUTHENTICATION:
      return getAuthenticationActivities(targetClinicId, undefined, limit);
    default:
      return [];
  }
}

/**
 * Get activity count by entity type
 */
export async function getActivityCountByEntityType(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<Record<ActivityEntityType, number>> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const counts: Record<string, number> = {
      [ActivityEntityType.APPOINTMENT]: 0,
      [ActivityEntityType.PAYMENT]: 0,
      [ActivityEntityType.INVOICE]: 0,
      [ActivityEntityType.LABORATORY]: 0,
      [ActivityEntityType.MEDICAL_RECORD]: 0,
      [ActivityEntityType.PRESCRIPTION]: 0,
      [ActivityEntityType.NOTIFICATION]: 0,
      [ActivityEntityType.AUTHENTICATION]: 0,
    };

    // Count appointments
    let query = supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { count: appointmentCount } = await query;
    counts[ActivityEntityType.APPOINTMENT] = appointmentCount || 0;

    // Count payments
    query = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { count: paymentCount } = await query;
    counts[ActivityEntityType.PAYMENT] = paymentCount || 0;

    // Count invoices
    query = supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { count: invoiceCount } = await query;
    counts[ActivityEntityType.INVOICE] = invoiceCount || 0;

    // Count lab tests
    query = supabase
      .from('laboratory_tests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (dateRange) {
      query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
    }

    const { count: labCount } = await query;
    counts[ActivityEntityType.LABORATORY] = labCount || 0;

    return counts as Record<ActivityEntityType, number>;
  } catch (error) {
    logger.error('Failed to get activity count by entity type', { error });
    throw new DatabaseError('Failed to get activity count by entity type', { error });
  }
}

/**
 * Helper function to get action from status
 */
function getStatusAction(status: string): string {
  const statusActions: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    pending: 'Pending',
  };

  return statusActions[status] || status;
}
