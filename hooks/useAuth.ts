import { useState, useCallback, useMemo } from 'react';
import type {
  AuthenticatedUser,
  Session,
  AuthError,
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/lib/supabase/types';
import { login as loginService } from '@/services/auth/login';
import { register as registerService } from '@/services/auth/register';
import { logout as logoutService } from '@/services/auth/logout';
import { forgotPassword as forgotPasswordService } from '@/services/auth/forgot-password';
import { resetPassword as resetPasswordService } from '@/services/auth/reset-password';
import { refreshSession as refreshSessionService, getCurrentUser as getCurrentUserService } from '@/services/auth/refresh-session';

export interface UseAuthState {
  user: AuthenticatedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface UseAuthActions {
  login: (credentials: LoginCredentials & { rememberMe?: boolean }) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<boolean>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<boolean>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  getCurrentUser: () => Promise<boolean>;
  getCurrentSession: () => Promise<Session | null>;
  clearError: () => void;
}

export type UseAuthReturn = UseAuthState & UseAuthActions;

/**
 * Central authentication hook that provides access to authentication actions and state.
 * This hook wraps the authentication services and provides a clean, consistent API for
 * authentication operations throughout the application.
 *
 * @returns UseAuthReturn with authentication state and actions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials & { rememberMe?: boolean }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loginService({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      });

      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred during login.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await registerService({
        fullName: credentials.full_name,
        clinicName: credentials.clinic_name,
        email: credentials.email,
        phone: credentials.phone,
        password: credentials.password,
      });

      if (result.success && result.user) {
        setUser(result.user);
        if (result.session) {
          setSession(result.session);
        }
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred during registration.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logoutService();

      if (result.success) {
        setUser(null);
        setSession(null);
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred during logout.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (payload: ForgotPasswordPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await forgotPasswordService({ email: payload.email });

      if (result.success) {
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred while sending password reset email.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await resetPasswordService({ newPassword: payload.password });

      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred during password reset.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await refreshSessionService();

      if (result.success && result.authenticated && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        return true;
      }

      if (result.success && !result.authenticated) {
        setUser(null);
        setSession(null);
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred while refreshing session.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getCurrentUserService();

      if (result.success && result.authenticated && result.user) {
        setUser(result.user);
        return true;
      }

      if (result.success && !result.authenticated) {
        setUser(null);
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred while getting current user.',
      };
      setError(authError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentSession = useCallback(async (): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await refreshSessionService();

      if (result.success && result.authenticated && result.session) {
        setSession(result.session);
        if (result.user) {
          setUser(result.user);
        }
        return result.session;
      }

      if (result.success && !result.authenticated) {
        setSession(null);
        setUser(null);
        return null;
      }

      if (result.error) {
        setError(result.error);
      }

      return null;
    } catch (err) {
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred while getting current session.',
      };
      setError(authError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshSession,
    getCurrentUser,
    getCurrentSession,
    clearError,
  };
}
