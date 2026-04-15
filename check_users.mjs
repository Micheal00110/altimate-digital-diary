import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
  console.log('Total users in public.users table:', data?.[0]?.count || 0);
  if (error) console.error('Error:', error.message);
}
check();
