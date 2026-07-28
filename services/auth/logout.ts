import { createClient } from '@/lib/supabase/client';
import type { AuthError } from '@/lib/supabase/types';
import { toAuthError } from '@/lib/supabase/types';

export interface LogoutResult {
  success: boolean;
  error?: AuthError;
}

/**
 * Signs out the currently authenticated user.
 * Clears the session and handles any errors that occur.
 *
 * @returns LogoutResult with success status or error
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

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
        message: error instanceof Error ? error.message : 'An unexpected error occurred during logout.',
      },
    };
  }
}
