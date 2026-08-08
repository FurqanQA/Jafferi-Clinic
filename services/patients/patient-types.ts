/**
 * Patient service types
 */

/**
 * Patient gender - matches database gender_enum
 */
export type PatientGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/**
 * Patient blood type - matches database blood_type field
 */
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/**
 * Patient status
 */
export type PatientStatus = 'active' | 'inactive' | 'archived';

/**
 * Patient data
 */
export interface Patient {
  id: string;
  clinic_id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: PatientGender;
  blood_type?: BloodType;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  national_id?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  notes?: string;
  avatar_url?: string;
  status: PatientStatus;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create patient input
 */
export interface CreatePatientInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: PatientGender;
  phone: string;
  blood_type?: BloodType;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  national_id?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  notes?: string;
}

/**
 * Update patient input
 */
export interface UpdatePatientInput {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: PatientGender;
  blood_type?: BloodType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  national_id?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  notes?: string;
  avatar_url?: string;
}

/**
 * Patient list filters
 */
export interface PatientFilters {
  status?: PatientStatus;
  gender?: PatientGender;
  blood_type?: BloodType;
  created_from?: string;
  created_to?: string;
  age_min?: number;
  age_max?: number;
  doctor_id?: string;
}

/**
 * Patient list sorting
 */
export type PatientSortBy = 
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'date_of_birth'
  | 'last_visit';

/**
 * Patient search query
 */
export interface PatientSearchParams {
  query?: string;
  filters?: PatientFilters;
  sortBy?: PatientSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Patient search result
 */
export interface PatientSearchResult {
  data: Patient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Patient export data
 */
export interface PatientExportData {
  patient_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  national_id: string;
  insurance_provider: string;
  insurance_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  status: string;
  created_at: string;
}
