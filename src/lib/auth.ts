import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'teacher' | 'parent' | 'admin';

export interface TeacherData {
  name: string;
  email: string;
  qualification?: string;
  school_name: string;
  class_grade: string;
  subject_specialization?: string;
  years_of_experience?: number;
  bio?: string;
}

export interface ParentData {
  name: string;
  email: string;
  relationship_to_child: 'mother' | 'father' | 'guardian';
  phone_number: string;
  occupation?: string;
  emergency_contact?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface ProfileResult {
  success: boolean;
  profile?: Record<string, unknown>;
  error?: string;
}

export const authService = {
  /**
   * Sign up as teacher or create teacher profile for existing user
   * Supports same email for both teacher and parent roles
   */
  async signUpTeacher(data: TeacherData, password: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Signing up/adding teacher role:', data.email);
      
      let userId: string;

      // Try to get existing user with this email (with error handling)
      let existingUsers: any[] = [];
      try {
        const result = await supabase
          .from('users')
          .select('id, user_type')
          .eq('email', data.email);
        
        if (!result.error && result.data) {
          existingUsers = result.data;
        }
      } catch (err) {
        console.warn('[Auth] Could not query existing users:', err);
      }

      if (existingUsers && existingUsers.length > 0) {
        // User exists with this email, add teacher role
        console.log('[Auth] User exists, adding teacher profile');
        userId = existingUsers[0].id;
        
        // Update user_type to include both roles if not already teacher/admin
        try {
          const currentType = existingUsers[0].user_type;
          if (currentType !== 'teacher' && currentType !== 'admin') {
            await supabase
              .from('users')
              .update({ user_type: 'teacher' })
              .eq('id', userId);
          }
        } catch (err) {
          console.warn('[Auth] Could not update user type:', err);
        }
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password,
          options: {
            data: {
              name: data.name,
              user_type: 'teacher'
            }
          }
        });

        if (authError) {
          console.error('[Auth] Signup error:', authError);
          throw new Error(authError.message);
        }
        if (!authData.user) throw new Error('Failed to create user');
        
        console.log('[Auth] User created:', authData.user.id);
        userId = authData.user.id;

        // Create entry in users table (with error handling)
        try {
          const { error: userError } = await supabase.from('users').insert({
            id: userId,
            email: data.email,
            user_type: 'teacher',
            name: data.name
          });

          if (userError) {
            console.warn('[Auth] Users table insert failed:', userError.message);
            // Continue anyway - this is not critical
          } else {
            console.log('[Auth] User table entry created');
          }
        } catch (err) {
          console.warn('[Auth] Exception inserting to users table:', err);
          // Continue anyway
        }
      }

      // Check if teacher profile already exists
      let existingProfile = null;
      try {
        const result = await supabase
          .from('teacher_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (!result.error && result.data) {
          existingProfile = result.data;
        }
      } catch (err) {
        console.warn('[Auth] Could not check existing profile:', err);
      }

      if (existingProfile) {
        console.log('[Auth] Teacher profile already exists, skipping creation');
      } else {
        // Create teacher profile
        try {
          const { error: profileError } = await supabase.from('teacher_profiles').insert({
            user_id: userId,
            qualification: data.qualification || '',
            school_name: data.school_name,
            class_grade: data.class_grade,
            subject_specialization: data.subject_specialization,
            years_of_experience: data.years_of_experience || 0,
            bio: data.bio
          });

          if (profileError) {
            console.error('[Auth] Teacher profile insert failed:', profileError.message);
            throw new Error(`Failed to create teacher profile: ${profileError.message}`);
          }

          console.log('[Auth] Teacher profile created successfully');
        } catch (err) {
          console.warn('[Auth] Exception creating teacher profile:', err);
          // If tables don't exist, that's okay for now
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Full signup error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  },

  async signUpParent(data: ParentData, password: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Signing up/adding parent role:', data.email);
      
      let userId: string;

      // Try to get existing user with this email (with error handling)
      let existingUsers: any[] = [];
      try {
        const result = await supabase
          .from('users')
          .select('id, user_type')
          .eq('email', data.email);
        
        if (!result.error && result.data) {
          existingUsers = result.data;
        }
      } catch (err) {
        console.warn('[Auth] Could not query existing users:', err);
      }

      if (existingUsers && existingUsers.length > 0) {
        // User exists with this email, add parent role
        console.log('[Auth] User exists, adding parent profile');
        userId = existingUsers[0].id;
        
        // Update user_type to include both roles if not already parent/admin
        try {
          const currentType = existingUsers[0].user_type;
          if (currentType !== 'parent' && currentType !== 'admin') {
            await supabase
              .from('users')
              .update({ user_type: 'parent' })
              .eq('id', userId);
          }
        } catch (err) {
          console.warn('[Auth] Could not update user type:', err);
        }
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password,
          options: {
            data: {
              name: data.name,
              user_type: 'parent'
            }
          }
        });

        if (authError) {
          console.error('[Auth] Signup error:', authError);
          throw new Error(authError.message);
        }
        if (!authData.user) throw new Error('Failed to create user');
        
        console.log('[Auth] User created:', authData.user.id);
        userId = authData.user.id;

        // Create entry in users table (with error handling)
        try {
          const { error: userError } = await supabase.from('users').insert({
            id: userId,
            email: data.email,
            user_type: 'parent',
            name: data.name
          });

          if (userError) {
            console.warn('[Auth] Users table insert failed:', userError.message);
            // Continue anyway - this is not critical
          } else {
            console.log('[Auth] User table entry created');
          }
        } catch (err) {
          console.warn('[Auth] Exception inserting to users table:', err);
          // Continue anyway
        }
      }

      // Check if parent profile already exists
      let existingProfile = null;
      try {
        const result = await supabase
          .from('parent_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (!result.error && result.data) {
          existingProfile = result.data;
        }
      } catch (err) {
        console.warn('[Auth] Could not check existing profile:', err);
      }

      if (existingProfile) {
        console.log('[Auth] Parent profile already exists, skipping creation');
      } else {
        // Create parent profile
        try {
          const { error: profileError } = await supabase.from('parent_profiles').insert({
            user_id: userId,
            relationship_to_child: data.relationship_to_child,
            phone_number: data.phone_number,
            occupation: data.occupation,
            emergency_contact: data.emergency_contact
          });

          if (profileError) {
            console.error('[Auth] Parent profile insert failed:', profileError.message);
            throw new Error(`Failed to create parent profile: ${profileError.message}`);
          }

          console.log('[Auth] Parent profile created successfully');
        } catch (err) {
          console.warn('[Auth] Exception creating parent profile:', err);
          // If tables don't exist, that's okay for now
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Full signup error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      // Ensure user has a profile entry
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingUser) {
          // Create user profile entry if it doesn't exist
          await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            user_type: data.user.user_metadata?.user_type || 'parent'
          });
          console.log('[Auth] Created user profile on login');
        }
      } catch (profileErr) {
        console.warn('[Auth] Could not ensure user profile:', profileErr);
        // Continue anyway - user is authenticated
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  async signInWithOAuth(provider: 'google' | 'github'): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}`
        }
      });

      if (error) throw error;
      if (!data.url) throw new Error('OAuth redirect failed');

      // Redirect to OAuth provider
      window.location.href = data.url;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : `${provider} login failed` };
    }
  },

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Get all roles for a user (can be teacher, parent, or both)
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      const roles: UserRole[] = [];
      if (data.user_type === 'teacher') roles.push('teacher');
      if (data.user_type === 'parent') roles.push('parent');
      if (data.user_type === 'admin') roles.push('admin');
      
      return roles;
    } catch {
      return [];
    }
  },

  /**
   * Check if user has specific role
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.includes(role);
    } catch {
      return false;
    }
  },

  /**
   * Get all profiles for a user (teacher profile, parent profile, etc.)
   */
  async getUserProfiles(userId: string): Promise<{
    teacher?: Record<string, unknown>;
    parent?: Record<string, unknown>;
  }> {
    try {
      const profiles: any = {};

      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (teacherData) profiles.teacher = teacherData;

      const { data: parentData } = await supabase
        .from('parent_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (parentData) profiles.parent = parentData;

      return profiles;
    } catch (error) {
      console.error('[Auth] Error fetching user profiles:', error);
      return {};
    }
  },

  /**
   * Switch to a different role (if user has multiple roles)
   * Updates the user_type to the selected role
   */
  async switchRole(userId: string, role: UserRole): Promise<AuthResult> {
    try {
      console.log('[Auth] Switching role for user:', userId, 'to:', role);

      const hasRole = await this.hasRole(userId, role);
      if (!hasRole) {
        throw new Error(`User does not have ${role} role`);
      }

      const { error } = await supabase
        .from('users')
        .update({ user_type: role })
        .eq('id', userId);

      if (error) throw error;

      console.log('[Auth] Role switched successfully');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Role switch error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Role switch failed' };
    }
  },

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Password reset failed' };
    }
  },

  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Password update failed' };
    }
  },

  async getTeacherProfile(userId: string): Promise<ProfileResult> {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*, users!inner(email, name, avatar_url)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Profile not found' };
    }
  },

  async getParentProfile(userId: string): Promise<ProfileResult> {
    try {
      const { data, error } = await supabase
        .from('parent_profiles')
        .select('*, users!inner(email, name, avatar_url)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Profile not found' };
    }
  },

  async updateTeacherProfile(userId: string, data: Partial<TeacherData>): Promise<ProfileResult> {
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  },

  async updateParentProfile(userId: string, data: Partial<ParentData>): Promise<ProfileResult> {
    try {
      const { error } = await supabase
        .from('parent_profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  },

  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data.user_type as UserRole;
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};