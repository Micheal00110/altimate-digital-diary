import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: d1 } = await supabase.from('child_profile').select('*');
  console.log('child_profile rows:', d1?.length);
  
  const { data: d2 } = await supabase.from('child_profiles').select('*');
  console.log('child_profiles rows:', d2?.length);
}
check();
