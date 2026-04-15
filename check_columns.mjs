import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- Checking Column Definitions for child_profiles ---');
  // We can use a trick to get column names: SELECT * FROM table LIMIT 0
  const { data, error } = await supabase.from('child_profiles').select('*').limit(1);
  if (error) {
     console.error('Error fetching child_profiles sampled row:', error.message);
  } else {
     console.log('Columns found in child_profiles:', Object.keys(data[0] || {}));
  }
}
check();
