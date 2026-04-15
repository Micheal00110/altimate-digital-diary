import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert into child_profile...');
  const { data, error } = await supabase
    .from('child_profile')
    .insert([{ name: 'Test', grade: 'Test', school: 'Test' }])
    .select();
  
  if (error) {
    console.error('ERROR child_profile (singular):', error.message);
  } else {
    console.log('SUCCESS child_profile:', data);
  }

  console.log('Testing insert into child_profiles...');
  const { data: d2, error: e2 } = await supabase
    .from('child_profiles')
    .insert([{ name: 'Test', grade: 'Test', school: 'Test' }])
    .select();
  
  if (e2) {
    console.error('ERROR child_profiles (plural):', e2.message);
  } else {
    console.log('SUCCESS child_profiles:', d2);
  }
}

testInsert();
