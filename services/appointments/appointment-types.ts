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
 * Appointment type - matches database appointment_type_enum
 */
export type AppointmentType = 
  | 'consultation'
  | 'follow_up'
  | 'emergency'
  | 'procedure';

/**
 * Payment method - matches database payment_method_enum
 */
export type PaymentMethod = 
  | 'cash'
  | 'card'
  | 'insurance'
  | 'transfer'
  | 'check';

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
 * Calendar/agenda query result (subset of Appointment with joined relations)
 */
export interface CalendarAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  color_tag?: string;
  patient_id: string;
  doctor_id: string;
  appointment_number?: string;
  duration_minutes?: number;
  appointment_type?: string;
  visit_type?: string;
  priority?: string;
  reason?: string;
  source?: string;
  created_at?: string;
  patients: {
    first_name: string;
    last_name: string;
  }[];
  doctors: {
    first_name: string;
    last_name: string;
  }[];
  departments?: {
    name?: string;
  }[];
}

/**
 * Appointment data - matches database schema
 */
export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_number: string;
  status_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  reason?: string;
  symptoms?: string;
  notes?: string;
  is_virtual: boolean;
  virtual_meeting_link?: string;
  fee?: number;
  is_paid: boolean;
  payment_method?: PaymentMethod;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  check_in_time?: string;
  start_time?: string;
  end_time_actual?: string;
  no_show: boolean;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at: string | null;
  // Additional fields from database
  appointment_date?: string;
  status?: string;
  color_tag?: string;
  visit_type?: VisitType;
  priority?: Priority;
  source?: AppointmentSource;
  // Joined relations
  patients?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  doctors?: {
    first_name: string;
    last_name: string;
  };
  clinics?: {
    name: string;
    phone?: string;
    email?: string;
  };
  departments?: {
    name?: string;
  };
}

/**
 * Create appointment input - matches database schema
 */
export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time?: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  reason?: string;
  symptoms?: string;
  notes?: string;
  is_virtual?: boolean;
  virtual_meeting_link?: string;
  fee?: number;
  payment_method?: PaymentMethod;
}

/**
 * Update appointment input - matches database schema
 */
export interface UpdateAppointmentInput {
  doctor_id?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  end_time?: string;
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  reason?: string;
  symptoms?: string;
  notes?: string;
  is_virtual?: boolean;
  virtual_meeting_link?: string;
  fee?: number;
  is_paid?: boolean;
  payment_method?: PaymentMethod;
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
