import { createClient } from '@/lib/supabase/client';
import type { AuthError, AuthenticatedUser, UserRole } from '@/lib/supabase/types';
import { toAuthenticatedUser, toAuthError } from '@/lib/supabase/types';

export type EmailVerificationStatus = 'verified' | 'pending' | 'unauthenticated';

export interface VerifyEmailResult {
  success: boolean;
  status?: EmailVerificationStatus;
  user?: AuthenticatedUser;
  error?: AuthError;
}

/**
 * Checks the email verification status of the authenticated user.
 * Retrieves the current user and checks if email is confirmed.
 *
 * @returns VerifyEmailResult with verification status, user data, or error
 */
export async function verifyEmail(): Promise<VerifyEmailResult> {
  try {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return {
        success: false,
        error: toAuthError(error),
      };
    }

    if (!user) {
      return {
        success: true,
        status: 'unauthenticated',
      };
    }

    const role = user.user_metadata?.role || ('Staff' as UserRole);
    const isEmailConfirmed = user.email_confirmed_at !== null;

    return {
      success: true,
      status: isEmailConfirmed ? 'verified' : 'pending',
      user: toAuthenticatedUser(user, role),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred while checking email verification.',
      },
    };
  }
}

/**
 * Resends the email verification email to the authenticated user.
 *
 * @returns VerifyEmailResult with success status or error
 */
export async function resendVerificationEmail(): Promise<VerifyEmailResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: (await supabase.auth.getUser()).data.user?.email ?? '',
    });

    if (error) {
      return {
        success: false,
        error: toAuthError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred while resending verification email.',
      },
    };
  }
}
