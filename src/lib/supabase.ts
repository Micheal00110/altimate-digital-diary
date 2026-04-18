import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

// Mock client that returns proper error for any auth method call
function createMockSupabaseClient() {
  const mockAuthMethod = () => Promise.reject(new Error('Supabase is not configured - check .env file'));
  
  const authHandler = {
    get(_target: any, prop: string) {
      if (prop === 'getSession' || prop === 'onAuthStateChange' || prop === 'signUp' || 
          prop === 'signInWithPassword' || prop === 'signOut' || prop === 'getUser' ||
          prop === 'signInWithOAuth' || prop === 'resetPasswordForEmail' || prop === 'updateUser') {
        console.error('[Supabase Error] Auth method called without configuration:', prop);
        return mockAuthMethod;
      }
      return authHandler;
    }
  };
  
  return new Proxy({} as any, {
    get(_target, prop) {
      if (prop === 'auth') return authHandler;
      if (prop === 'from' || prop === 'rpc') {
        console.error('[Supabase Error] Database method called without configuration:', String(prop));
        return () => ({ data: null, error: new Error('Supabase not configured') });
      }
      return () => Promise.reject(new Error('Supabase is not configured properly in .env'));
    }
  });
}

export interface ChildProfile {
  id: number | string;
  name: string;
  grade: string;
  school: string;
  created_at: string;
}

export interface DiaryEntry {
  id: number | string;
  date: string;
  subject: string;
  homework: string;
  teacher_comment: string;
  signed: boolean;
  created_at: string;
}

export interface Message {
  id: number | string;
  sender_type: 'parent' | 'teacher';
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: number | string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  created_at: string;
}
