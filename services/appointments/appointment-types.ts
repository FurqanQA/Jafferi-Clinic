/**
 * Appointment service types
 */

/**
 * Appointment status - represents the lifecycle state
 */
export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

/**
 * Appointment type
 */
export type AppointmentType = 
  | 'general_consultation'
  | 'follow_up'
  | 'emergency'
  | 'procedure'
  | 'vaccination'
  | 'laboratory'
  | 'telemedicine'
  | 'walk_in'
  | 'routine_checkup'
  | 'specialist_consultation';

/**
 * Visit type
 */
export type VisitType = 
  | 'new_patient'
  | 'existing_patient'
  | 'returning_patient';

/**
 * Priority level
 */
export type Priority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'
  | 'emergency';

/**
 * Appointment source
 */
export type AppointmentSource = 
  | 'web'
  | 'phone'
  | 'walk_in'
  | 'referral'
  | 'admin';

/**
 * Time slot for availability
 */
export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
  available: boolean;
}

/**
 * Daily availability
 */
export interface DailyAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

/**
 * Appointment data
 */
export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  department_id?: string;
  appointment_number: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number; // in minutes
  appointment_type: AppointmentType;
  visit_type: VisitType;
  priority: Priority;
  status: AppointmentStatus;
  reason_for_visit?: string;
  symptoms?: string;
  notes?: string;
  internal_notes?: string;
  color_tag?: string;
  source: AppointmentSource;
  created_by?: string;
  updated_by?: string;
  confirmed_at?: string;
  checked_in_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  rescheduled_from_id?: string;
  rescheduled_to_id?: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create appointment input
 */
export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id: string;
  department_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  appointment_type: AppointmentType;
  visit_type: VisitType;
  priority: Priority;
  reason_for_visit?: string;
  symptoms?: string;
  notes?: string;
  internal_notes?: string;
  color_tag?: string;
  source?: AppointmentSource;
}

/**
 * Update appointment input
 */
export interface UpdateAppointmentInput {
  doctor_id?: string;
  department_id?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  appointment_type?: AppointmentType;
  visit_type?: VisitType;
  priority?: Priority;
  reason_for_visit?: string;
  symptoms?: string;
  notes?: string;
  internal_notes?: string;
  color_tag?: string;
}

/**
 * Appointment list filters
 */
export interface AppointmentFilters {
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  visit_type?: VisitType;
  priority?: Priority;
  doctor_id?: string;
  patient_id?: string;
  department_id?: string;
  date_from?: string;
  date_to?: string;
  today?: boolean;
  tomorrow?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  upcoming?: boolean;
  past?: boolean;
}

/**
 * Appointment list sorting
 */
export type AppointmentSortBy = 
  | 'appointment_date'
  | 'doctor'
  | 'patient'
  | 'priority'
  | 'status'
  | 'created_at'
  | 'newest'
  | 'oldest';

/**
 * Appointment search query
 */
export interface AppointmentSearchParams {
  query?: string;
  filters?: AppointmentFilters;
  sortBy?: AppointmentSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Appointment search result
 */
export interface AppointmentSearchResult {
  data: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Appointment export data
 */
export interface AppointmentExportData {
  appointment_number: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  appointment_type: string;
  visit_type: string;
  priority: string;
  status: string;
  reason_for_visit: string;
  source: string;
  created_at: string;
}

/**
 * Calendar view type
 */
export type CalendarView = 
  | 'day'
  | 'week'
  | 'month'
  | 'agenda';

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  status: AppointmentStatus;
  color_tag?: string;
}

/**
 * Reminder type
 */
export type ReminderType = 
  | 'appointment_reminder'
  | 'confirmation_reminder'
  | 'follow_up_reminder'
  | 'upcoming_reminder'
  | 'missed_appointment_reminder';

/**
 * Reminder payload
 */
export interface ReminderPayload {
  type: ReminderType;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  scheduled_for: string;
  data: Record<string, unknown>;
}

/**
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled', 'rescheduled'],
  confirmed: ['checked_in', 'cancelled', 'rescheduled'],
  checked_in: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: ['scheduled', 'confirmed', 'cancelled'],
};
