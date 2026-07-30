/**
 * Authentication types
 */

/**
 * User role
 */
export type UserRole = 'owner' | 'administrator' | 'doctor' | 'receptionist' | 'accountant' | 'staff';

/**
 * User metadata
 */
export interface UserMetadata {
  role: UserRole;
  clinic_id: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * Auth session
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata: UserMetadata;
  };
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  clinic_name?: string;
}

/**
 * Reset password data
 */
export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Forgot password data
 */
export interface ForgotPasswordData {
  email: string;
}
