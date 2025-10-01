import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { AuthService } from '@/services/authService';
import { SupaUser } from '@/lib/authSupa';

interface UseAuthReturn {
  user: SupaUser | null;
  profile: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  ensureAuth: () => Promise<SupaUser | null>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await AuthService.getProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = AuthService.onAuthChange((newUser) => {
      setUser(newUser);
      if (newUser) {
        AuthService.getProfile(newUser.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    try {
      setError(null);
      await AuthService.signIn();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign in failed'));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await AuthService.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign out failed'));
      throw err;
    }
  }, []);

  const ensureAuth = useCallback(async () => {
    try {
      const authUser = await AuthService.ensureAuth();
      setUser(authUser);
      return authUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication required'));
      return null;
    }
  }, []);

  return {
    user,
    profile,
    isLoading,
    error,
    signIn,
    signOut,
    ensureAuth,
  };
}

