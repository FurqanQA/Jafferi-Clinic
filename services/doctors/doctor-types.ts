/**
 * Doctor service types
 */

/**
 * Doctor gender
 */
export type DoctorGender = 'male' | 'female' | 'other';

/**
 * Doctor status
 */
export type DoctorStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';

/**
 * Doctor availability
 */
export type DoctorAvailability = 'available' | 'busy' | 'unavailable' | 'on_vacation';

/**
 * Doctor data
 */
export interface Doctor {
  id: string;
  clinic_id: string;
  user_id?: string;
  doctor_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  specialization: string;
  department?: string;
  qualification?: string;
  experience_years?: number;
  gender?: DoctorGender;
  date_of_birth?: string;
  consultation_fee?: number;
  biography?: string;
  languages_spoken?: string[];
  working_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  avatar_url?: string;
  status: DoctorStatus;
  availability: DoctorAvailability;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create doctor input
 */
export interface CreateDoctorInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  specialization: string;
  department?: string;
  qualification?: string;
  experience_years?: number;
  gender?: DoctorGender;
  date_of_birth?: string;
  consultation_fee?: number;
  biography?: string;
  languages_spoken?: string[];
  working_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

/**
 * Update doctor input
 */
export interface UpdateDoctorInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  specialization?: string;
  department?: string;
  qualification?: string;
  experience_years?: number;
  gender?: DoctorGender;
  date_of_birth?: string;
  consultation_fee?: number;
  biography?: string;
  languages_spoken?: string[];
  working_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  avatar_url?: string;
  status?: DoctorStatus;
  availability?: DoctorAvailability;
}

/**
 * Doctor list filters
 */
export interface DoctorFilters {
  status?: DoctorStatus;
  availability?: DoctorAvailability;
  specialization?: string;
  department?: string;
  gender?: DoctorGender;
  experience_min?: number;
  experience_max?: number;
  created_from?: string;
  created_to?: string;
}

/**
 * Doctor list sorting
 */
export type DoctorSortBy = 
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'experience'
  | 'consultation_fee'
  | 'specialization';

/**
 * Doctor search query
 */
export interface DoctorSearchParams {
  query?: string;
  filters?: DoctorFilters;
  sortBy?: DoctorSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Doctor search result
 */
export interface DoctorSearchResult {
  data: Doctor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Doctor export data
 */
export interface DoctorExportData {
  doctor_number: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  specialization: string;
  department: string;
  qualification: string;
  experience_years: number;
  gender: string;
  date_of_birth: string;
  consultation_fee: number;
  languages_spoken: string;
  status: string;
  availability: string;
  created_at: string;
}
