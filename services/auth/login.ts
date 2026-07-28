import { createClient } from '@/lib/supabase/client';
import type { AuthenticatedUser, Session, AuthError } from '@/lib/supabase/types';
import { toAuthenticatedUser, toSession, toAuthError } from '@/lib/supabase/types';

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthenticatedUser;
  session?: Session;
  error?: AuthError;
}

/**
 * Authenticates an existing user using email and password.
 * Uses Supabase signInWithPassword for authentication.
 *
 * @param input - Login credentials including email, password, and optional rememberMe
 * @returns LoginResult with success status, user/session data, or error
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return {
        success: false,
        error: toAuthError(error),
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: {
          message: 'Authentication failed. No user or session returned.',
        },
      };
    }

    // Extract role from user metadata, default to Staff
    const role = data.user.user_metadata?.role || 'Staff';

    return {
      success: true,
      user: toAuthenticatedUser(data.user, role),
      session: toSession(data.session, role),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred during login.',
      },
    };
  }
}
