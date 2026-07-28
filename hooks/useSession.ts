import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthError, AuthenticatedUser, Session, UserRole } from '@/lib/supabase/types';
import { toAuthenticatedUser, toSession, toAuthError } from '@/lib/supabase/types';

export interface UseSessionState {
  user: AuthenticatedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface UseSessionActions {
  refresh: () => Promise<void>;
}

export type UseSessionReturn = UseSessionState & UseSessionActions;

/**
 * Hook for managing the current authentication session.
 * This hook uses Supabase's auth state listener to automatically detect
 * authentication state changes and keep the session synchronized across tabs.
 *
 * @returns UseSessionReturn with session state and refresh action
 */
export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(toAuthError(sessionError));
        setSession(null);
        setUser(null);
        return;
      }

      if (!currentSession) {
        setSession(null);
        setUser(null);
        return;
      }

      const role = currentSession.user.user_metadata?.role || ('Staff' as UserRole);
      setSession(toSession(currentSession, role));
      setUser(toAuthenticatedUser(currentSession.user, role));
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred while refreshing session.',
      };
      setError(authError);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          setError(toAuthError(sessionError));
          setIsLoading(false);
          return;
        }

        if (initialSession) {
          const role = initialSession.user.user_metadata?.role || ('Staff' as UserRole);
          setSession(toSession(initialSession, role));
          setUser(toAuthenticatedUser(initialSession.user, role));
        }

        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;

        const authError: AuthError = {
          message: err instanceof Error ? err.message : 'An unexpected error occurred while getting initial session.',
        };
        setError(authError);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && currentSession) {
          const role = currentSession.user.user_metadata?.role || ('Staff' as UserRole);
          setSession(toSession(currentSession, role));
          setUser(toAuthenticatedUser(currentSession.user, role));
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          const role = currentSession.user.user_metadata?.role || ('Staff' as UserRole);
          setSession(toSession(currentSession, role));
          setUser(toAuthenticatedUser(currentSession.user, role));
          setError(null);
        } else if (event === 'USER_UPDATED' && currentSession) {
          const role = currentSession.user.user_metadata?.role || ('Staff' as UserRole);
          setSession(toSession(currentSession, role));
          setUser(toAuthenticatedUser(currentSession.user, role));
          setError(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    refresh,
  };
}
