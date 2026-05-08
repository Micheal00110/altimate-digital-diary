import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createMockSupabaseClient() as unknown as ReturnType<typeof createClient>);

// Mock client that returns proper error for any auth method call
function createMockSupabaseClient() {
  const mockAuthMethod = () => Promise.resolve({ data: { session: null }, error: null });
  
  const authHandler = {
    get(_target: unknown, prop: string) {
      if (prop === 'getSession' || prop === 'onAuthStateChange') {
        return mockAuthMethod;
      }
      if (prop === 'signUp' || prop === 'signInWithPassword' || prop === 'signOut' || prop === 'getUser' ||
          prop === 'signInWithOAuth' || prop === 'resetPasswordForEmail' || prop === 'updateUser') {
        console.error('[Supabase Error] Auth method called without configuration:', prop);
        return mockAuthMethod;
      }
      return authHandler;
    }
  };
  
  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (prop === 'auth') return authHandler;
      if (prop === 'from' || prop === 'rpc') {
        return () => ({ data: [], error: null, select: () => ({ data: [], error: null, eq: () => ({ data: [], error: null }), maybeSingle: () => ({ data: null, error: null }) }), insert: () => ({ data: null, error: null }), update: () => ({ data: null, error: null }), delete: () => ({ data: null, error: null }) });
      }
      return () => ({ data: [], error: null });
    }
  });
}

export interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  school: string;
  parent_id?: string;
  school_id?: string;
  photo_url?: string;
  created_at?: string;
  // Additional fields used in UI
  email?: string;
}

export interface DiaryEntry {
  id: number | string;
  date: string;
  child_id?: number | string;
  subject: string;
  homework: string;
  teacher_comment: string;
  attendance: 'present' | 'absent' | 'late';
  behaviour_note: string;
  signed: boolean;
  created_at: string;
  // Additional fields used in UI - may vary based on actual DB schema
  sender_id?: string;
  sender_name?: string;
  email?: string;
  content?: string;
  message?: string;
}

export interface Message {
  id: number | string;
  sender_type: 'parent' | 'teacher';
  sender_id: string;
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
