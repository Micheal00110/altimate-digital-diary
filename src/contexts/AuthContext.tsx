import { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'teacher' | 'parent' | 'admin';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile?: Record<string, unknown>;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signInAsGuest: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (sessionUser: User): Promise<AuthUser | null> => {
    try {
      console.log('[AuthContext] Loading profile for user:', sessionUser.id);

      // First check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (userError) {
        console.warn('[AuthContext] Users table query error:', userError.message);
        // Fall through to create user
      }

      // If user not found in our users table, create them
      if (!userData) {
        console.log('[AuthContext] User not in users table, creating...');
        const userType = sessionUser.user_metadata?.user_type || 'parent';
        const name = sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User';

        const { error: insertError } = await supabase.from('users').insert({
          id: sessionUser.id,
          email: sessionUser.email,
          user_type: userType,
          name: name
        });

        if (insertError) {
          console.error('[AuthContext] Failed to create user record:', insertError);
          // Continue anyway with basic user info
        }

        return {
          id: sessionUser.id,
          email: sessionUser.email || '',
          name,
          role: userType as UserRole,
          profile: undefined
        };
      }

      const role = userData.user_type as UserRole;
      let profile: Record<string, unknown> | undefined;

      console.log('[AuthContext] User found in DB, role:', role);

      if (role === 'teacher') {
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .maybeSingle();
        profile = teacherProfile || undefined;
      } else if (role === 'parent') {
        const { data: parentProfile } = await supabase
          .from('parent_profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .maybeSingle();
        profile = parentProfile || undefined;
      }

      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: userData.name || '',
        role,
        profile
      };
    } catch (err) {
      console.error('[AuthContext] Error loading profile:', err);
      // Return basic user info on error
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.email?.split('@')[0] || 'User',
        role: 'parent',
        profile: undefined
      };
    }
  }, []);

  const signInAsGuest = useCallback((role: UserRole) => {
    const guestUser: AuthUser = {
      id: 'guest-' + Date.now(),
      email: 'guest@example.com',
      name: 'Guest ' + (role.charAt(0).toUpperCase() + role.slice(1)),
      role: role,
      profile: { guest: true }
    };
    
    setUser(guestUser);
    localStorage.setItem('diary_guest_user', JSON.stringify(guestUser));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Check for guest login first (before any async ops)
    const savedGuest = localStorage.getItem('diary_guest_user');
    if (savedGuest) {
      try {
        const guestData = JSON.parse(savedGuest);
        setUser(guestData);
        setIsLoading(false);
        return; // Skip server check if guest is active
      } catch (e) {
        localStorage.removeItem('diary_guest_user');
      }
    }

    // Add timeout to prevent infinite loading
    const initTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('[AuthContext] Initialization timeout - forcing ready state');
        setIsLoading(false);
      }
    }, 8000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        if (session?.user) {
          const userProfile = await loadUserProfile(session.user);
          if (isMounted) {
            setUser(userProfile);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Session check failed:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        clearTimeout(initTimeout);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (!isMounted) return;
      try {
        setSession(session);
        if (session?.user) {
          const userProfile = await loadUserProfile(session.user);
          if (isMounted) {
            setUser(userProfile);
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Auth state change error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const result = await authService.signIn(identifier, password);
    return { error: result.error ? new Error(result.error) : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: UserRole) => {
    const baseData = { name: '', email };
    let result;
    if (role === 'teacher') {
      result = await authService.signUpTeacher({
        ...baseData,
        school_name: '',
        class_grade: ''
      }, password);
    } else {
      result = await authService.signUpParent({
        ...baseData,
        relationship_to_child: 'mother',
        phone_number: ''
      }, password);
    }
    return { error: result.error ? new Error(result.error) : null };
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const result = await authService.resetPassword(email);
    return { error: result.error ? new Error(result.error) : null };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
