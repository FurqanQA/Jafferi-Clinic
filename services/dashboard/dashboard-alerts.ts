import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { AlertData, AlertSeverity, ActivityEntityType } from './dashboard-types';

// ============================================================================
// Dashboard Alerts
// Aggregate alerts from various sources
// ============================================================================

/**
 * Get alerts for dashboard
 */
export async function getAlerts(clinicId?: string, limit: number = 20): Promise<AlertData[]> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const alerts: AlertData[] = [];

    // Critical laboratory results
    const labAlerts = await getCriticalLaboratoryAlerts(targetClinicId);
    alerts.push(...labAlerts);

    // Pending payment alerts
    const paymentAlerts = await getPendingPaymentAlerts(targetClinicId);
    alerts.push(...paymentAlerts);

    // Failed payment alerts
    const failedPaymentAlerts = await getFailedPaymentAlerts(targetClinicId);
    alerts.push(...failedPaymentAlerts);

    // Overdue invoice alerts
    const invoiceAlerts = await getOverdueInvoiceAlerts(targetClinicId);
    alerts.push(...invoiceAlerts);

    // Missed appointment alerts
    const appointmentAlerts = await getMissedAppointmentAlerts(targetClinicId);
    alerts.push(...appointmentAlerts);

    // Sort by severity and date
    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return alerts.slice(0, limit);
  } catch (error) {
    logger.error('Failed to fetch alerts', { error, clinicId: targetClinicId });
    throw new DatabaseError('Failed to fetch alerts', { error });
  }
}

/**
 * Get critical laboratory result alerts
 */
async function getCriticalLaboratoryAlerts(clinicId: string): Promise<AlertData[]> {
  const supabase = getSupabaseClient();

  try {
    const { data: criticalResults, error } = await supabase
      .from('laboratory_results')
      .select('id, test_id, patient_id, is_critical, is_reviewed, created_at')
      .eq('clinic_id', clinicId)
      .eq('is_critical', true)
      .eq('is_reviewed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch critical lab results', { error });
      return [];
    }

    return (criticalResults || []).map((result) => ({
      id: `lab_${result.id}`,
      severity: AlertSeverity.CRITICAL,
      title: 'Critical Laboratory Result',
      message: `Critical lab result requires immediate review for test ${result.test_id}`,
      entityType: ActivityEntityType.LABORATORY,
      entityId: result.id,
      actionUrl: `/laboratory/results/${result.id}`,
      createdAt: result.created_at,
      isResolved: false,
      metadata: {
        patientId: result.patient_id,
        testId: result.test_id,
      },
    }));
  } catch (error) {
    logger.error('Failed to get critical lab alerts', { error });
    return [];
  }
}

/**
 * Get pending payment alerts
 */
async function getPendingPaymentAlerts(clinicId: string): Promise<AlertData[]> {
  const supabase = getSupabaseClient();

  try {
    const { data: pendingPayments, error } = await supabase
      .from('payments')
      .select('id, amount, patient_id, created_at')
      .eq('clinic_id', clinicId)
      .eq('status', 'pending')
      .gte('amount', 1000) // Only alert for significant amounts
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch pending payments', { error });
      return [];
    }

    return (pendingPayments || []).map((payment) => ({
      id: `payment_${payment.id}`,
      severity: AlertSeverity.HIGH,
      title: 'Pending Payment',
      message: `Payment of $${payment.amount} is pending`,
      entityType: ActivityEntityType.PAYMENT,
      entityId: payment.id,
      actionUrl: `/payments/${payment.id}`,
      createdAt: payment.created_at,
      isResolved: false,
      metadata: {
        patientId: payment.patient_id,
        amount: payment.amount,
      },
    }));
  } catch (error) {
    logger.error('Failed to get pending payment alerts', { error });
    return [];
  }
}

/**
 * Get failed payment alerts
 */
async function getFailedPaymentAlerts(clinicId: string): Promise<AlertData[]> {
  const supabase = getSupabaseClient();

  try {
    const { data: failedPayments, error } = await supabase
      .from('payments')
      .select('id, amount, patient_id, created_at')
      .eq('clinic_id', clinicId)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch failed payments', { error });
      return [];
    }

    return (failedPayments || []).map((payment) => ({
      id: `failed_payment_${payment.id}`,
      severity: AlertSeverity.HIGH,
      title: 'Failed Payment',
      message: `Payment of $${payment.amount} failed`,
      entityType: ActivityEntityType.PAYMENT,
      entityId: payment.id,
      actionUrl: `/payments/${payment.id}`,
      createdAt: payment.created_at,
      isResolved: false,
      metadata: {
        patientId: payment.patient_id,
        amount: payment.amount,
      },
    }));
  } catch (error) {
    logger.error('Failed to get failed payment alerts', { error });
    return [];
  }
}

/**
 * Get overdue invoice alerts
 */
async function getOverdueInvoiceAlerts(clinicId: string): Promise<AlertData[]> {
  const supabase = getSupabaseClient();

  try {
    const now = new Date();
    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .select('id, total_amount, patient_id, due_date, created_at')
      .eq('clinic_id', clinicId)
      .eq('status', 'pending')
      .lt('due_date', now.toISOString())
      .order('due_date', { ascending: true })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch overdue invoices', { error });
      return [];
    }

    return (overdueInvoices || []).map((invoice) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: `invoice_${invoice.id}`,
        severity: daysOverdue > 30 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
        title: 'Overdue Invoice',
        message: `Invoice overdue by ${daysOverdue} days - $${invoice.total_amount}`,
        entityType: ActivityEntityType.INVOICE,
        entityId: invoice.id,
        actionUrl: `/invoices/${invoice.id}`,
        createdAt: invoice.created_at,
        isResolved: false,
        metadata: {
          patientId: invoice.patient_id,
          amount: invoice.total_amount,
          dueDate: invoice.due_date,
          daysOverdue,
        },
      };
    });
  } catch (error) {
    logger.error('Failed to get overdue invoice alerts', { error });
    return [];
  }
}

/**
 * Get missed appointment alerts
 */
async function getMissedAppointmentAlerts(clinicId: string): Promise<AlertData[]> {
  const supabase = getSupabaseClient();

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: missedAppointments, error } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, appointment_date, appointment_time, created_at')
      .eq('clinic_id', clinicId)
      .eq('status', 'no_show')
      .gte('appointment_date', yesterday.toISOString())
      .order('appointment_date', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch missed appointments', { error });
      return [];
    }

    return (missedAppointments || []).map((appointment) => ({
      id: `missed_${appointment.id}`,
      severity: AlertSeverity.MEDIUM,
      title: 'Missed Appointment',
      message: `Patient missed appointment on ${appointment.appointment_date}`,
      entityType: ActivityEntityType.APPOINTMENT,
      entityId: appointment.id,
      actionUrl: `/appointments/${appointment.id}`,
      createdAt: appointment.created_at,
      isResolved: false,
      metadata: {
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
      },
    }));
  } catch (error) {
    logger.error('Failed to get missed appointment alerts', { error });
    return [];
  }
}

/**
 * Get system alerts (placeholder for future implementation)
 */
async function getSystemAlerts(clinicId: string): Promise<AlertData[]> {
  // Placeholder for system health alerts
  // Would include database status, API status, backup status, etc.
  return [];
}

/**
 * Get subscription expiry alert (placeholder)
 */
async function getSubscriptionExpiryAlert(clinicId: string): Promise<AlertData[]> {
  // Placeholder for subscription expiry alerts
  // Would check subscription status and expiry date
  return [];
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Parse alert type and entity ID
    const [type, entityId] = alertId.split('_');

    switch (type) {
      case 'lab':
        await supabase
          .from('laboratory_results')
          .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
          .eq('id', entityId);
        break;

      case 'invoice':
        // Invoice resolution would be handled by payment
        break;

      case 'payment':
      case 'failed_payment':
        // Payment resolution would be handled by retry or manual processing
        break;

      case 'missed':
        // Missed appointment resolution would be handled by rescheduling
        break;

      default:
        logger.warn('Unknown alert type for resolution', { alertId });
    }

    logger.info('Alert resolved', { alertId });
  } catch (error) {
    logger.error('Failed to resolve alert', { error, alertId });
    throw new DatabaseError('Failed to resolve alert', { error });
  }
}

/**
 * Get alert count by severity
 */
export async function getAlertCountBySeverity(clinicId?: string): Promise<Record<AlertSeverity, number>> {
  const targetClinicId = clinicId || await getUserClinicId();
  const alerts = await getAlerts(targetClinicId, 100);

  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  alerts.forEach((alert) => {
    counts[alert.severity] = (counts[alert.severity] || 0) + 1;
  });

  return counts as Record<AlertSeverity, number>;
}

/**
 * Get unresolved alert count
 */
export async function getUnresolvedAlertCount(clinicId?: string): Promise<number> {
  const targetClinicId = clinicId || await getUserClinicId();
  const alerts = await getAlerts(targetClinicId, 100);

  return alerts.filter((a) => !a.isResolved).length;
}
