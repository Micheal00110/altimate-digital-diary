import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: plural } = await supabase.from('child_profiles').select('*').order('created_at', { ascending: false });
  const { data: singular } = await supabase.from('child_profile').select('*').order('created_at', { ascending: false });
  
  console.log('--- DATABASE STATUS ---');
  console.log('Plural Profiles:', plural?.length || 0);
  console.log('Singular Profiles:', singular?.length || 0);
  if (plural?.[0]) console.log('Latest Plural:', plural[0].name, '(' + plural[0].created_at + ')');
  if (singular?.[0]) console.log('Latest Singular:', singular[0].name, '(' + singular[0].created_at + ')');
}
check();
