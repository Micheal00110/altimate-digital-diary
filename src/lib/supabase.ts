import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || 'http://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface ChildProfile {
  id: number;
  name: string;
  grade: string;
  school: string;
  created_at: string;
}

export interface DiaryEntry {
  id: number;
  date: string;
  subject: string;
  homework: string;
  teacher_comment: string;
  signed: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  sender_type: 'parent' | 'teacher';
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  created_at: string;
}
