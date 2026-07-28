import { createClient } from '@/lib/supabase/client';
import type { AuthError, AuthenticatedUser, UserRole } from '@/lib/supabase/types';
import { toAuthenticatedUser, toAuthError } from '@/lib/supabase/types';

export interface ResetPasswordInput {
  newPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: AuthError;
}

/**
 * Updates the user's password after a password reset flow.
 * Uses Supabase updateUser to update the password.
 * Requires an active authenticated session.
 *
 * @param input - New password to set
 * @returns ResetPasswordResult with success status, user data, or error
 */
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: input.newPassword,
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
          message: 'Password update failed. No user returned.',
        },
      };
    }

    const role = data.user.user_metadata?.role || ('Staff' as UserRole);

    return {
      success: true,
      user: toAuthenticatedUser(data.user, role),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred during password reset.',
      },
    };
  }
}
