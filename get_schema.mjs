import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- FETCHING TABLE INFO via RPC ---');
  // Supabase doesn't have a direct way to get schema via anon key easily if RLS is on,
  // but we can try to query information_schema if we have a way, or just guess from errors.
  // Alternatively, let's try to insert a row with a dummy field to see the error message which often reveals columns.
  const { error } = await supabase.from('child_profiles').insert([{ non_existent_column: 'test' }]);
  console.log('Error (should reveal schema):', error?.message);
}
check();
