import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- DATABASE FINAL CHECK ---');
  
  const { data: profiles, error: pError } = await supabase.from('child_profiles').select('*').order('created_at', { ascending: false });
  console.log('Profiles in DB:', profiles?.length || 0);
  if (profiles && profiles.length > 0) {
    console.log('Latest Profile:', profiles[0]);
  }
  if (pError) console.error('Profile Fetch Error:', pError.message);

  const { data: users, error: uError } = await supabase.from('users').select('*');
  console.log('Users in DB:', users?.length || 0);
  if (uError) console.error('User Fetch Error:', uError.message);
}
check();
