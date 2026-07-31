import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { objectsToCSV } from '../core/export-csv';
import { logger } from '../shared/logger';
import { validateExportDoctorsPermission } from './doctor-permissions';
import { DoctorExportData, Doctor } from './doctor-types';

/**
 * Export doctors as CSV-ready data
 */
export async function exportDoctors(params?: {
  status?: string;
  specialization?: string;
  department?: string;
  created_from?: string;
  created_to?: string;
}): Promise<DoctorExportData[]> {
  // Validate permissions
  await validateExportDoctorsPermission();

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    // Build query
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters if provided
    if (params) {
      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.specialization) {
        query = query.ilike('specialization', `%${params.specialization}%`);
      }

      if (params.department) {
        query = query.ilike('department', `%${params.department}%`);
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
      logger.error('Failed to export doctors', { error, clinicId, params });
      throw new DatabaseError('Failed to export doctors', { error });
    }

    // Transform to export format
    const exportData = (data || []).map((doctor: Doctor) => ({
      doctor_number: doctor.doctor_number,
      full_name: `${doctor.first_name} ${doctor.last_name}`,
      email: doctor.email,
      phone: doctor.phone,
      license_number: doctor.license_number,
      specialization: doctor.specialization,
      department: doctor.department || '',
      qualification: doctor.qualification || '',
      experience_years: doctor.experience_years || 0,
      gender: doctor.gender || '',
      date_of_birth: doctor.date_of_birth || '',
      consultation_fee: doctor.consultation_fee || 0,
      languages_spoken: doctor.languages_spoken ? doctor.languages_spoken.join(', ') : '',
      status: doctor.status,
      availability: doctor.availability,
      created_at: doctor.created_at,
    }));

    logger.info('Doctors exported successfully', { count: exportData.length, clinicId });
    return exportData;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting doctors', { error, clinicId, params });
    throw new DatabaseError('Failed to export doctors', { error });
  }
}

/**
 * Convert export data to CSV string
 */
export function doctorsToCSV(data: DoctorExportData[]): string {
  const headers = [
    'Doctor Number',
    'Full Name',
    'Email',
    'Phone',
    'License Number',
    'Specialization',
    'Department',
    'Qualification',
    'Experience Years',
    'Gender',
    'Date of Birth',
    'Consultation Fee',
    'Languages Spoken',
    'Status',
    'Availability',
    'Created At',
  ];

  return objectsToCSV(headers, data, (doctor) => [
    doctor.doctor_number,
    doctor.full_name,
    doctor.email,
    doctor.phone,
    doctor.license_number,
    doctor.specialization,
    doctor.department,
    doctor.qualification,
    doctor.experience_years,
    doctor.gender,
    doctor.date_of_birth,
    doctor.consultation_fee,
    doctor.languages_spoken,
    doctor.status,
    doctor.availability,
    doctor.created_at,
  ]);
}
