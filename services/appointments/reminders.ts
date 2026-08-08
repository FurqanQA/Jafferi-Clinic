import { getSupabaseClient } from '../core/client';
import { getUserClinicId } from '../core/auth';
import { DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { ReminderPayload, ReminderType, Appointment } from './appointment-types';

/**
 * Create appointment reminder payload
 * This prepares the reminder data for future integration with Email, SMS, or WhatsApp
 */
export async function createAppointmentReminder(
  appointmentId: string,
  reminderType: ReminderType,
  scheduledFor: Date
): Promise<ReminderPayload> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(first_name, last_name, email, phone),
        doctors!inner(first_name, last_name),
        clinics!inner(name, phone, email)
      `)
      .eq('id', appointmentId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !appointment) {
      throw new DatabaseError('Appointment not found', { error });
    }

    const apt = appointment as Appointment;

    const payload: ReminderPayload = {
      type: reminderType,
      appointment_id: appointmentId,
      patient_id: apt.patient_id,
      doctor_id: apt.doctor_id,
      clinic_id: clinicId,
      scheduled_for: scheduledFor.toISOString(),
      data: {
        patient_name: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'Unknown',
        patient_email: apt.patients?.email,
        patient_phone: apt.patients?.phone,
        doctor_name: apt.doctors ? `${apt.doctors.first_name} ${apt.doctors.last_name}` : 'Unknown',
        clinic_name: apt.clinics?.name,
        clinic_phone: apt.clinics?.phone,
        clinic_email: apt.clinics?.email,
        appointment_date: apt.scheduled_date,
        appointment_time: apt.scheduled_time,
        appointment_type: apt.appointment_type,
        appointment_number: apt.appointment_number,
        reason_for_visit: apt.reason,
      },
    };

    return payload;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating appointment reminder', { error, appointmentId });
    throw new DatabaseError('Failed to create appointment reminder', { error });
  }
}

/**
 * Create confirmation reminder payload
 */
export async function createConfirmationReminder(
  appointmentId: string,
  scheduledFor: Date
): Promise<ReminderPayload> {
  return createAppointmentReminder(appointmentId, 'confirmation_reminder', scheduledFor);
}

/**
 * Create follow-up reminder payload
 */
export async function createFollowUpReminder(
  appointmentId: string,
  scheduledFor: Date
): Promise<ReminderPayload> {
  return createAppointmentReminder(appointmentId, 'follow_up_reminder', scheduledFor);
}

/**
 * Create upcoming appointment reminder payload
 */
export async function createUpcomingReminder(
  appointmentId: string,
  scheduledFor: Date
): Promise<ReminderPayload> {
  return createAppointmentReminder(appointmentId, 'upcoming_reminder', scheduledFor);
}

/**
 * Create missed appointment reminder payload
 */
export async function createMissedAppointmentReminder(
  appointmentId: string,
  scheduledFor: Date
): Promise<ReminderPayload> {
  return createAppointmentReminder(appointmentId, 'missed_appointment_reminder', scheduledFor);
}

/**
 * Schedule reminder for appointment
 * This function prepares the reminder and stores it for future processing
 * Integration point for Email, SMS, WhatsApp services
 */
export async function scheduleReminder(
  appointmentId: string,
  reminderType: ReminderType,
  scheduledFor: Date
): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const payload = await createAppointmentReminder(appointmentId, reminderType, scheduledFor);

    // Store reminder in database for future processing
    const { error } = await supabase
      .from('appointment_reminders')
      .insert({
        clinic_id: clinicId,
        appointment_id: appointmentId,
        reminder_type: reminderType,
        scheduled_for: scheduledFor.toISOString(),
        payload: payload as unknown, // JSONB column
        status: 'pending',
      });

    if (error) {
      throw new DatabaseError('Failed to schedule reminder', { error });
    }

    logger.info('Reminder scheduled successfully', { appointmentId, reminderType, scheduledFor });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error scheduling reminder', { error, appointmentId });
    throw new DatabaseError('Failed to schedule reminder', { error });
  }
}

/**
 * Schedule multiple reminders for an appointment
 */
export async function scheduleAppointmentReminders(appointmentId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Fetch appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('scheduled_date, scheduled_time')
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new DatabaseError('Appointment not found', { error });
    }

    const apt = appointment as Appointment;
    const appointmentDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`);

    // Schedule confirmation reminder (immediately after booking)
    await scheduleReminder(appointmentId, 'confirmation_reminder', new Date());

    // Schedule upcoming reminder (24 hours before)
    const upcomingReminderTime = new Date(appointmentDateTime);
    upcomingReminderTime.setHours(upcomingReminderTime.getHours() - 24);
    if (upcomingReminderTime > new Date()) {
      await scheduleReminder(appointmentId, 'upcoming_reminder', upcomingReminderTime);
    }

    // Schedule appointment reminder (2 hours before)
    const appointmentReminderTime = new Date(appointmentDateTime);
    appointmentReminderTime.setHours(appointmentReminderTime.getHours() - 2);
    if (appointmentReminderTime > new Date()) {
      await scheduleReminder(appointmentId, 'appointment_reminder', appointmentReminderTime);
    }

    logger.info('All reminders scheduled for appointment', { appointmentId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error scheduling appointment reminders', { error, appointmentId });
    throw new DatabaseError('Failed to schedule appointment reminders', { error });
  }
}

/**
 * Cancel pending reminders for an appointment
 */
export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('appointment_reminders')
      .update({ status: 'cancelled' })
      .eq('appointment_id', appointmentId)
      .eq('clinic_id', clinicId)
      .eq('status', 'pending');

    if (error) {
      throw new DatabaseError('Failed to cancel reminders', { error });
    }

    logger.info('Reminders cancelled for appointment', { appointmentId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling reminders', { error, appointmentId });
    throw new DatabaseError('Failed to cancel reminders', { error });
  }
}

/**
 * Get pending reminders for processing
 * This is used by a background job to send reminders
 */
export async function getPendingReminders(limit: number = 100): Promise<ReminderPayload[]> {
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointment_reminders')
      .select('payload')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to fetch pending reminders', { error });
    }

    return (data || []).map((r: { payload: ReminderPayload }) => r.payload);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pending reminders', { error });
    throw new DatabaseError('Failed to fetch pending reminders', { error });
  }
}

/**
 * Mark reminder as sent
 */
export async function markReminderAsSent(reminderId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('appointment_reminders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', reminderId);

    if (error) {
      throw new DatabaseError('Failed to mark reminder as sent', { error });
    }

    logger.info('Reminder marked as sent', { reminderId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking reminder as sent', { error, reminderId });
    throw new DatabaseError('Failed to mark reminder as sent', { error });
  }
}
