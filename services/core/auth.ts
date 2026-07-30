import { getSupabaseClient } from './client';
import { AuthenticationError, AuthorizationError } from './errors';

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new AuthenticationError(error.message);
  }
  
  if (!user) {
    throw new AuthenticationError('No authenticated user found');
  }
  
  return user;
}

/**
 * Get current user's session
 */
export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new AuthenticationError(error.message);
  }
  
  if (!session) {
    throw new AuthenticationError('No active session found');
  }
  
  return session;
}

/**
 * Get user's role from user_metadata
 */
export async function getUserRole(): Promise<string> {
  const user = await getCurrentUser();
  const role = user.user_metadata?.role;
  
  if (!role) {
    throw new AuthorizationError('User role not found');
  }
  
  return role;
}

/**
 * Get user's clinic ID from user_metadata
 */
export async function getUserClinicId(): Promise<string> {
  const user = await getCurrentUser();
  const clinicId = user.user_metadata?.clinic_id;
  
  if (!clinicId) {
    throw new AuthorizationError('User clinic not found');
  }
  
  return clinicId;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
  const supabase = getSupabaseClient();
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    throw new AuthenticationError(error.message);
  }
  
  if (!session) {
    throw new AuthenticationError('Failed to refresh session');
  }
  
  return session;
}
