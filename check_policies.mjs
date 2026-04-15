import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- Checking Policies on child_profiles ---');
  // We can't query pg_policies easily via anon key unless exposed
  // But we can check if we can SELECT/INSERT
  
  const { data, error } = await supabase.from('child_profiles').select('*').limit(1);
  if (error) {
    console.error('SELECT Error:', error.message);
  } else {
    console.log('SELECT Success, found rows:', data.length);
  }

  const { error: insError } = await supabase.from('child_profiles').insert([{ name: 'Check Policy' }]);
  if (insError) {
    console.error('INSERT Error:', insError.message);
  } else {
    console.log('INSERT Success!');
  }
}
check();
