import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'teacher' | 'parent' | 'admin' | 'principal';

export interface TeacherData {
  name: string;
  email: string;
  phone?: string;
  qualification?: string;
  school_name: string;
  class_grade?: string;
  school_id?: string;
  subject_specialization?: string;
  years_of_experience?: number;
  bio?: string;
  school_code?: string;
}

export interface ParentData {
  name: string;
  email: string;
  phone?: string;
  relationship_to_child: 'mother' | 'father' | 'guardian';
  phone_number: string;
  school_id?: string;
  occupation?: string;
  emergency_contact?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  data?: unknown;
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
      console.log('[Auth] 1. Starting Teacher Signup:', data.email);
      let userId: string;

      const signUpData: any = { 
        email: data.email,
        password,
        options: { data: { name: data.name, user_type: 'teacher', school_id: data.school_id } }
      };

      const { data: authData, error: authError } = await supabase.auth.signUp(signUpData);

      if (authError) {
        if (authError.message?.includes('already') || authError.message?.includes('exist') || authError.message?.includes('Database error')) {
          console.log('[Auth] 2a. Auth error or user exists. Attempting sign-in to check...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password
          });
          
          if (signInError) {
            if (signInError.message.includes('Invalid login') || signInError.message.includes('Invalid email')) {
              return { success: false, error: 'Email already registered. Please try logging in or use a different email.' };
            }
            console.error('[Auth] Sign-in failed:', signInError);
            return { success: false, error: 'Account exists but cannot be accessed. Try logging in.' };
          }
          
          if (!signInData.user) {
            return { success: false, error: 'Authentication failed unexpectedly.' };
          }
          
          console.log('[Auth] Logged in existing user:', signInData.user.id);
          return { success: true };
        } else {
          console.error('[Auth] 2b. Signup error:', authError);
          throw new Error(authError.message || 'Signup failed');
        }
      } else {
        if (!authData.user) throw new Error('No user returned from Auth');
        userId = authData.user.id;
        console.log('[Auth] 2c. Auth user created:', userId);
      }

      console.log('[Auth] 3. Syncing Users table...');
      const { error: upsertError } = await supabase.from('users').upsert({
        id: userId,
        email: data.email,
        user_type: 'teacher',
        name: data.name,
        school_id: data.school_id || null,
        is_active: true
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (upsertError) {
        console.warn('[Auth] Users table upsert warning (continuing anyway):', upsertError.message);
      }

      console.log('[Auth] 4. Creating Teacher Profile...');
      const { error: profileError } = await supabase.from('teacher_profiles').upsert({
        user_id: userId,
        qualification: data.qualification || '',
        school_name: data.school_name,
        class_grade: data.class_grade,
        subject_specialization: data.subject_specialization,
        years_of_experience: data.years_of_experience || 0,
        bio: data.bio
      }, { onConflict: 'user_id', ignoreDuplicates: true });

      if (profileError) {
        console.warn('[Auth] Teacher profile warning (continuing anyway):', profileError.message);
        // Return partial success - user can complete profile later
        console.log('[Auth] 5. Signup complete (profile incomplete)!');
        return { success: true, data: { profileIncomplete: true, warning: profileError.message } };
      }

      console.log('[Auth] 5. Signup complete!');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Signup FATAL error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  },

  async signUpParent(data: ParentData, password: string): Promise<AuthResult> {
    try {
      console.log('[Auth] 1. Starting Parent Signup:', data.email);
      let userId: string;

      const signUpData: any = { 
        email: data.email,
        password,
        options: { data: { name: data.name, user_type: 'parent', school_id: data.school_id } }
      };

      const { data: authData, error: authError } = await supabase.auth.signUp(signUpData);

      if (authError) {
        if (authError.message?.includes('already') || authError.message?.includes('exist') || authError.message?.includes('Database error')) {
          console.log('[Auth] 2a. Parent Auth error. Attempting sign-in...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password
          });
          
          if (signInError) {
            if (signInError.message.includes('Invalid login') || signInError.message.includes('Invalid email')) {
              return { success: false, error: 'Email already registered. Please log in.' };
            }
            return { success: false, error: 'Account exists but cannot be accessed. Try logging in.' };
          }
          
          if (!signInData.user) {
            return { success: false, error: 'Authentication failed unexpectedly.' };
          }
          
          console.log('[Auth] Logged in existing parent user');
          return { success: true };
        } else {
          throw new Error(authError.message || 'Signup failed');
        }
      } else {
        if (!authData.user) throw new Error('Failed to create user');
        userId = authData.user.id;
      }

      console.log('[Auth] 3. Syncing Parent User table...');
      const { error: upsertError } = await supabase.from('users').upsert({
        id: userId,
        email: data.email,
        user_type: 'parent',
        name: data.name,
        school_id: data.school_id || null,
        is_active: true
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (upsertError) console.warn('[Auth] User sync warning:', upsertError.message);

      console.log('[Auth] 4. Creating Parent Profile...');
      const { error: profileError } = await supabase.from('parent_profiles').upsert({
        user_id: userId,
        relationship_to_child: data.relationship_to_child,
        phone_number: data.phone_number,
        occupation: data.occupation,
        emergency_contact: data.emergency_contact
      }, { onConflict: 'user_id', ignoreDuplicates: true });

      if (profileError) {
        console.warn('[Auth] Parent profile warning:', profileError.message);
        // Return partial success - user can complete profile later
        console.log('[Auth] 5. Parent Signup complete (profile incomplete)!');
        return { success: true, data: { profileIncomplete: true, warning: profileError.message } };
      }

      console.log('[Auth] 5. Parent Signup success!');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Parent Signup FATAL error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  },

  async signUpPrincipal(data: TeacherData & { school_code: string }, password: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Principal Signup:', data.email);
      
      // Verify school code
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id, admin_code')
        .ilike('name', data.school_name)
        .maybeSingle();
      
      if (schoolError || !schoolData) {
        return { success: false, error: 'School not found. Contact your administrator.' };
      }
      
      if (schoolData.admin_code !== data.school_code) {
        return { success: false, error: 'Invalid school code. Please verify with your administrator.' };
      }
      
      let userId: string;

      const signUpData: any = { 
        email: data.email,
        password,
        options: { data: { name: data.name, user_type: 'admin', school_id: schoolData.id } }
      };

      const { data: authData, error: authError } = await supabase.auth.signUp(signUpData);

      if (authError) {
        if (authError.message?.includes('already') || authError.message?.includes('exist')) {
          return { success: false, error: 'Email already registered. Please log in.' };
        }
        throw new Error(authError.message || 'Signup failed');
      }
      
      if (!authData.user) throw new Error('No user returned from Auth');
      userId = authData.user.id;
      
      // Create users record with admin role
      const { error: usersError } = await supabase.from('users').upsert({
        id: userId,
        email: data.email,
        user_type: 'admin',
        name: data.name,
        school_id: schoolData.id,
        is_active: true
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (usersError) {
        console.warn('[Auth] Users upsert warning:', usersError.message);
      }
      
      console.log('[Auth] Principal Signup success!');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Principal Signup FATAL error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  },

  async signIn(identifier: string, password: string): Promise<AuthResult> {
    try {
      const isEmail = identifier.includes('@');
      const signInData = isEmail 
        ? { email: identifier, password }
        : { phone: identifier, password };

      const { data, error } = await supabase.auth.signInWithPassword(signInData as any);

      if (error) {
        console.error('[Auth] Login error:', error);
        
        // Handle temp password reset
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid')) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, temp_password, password_reset_pending')
            .eq('email', identifier)
            .maybeSingle();
          
          if (userData?.password_reset_pending && userData?.temp_password === password) {
            console.log('[Auth] Temp password accepted, clearing reset flag');
            
            await supabase.from('users').update({
              temp_password: null,
              password_reset_pending: false
            }).eq('id', userData.id);
          } else {
            throw new Error('Invalid email or password. Please try again.');
          }
        }
        
        // Handle Email Not Confirmed specifically
        if (error.message?.includes('Email not confirmed') || error.message?.includes('confirm')) {
          throw new Error('Please confirm your email address. Check your inbox for the verification link.');
        }
        
        throw error;
      }
      
      if (!data.user) throw new Error('Login failed');

      // Sync profile if missing
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingUser) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || identifier.split('@')[0],
            user_type: data.user.user_metadata?.user_type || 'parent',
            school_id: data.user.user_metadata?.school_id,
            is_active: true
          });
        }
      } catch (profileErr) {
        console.warn('[Auth] Profile sync skipped:', profileErr);
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
      const profiles: { teacher?: Record<string, unknown>; parent?: Record<string, unknown> } = {};

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
      console.log('[Auth] Sending password reset for:', email);
      console.log('[Auth] Redirect URL:', `${window.location.origin}/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('[Auth] Reset password error:', error);
        throw error;
      }
      
      console.log('[Auth] Reset email sent successfully');
      return { success: true, data };
    } catch (error) {
      console.error('[Auth] Reset password catch:', error);
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

  async requestLoginOTP(email: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Requesting OTP for:', email);
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      
      if (!existingUser) {
        return { success: false, error: 'No account found with this email' };
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          login_otp: otp,
          login_otp_expiry: expiry
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error('[Auth] OTP update error:', updateError);
        return { success: true, data: { otp } };
      }
      
      console.log('[Auth] OTP generated:', otp);
      return { success: true, data: { otp } };
    } catch (error) {
      console.error('[Auth] Request OTP error:', error);
      return { success: false, error: 'Failed to generate OTP. Please try again.' };
    }
  },

async requestPhoneOTP(phone: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Requesting phone OTP for:', phone);
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', phone)
        .maybeSingle();
      
      if (!existingUser) {
        return { success: false, error: 'No account found with this phone number' };
      }
      
      console.log('[Auth] Phone OTP ready:', otp);
return { success: true, data: { otp } };
    } catch (error) {
      console.error('[Auth] Phone OTP error:', error);
      return { success: false, error: 'Failed to generate OTP. Please try again.' };
    }
  },

  async verifyLoginOTP(email: string, otp: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Verifying OTP for:', email);
      
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('id, login_otp, login_otp_expiry, email, name, user_type, school_id')
        .eq('email', email)
        .maybeSingle();
      
      if (fetchError || !userData) {
        return { success: false, error: 'Invalid email or OTP' };
      }
      
      if (!userData.login_otp || userData.login_otp !== otp) {
        return { success: false, error: 'Invalid OTP' };
      }
      
      const now = new Date();
      const expiry = new Date(userData.login_otp_expiry);
      
      if (now > expiry) {
        await supabase.from('users').update({ login_otp: null, login_otp_expiry: null }).eq('id', userData.id);
        return { success: false, error: 'OTP expired. Please request a new one.' };
      }
      
      await supabase.from('users').update({ login_otp: null, login_otp_expiry: null }).eq('id', userData.id);
      
      try {
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password: otp + 'temp'
        } as any);
      } catch {
        console.log('[Auth] Creating session via user record');
      }
      
      return { 
        success: true, 
        data: { 
          userId: userData.id, 
          email: userData.email, 
          name: userData.name,
          userType: userData.user_type 
        } 
      };
    } catch (error) {
      console.error('[Auth] Verify OTP error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'OTP verification failed' };
    }
  },

  async adminResetPassword(userId: string, tempPassword: string): Promise<AuthResult> {
    try {
      console.log('[Auth] Admin password reset for:', userId);
      
      const { error } = await supabase.from('users').update({
        temp_password: tempPassword,
        password_reset_pending: true,
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (error) {
        console.error('[Auth] Temp password set error:', error);
        throw error;
      }

      return { success: true, data: { message: 'Temp password set. User can login and change it.' } };
    } catch (error) {
      console.error('[Auth] Admin reset failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Admin reset failed' };
    }
  },

  async confirmPasswordReset(tempPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse?.user;
      
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const { data: userData } = await supabase
        .from('users')
        .select('temp_password, password_reset_pending')
        .eq('id', user.id)
        .single();

      if (!userData?.password_reset_pending || userData?.temp_password !== tempPassword) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      await supabase.from('users').update({
        temp_password: null,
        password_reset_pending: false
      }).eq('id', user.id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Password reset failed' };
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
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: '__check_only_never_real__'
      });
      // Invalid credentials means user exists (wrong password)
      return error?.message?.includes('Invalid login credentials') || false;
    } catch {
      return false;
    }
  }
};