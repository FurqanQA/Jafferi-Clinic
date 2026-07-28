import type {
  AuthError as SupabaseAuthError,
  User as SupabaseUser,
  Session as SupabaseSession,
} from '@supabase/supabase-js';

/**
 * User roles for the clinic management system.
 * Each role has specific permissions within the application.
 */
export type UserRole =
  | 'Owner'
  | 'Administrator'
  | 'Doctor'
  | 'Receptionist'
  | 'Accountant'
  | 'Staff';

/**
 * Authentication providers supported by the application.
 */
export type Provider = 'email' | 'google' | 'microsoft' | 'apple';

/**
 * Extended user type with clinic-specific metadata.
 */
export interface ClinicUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  clinic_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Authenticated user representation returned to the application.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  clinic_id?: string;
}

/**
 * Session information for the authenticated user.
 */
export interface Session {
  user: AuthenticatedUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

/**
 * Authentication error details.
 */
export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Credentials for user login.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Credentials for user registration.
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
  clinic_name?: string;
  phone?: string;
  role?: UserRole;
}

/**
 * Payload for forgot password request.
 */
export interface ForgotPasswordPayload {
  email: string;
  redirectTo?: string;
}

/**
 * Payload for password reset.
 */
export interface ResetPasswordPayload {
  password: string;
  passwordConfirm: string;
}

/**
 * Payload for updating user profile.
 */
export interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
}

/**
 * Type guard to check if an error is a Supabase AuthError.
 */
export function isSupabaseAuthError(error: unknown): error is SupabaseAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  );
}

/**
 * Converts a Supabase AuthError to our application's AuthError format.
 */
export function toAuthError(error: SupabaseAuthError): AuthError {
  return {
    message: error.message,
    status: error.status,
    code: typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: string }).code
      : undefined,
  };
}

/**
 * Converts a Supabase User to our application's AuthenticatedUser format.
 */
export function toAuthenticatedUser(
  user: SupabaseUser,
  role: UserRole = 'Staff'
): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email ?? '',
    role,
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
    clinic_id: user.user_metadata?.clinic_id,
  };
}

/**
 * Converts a Supabase Session to our application's Session format.
 */
export function toSession(
  supabaseSession: SupabaseSession,
  role: UserRole = 'Staff'
): Session {
  return {
    user: toAuthenticatedUser(supabaseSession.user, role),
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token,
    expires_at: supabaseSession.expires_at ?? 0,
    expires_in: supabaseSession.expires_in ?? 0,
    token_type: supabaseSession.token_type,
  };
}
