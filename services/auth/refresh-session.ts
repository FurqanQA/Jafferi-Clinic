import { createClient } from '@/lib/supabase/client';
import type { AuthError, AuthenticatedUser, Session, UserRole } from '@/lib/supabase/types';
import { toAuthenticatedUser, toSession, toAuthError } from '@/lib/supabase/types';

export interface RefreshSessionResult {
  success: boolean;
  authenticated: boolean;
  session?: Session;
  user?: AuthenticatedUser;
  error?: AuthError;
}

/**
 * Refreshes the current authentication session.
 * Uses Supabase getSession to retrieve and refresh the session if needed.
 * Suitable for use in middleware and Server Components.
 *
 * @returns RefreshSessionResult with authentication status, session/user data, or error
 */
export async function refreshSession(): Promise<RefreshSessionResult> {
  try {
    const supabase = createClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        authenticated: false,
        error: toAuthError(error),
      };
    }

    if (!session) {
      return {
        success: true,
        authenticated: false,
      };
    }

    // Refresh the session to ensure it's valid
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession(session);

    if (refreshError) {
      return {
        success: false,
        authenticated: false,
        error: toAuthError(refreshError),
      };
    }

    if (!refreshedSession) {
      return {
        success: true,
        authenticated: false,
      };
    }

    const role = refreshedSession.user.user_metadata?.role || ('Staff' as UserRole);

    return {
      success: true,
      authenticated: true,
      session: toSession(refreshedSession, role),
      user: toAuthenticatedUser(refreshedSession.user, role),
    };
  } catch (error) {
    return {
      success: false,
      authenticated: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred while refreshing session.',
      },
    };
  }
}

/**
 * Gets the current authenticated user without refreshing the session.
 * Lightweight alternative when you only need user data.
 *
 * @returns RefreshSessionResult with authentication status and user data
 */
export async function getCurrentUser(): Promise<RefreshSessionResult> {
  try {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return {
        success: false,
        authenticated: false,
        error: toAuthError(error),
      };
    }

    if (!user) {
      return {
        success: true,
        authenticated: false,
      };
    }

    const role = user.user_metadata?.role || ('Staff' as UserRole);

    return {
      success: true,
      authenticated: true,
      user: toAuthenticatedUser(user, role),
    };
  } catch (error) {
    return {
      success: false,
      authenticated: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred while getting current user.',
      },
    };
  }
}
