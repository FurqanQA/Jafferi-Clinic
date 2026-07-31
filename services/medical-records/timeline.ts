import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadMedicalRecordPermission } from './medical-record-permissions';
import { TimelineEvent, TimelineFilters, TimelineEventType } from './medical-record-types';

/**
 * Generate chronological patient timeline
 * Combines appointments, medical records, diagnoses, prescriptions, invoices, and lab reports
 */
export async function generatePatientTimeline(
  patientId: string,
  filters?: TimelineFilters
): Promise<TimelineEvent[]> {
  // Validate permissions
  await validateReadMedicalRecordPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const events: TimelineEvent[] = [];

    // Fetch appointments
    if (!filters?.event_type || filters.event_type === 'appointment') {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, start_time, status, appointment_type, doctor_id')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .is('deleted_at', null);

      if (appointments) {
        for (const apt of appointments) {
          const eventDate = filters?.include_future ? apt.appointment_date : apt.appointment_date;
          if (shouldIncludeEvent(eventDate, filters)) {
            events.push({
              id: apt.id,
              type: 'appointment',
              date: apt.appointment_date,
              title: `Appointment - ${apt.appointment_type}`,
              description: `Status: ${apt.status}, Time: ${apt.start_time}`,
              related_id: apt.id,
              metadata: {
                doctor_id: apt.doctor_id,
                status: apt.status,
                appointment_type: apt.appointment_type,
              },
            });
          }
        }
      }
    }

    // Fetch medical records
    if (!filters?.event_type || filters.event_type === 'medical_record') {
      const { data: medicalRecords } = await supabase
        .from('medical_records')
        .select('id, visit_date, visit_type, status, doctor_id, chief_complaint')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .is('deleted_at', null);

      if (medicalRecords) {
        for (const mr of medicalRecords) {
          const eventDate = mr.visit_date;
          if (shouldIncludeEvent(eventDate, filters)) {
            const chiefComplaint = mr.chief_complaint?.primary_complaint || 'No complaint recorded';
            events.push({
              id: mr.id,
              type: 'medical_record',
              date: mr.visit_date,
              title: `Medical Record - ${mr.visit_type}`,
              description: `Status: ${mr.status}, Complaint: ${chiefComplaint}`,
              related_id: mr.id,
              metadata: {
                doctor_id: mr.doctor_id,
                status: mr.status,
                visit_type: mr.visit_type,
              },
            });
          }
        }
      }
    }

    // Fetch diagnoses (from medical records)
    if (!filters?.event_type || filters.event_type === 'diagnosis') {
      const { data: medicalRecords } = await supabase
        .from('medical_records')
        .select('id, visit_date, diagnosis, doctor_id')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .is('deleted_at', null)
        .not('diagnosis', 'is', null);

      if (medicalRecords) {
        for (const mr of medicalRecords) {
          const diagnosis = mr.diagnosis as any;
          if (diagnosis?.primary_diagnosis) {
            const eventDate = mr.visit_date;
            if (shouldIncludeEvent(eventDate, filters)) {
              events.push({
                id: `${mr.id}-diagnosis`,
                type: 'diagnosis',
                date: mr.visit_date,
                title: `Diagnosis - ${diagnosis.primary_diagnosis}`,
                description: diagnosis.icd_10_code ? `ICD-10: ${diagnosis.icd_10_code}` : '',
                related_id: mr.id,
                metadata: {
                  doctor_id: mr.doctor_id,
                  diagnosis: diagnosis.primary_diagnosis,
                  icd_10_code: diagnosis.icd_10_code,
                },
              });
            }
          }
        }
      }
    }

    // Fetch prescriptions (placeholder - will need prescriptions table)
    if (!filters?.event_type || filters.event_type === 'prescription') {
      // TODO: Implement when prescriptions table is available
      // This is a placeholder for future integration
    }

    // Fetch invoices (placeholder - will need invoices table)
    if (!filters?.event_type || filters.event_type === 'invoice') {
      // TODO: Implement when invoices table is available
      // This is a placeholder for future integration
    }

    // Fetch lab reports (placeholder - will need lab_reports table)
    if (!filters?.event_type || filters.event_type === 'lab_report') {
      // TODO: Implement when lab_reports table is available
      // This is a placeholder for future integration
    }

    // Sort events by date (most recent first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error generating patient timeline', { error, patientId, filters });
    throw new DatabaseError('Failed to generate patient timeline', { error });
  }
}

/**
 * Check if an event should be included based on filters
 */
function shouldIncludeEvent(eventDate: string, filters?: TimelineFilters): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDateObj = new Date(eventDate);

  // Apply date range filters
  if (filters?.date_from) {
    const fromDate = new Date(filters.date_from);
    if (eventDateObj < fromDate) {
      return false;
    }
  }

  if (filters?.date_to) {
    const toDate = new Date(filters.date_to);
    if (eventDateObj > toDate) {
      return false;
    }
  }

  // If include_future is false, exclude future events
  if (filters?.include_future === false) {
    if (eventDateObj > today) {
      return false;
    }
  }

  return true;
}

/**
 * Get upcoming events for a patient
 */
export async function getUpcomingEvents(patientId: string): Promise<TimelineEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  
  return generatePatientTimeline(patientId, {
    date_from: today,
    include_future: true,
  });
}

/**
 * Get past events for a patient
 */
export async function getPastEvents(patientId: string): Promise<TimelineEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  
  return generatePatientTimeline(patientId, {
    date_to: today,
    include_future: false,
  });
}

/**
 * Get timeline summary statistics
 */
export async function getTimelineSummary(patientId: string): Promise<{
  totalAppointments: number;
  totalMedicalRecords: number;
  totalDiagnoses: number;
  upcomingAppointments: number;
  lastVisit?: string;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Count appointments
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null);

    // Count medical records
    const { count: medicalRecordCount } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null);

    // Count diagnoses (medical records with primary diagnosis)
    const { count: diagnosisCount } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .not('diagnosis->primary_diagnosis', 'is', null);

    // Count upcoming appointments
    const today = new Date().toISOString().split('T')[0];
    const { count: upcomingCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .gte('appointment_date', today)
      .is('deleted_at', null);

    // Get last visit date
    const { data: lastVisit } = await supabase
      .from('medical_records')
      .select('visit_date')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .limit(1)
      .single();

    return {
      totalAppointments: appointmentCount || 0,
      totalMedicalRecords: medicalRecordCount || 0,
      totalDiagnoses: diagnosisCount || 0,
      upcomingAppointments: upcomingCount || 0,
      lastVisit: lastVisit?.visit_date,
    };
  } catch (error) {
    logger.error('Unexpected error getting timeline summary', { error, patientId });
    throw new DatabaseError('Failed to get timeline summary', { error });
  }
}

/**
 * Placeholder for AI clinical summary generation
 * This function is prepared for future AI integration
 */
export async function generateAIClinicalSummary(
  patientId: string,
  timelineEvents: TimelineEvent[]
): Promise<string> {
  // TODO: Integrate with AI service for clinical summary generation
  // This is a placeholder for future AI integration
  return '[AI Generated] Clinical summary will be generated here based on patient timeline';
}

/**
 * Placeholder for AI risk alerts
 * This function is prepared for future AI integration
 */
export async function generateAIRiskAlerts(
  patientId: string,
  timelineEvents: TimelineEvent[]
): Promise<string[]> {
  // TODO: Integrate with AI service for risk alert generation
  // This is a placeholder for future AI integration
  return [
    '[AI Generated] Risk alert 1',
    '[AI Generated] Risk alert 2',
  ];
}
