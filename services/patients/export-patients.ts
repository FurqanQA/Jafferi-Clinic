import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { objectsToCSV } from '../core/export-csv';
import { logger } from '../shared/logger';
import { validateExportPatientsPermission } from './patient-permissions';
import { PatientExportData, Patient } from './patient-types';

/**
 * Export patients as CSV-ready data
 */
export async function exportPatients(params?: {
  status?: string;
  created_from?: string;
  created_to?: string;
}): Promise<PatientExportData[]> {
  // Validate permissions
  await validateExportPatientsPermission();

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    // Build query
    let query = supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters if provided
    if (params) {
      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.created_from) {
        query = query.gte('created_at', params.created_from);
      }

      if (params.created_to) {
        query = query.lte('created_at', params.created_to);
      }
    }

    // Order by name for export
    query = query.order('first_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to export patients', { error, clinicId, params });
      throw new DatabaseError('Failed to export patients', { error });
    }

    // Transform to export format
    const exportData = (data || []).map((patient: Patient) => ({
      medical_record_number: patient.medical_record_number,
      full_name: `${patient.first_name} ${patient.last_name}`,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group || '',
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      postal_code: patient.postal_code || '',
      country: patient.country || '',
      national_id: patient.national_id || '',
      insurance_provider: patient.insurance_provider || '',
      insurance_number: patient.insurance_number || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      emergency_contact_relationship: patient.emergency_contact_relationship || '',
      status: patient.status,
      created_at: patient.created_at,
    }));

    logger.info('Patients exported successfully', { count: exportData.length, clinicId });
    return exportData;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting patients', { error, clinicId, params });
    throw new DatabaseError('Failed to export patients', { error });
  }
}

/**
 * Convert export data to CSV string
 */
export function patientsToCSV(data: PatientExportData[]): string {
  const headers = [
    'Medical Record Number',
    'Full Name',
    'Date of Birth',
    'Gender',
    'Blood Group',
    'Phone',
    'Email',
    'Address',
    'City',
    'State',
    'Postal Code',
    'Country',
    'National ID',
    'Insurance Provider',
    'Insurance Number',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Emergency Contact Relationship',
    'Status',
    'Created At',
  ];

  return objectsToCSV(headers, data, (patient) => [
    patient.medical_record_number,
    patient.full_name,
    patient.date_of_birth,
    patient.gender,
    patient.blood_group,
    patient.phone,
    patient.email,
    patient.address,
    patient.city,
    patient.state,
    patient.postal_code,
    patient.country,
    patient.national_id,
    patient.insurance_provider,
    patient.insurance_number,
    patient.emergency_contact_name,
    patient.emergency_contact_phone,
    patient.emergency_contact_relationship,
    patient.status,
    patient.created_at,
  ]);
}
