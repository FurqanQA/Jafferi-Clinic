import { getSupabaseClient } from './client';
import { getUserClinicId, getUserRole } from './auth';
import { TenantError } from './errors';

/**
 * Get current clinic for the authenticated user
 */
export async function getCurrentClinic() {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single();
  
  if (error) {
    throw new TenantError('Failed to fetch clinic', { error });
  }
  
  if (!clinic) {
    throw new TenantError('Clinic not found');
  }
  
  return clinic;
}

/**
 * Validate that a resource belongs to the current user's clinic
 */
export async function validateClinicAccess(resourceId: string, table: string): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from(table)
    .select('clinic_id')
    .eq('id', resourceId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.clinic_id === clinicId;
}

/**
 * Apply clinic isolation to a Supabase query
 */
export function applyClinicIsolation<T>(
  query: T,
  clinicId: string
): T {
  const q = query as { eq: (column: string, value: string) => T };
  return q.eq('clinic_id', clinicId);
}

/**
 * Get clinic ID with validation
 */
export async function getValidatedClinicId(): Promise<string> {
  try {
    return await getUserClinicId();
  } catch (error) {
    throw new TenantError('Invalid clinic context');
  }
}

/**
 * Check if user belongs to a specific clinic
 */
export async function belongsToClinic(clinicId: string): Promise<boolean> {
  try {
    const userClinicId = await getUserClinicId();
    return userClinicId === clinicId;
  } catch {
    return false;
  }
}

/**
 * Get clinic timezone
 */
export async function getClinicTimezone(): Promise<string> {
  const clinic = await getCurrentClinic();
  return clinic.timezone || 'UTC';
}

/**
 * Validate clinic is active
 */
export async function validateClinicActive(clinicId?: string): Promise<boolean> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('clinics')
    .select('is_active')
    .eq('id', targetClinicId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.is_active === true;
}
