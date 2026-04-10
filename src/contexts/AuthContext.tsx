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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
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
        .single();

      if (userError) {
        console.warn('[AuthContext] User not found in users table, creating:', userError.message);
        
        // Create user record in our users table
        const userType = sessionUser.user_metadata?.user_type || 'parent';
        const name = sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User';
        
        const { error: insertError } = await supabase.from('users').insert({
          id: sessionUser.id,
          email: sessionUser.email,
          user_type: userType,
          name: name
        });
        
        if (insertError && insertError.code !== '23505') {
          console.error('[AuthContext] Failed to create user record:', insertError);
        }
        
        // Continue with default role
        return {
          id: sessionUser.id,
          email: sessionUser.email || '',
          name,
          role: userType as UserRole,
          profile: undefined
        };
      }

      if (!userData) return null;

      const role = userData.user_type as UserRole;
      let profile: Record<string, unknown> | undefined;

      console.log('[AuthContext] User found, role:', role);

      if (role === 'teacher') {
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .single();
        profile = teacherProfile;
      } else if (role === 'parent') {
        const { data: parentProfile } = await supabase
          .from('parent_profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .single();
        profile = parentProfile;
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
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.email?.split('@')[0] || 'User',
        role: 'parent',
        profile: undefined
      };
    }
  }, []);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const initTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[AuthContext] Initialization timeout - forcing ready state');
        setIsLoading(false);
      }
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const userProfile = await loadUserProfile(session.user);
        setUser(userProfile);
      }
      setIsLoading(false);
      clearTimeout(initTimeout);
    }).catch((err) => {
      console.error('[AuthContext] Session check failed:', err);
      setIsLoading(false);
      clearTimeout(initTimeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        if (session?.user) {
          const userProfile = await loadUserProfile(session.user);
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Auth state change error:', err);
      } finally {
        setIsLoading(false);
        clearTimeout(initTimeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(initTimeout);
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
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
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
