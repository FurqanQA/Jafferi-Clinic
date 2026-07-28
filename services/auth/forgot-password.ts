import { createClient } from '@/lib/supabase/client';
import type { AuthError } from '@/lib/supabase/types';
import { toAuthError } from '@/lib/supabase/types';

export interface ForgotPasswordInput {
  email: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  error?: AuthError;
}

/**
 * Sends a password reset email to the user.
 * Uses Supabase resetPasswordForEmail with redirect to /auth/reset-password.
 *
 * @param input - Email address to send password reset to
 * @returns ForgotPasswordResult with success status or error
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
  try {
    const supabase = createClient();

    const redirectUrl = `${window.location.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: redirectUrl,
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
        message: error instanceof Error ? error.message : 'An unexpected error occurred while sending password reset email.',
      },
    };
  }
}
