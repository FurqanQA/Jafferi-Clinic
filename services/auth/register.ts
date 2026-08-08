import { createClient } from '@/lib/supabase/client';
import type { AuthenticatedUser, Session, AuthError, UserRole } from '@/lib/supabase/types';
import { toAuthenticatedUser, toSession, toAuthError } from '@/lib/supabase/types';

export interface RegisterInput {
  fullName?: string;
  clinicName?: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  user?: AuthenticatedUser;
  session?: Session;
  error?: AuthError;
}

/**
 * Creates a new user account using Supabase signUp.
 * Configures email verification and saves user metadata.
 *
 * @param input - Registration details including email, password, and optional metadata
 * @returns RegisterResult with success status, user/session data, or error
 */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName || '',
          phone: input.phone || '',
          role: 'Staff' as UserRole, // Default role for new registrations
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: toAuthError(error),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          message: 'Registration failed. No user returned.',
        },
      };
    }

    // Session may be null if email verification is required
    const role = data.user.user_metadata?.role || 'Staff';

    return {
      success: true,
      user: toAuthenticatedUser(data.user, role),
      session: data.session ? toSession(data.session, role) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred during registration.',
      },
    };
  }
}
