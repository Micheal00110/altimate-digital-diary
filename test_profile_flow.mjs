import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFlow() {
  console.log('--- Simulating ProfileSetup.tsx ---');
  const { data: insertData, error: insertError } = await supabase
    .from('child_profiles')
    .insert([{ name: 'App Flow Test', grade: '4', school: 'Test School' }])
    .select();
  
  if (insertError) {
    console.error('ProfileSetup encountered an ERROR:', insertError.message);
    return;
  }
  console.log('ProfileSetup SUCCESS! Created:', insertData);
  
  console.log('\n--- Simulating App.tsx checkProfile ---');
  const { data: fetchData, error: fetchError } = await supabase
    .from('child_profiles')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('App.tsx load encountered an ERROR:', fetchError.message);
  } else {
    console.log('App.tsx load SUCCESS! Retrieved:', fetchData);
  }
}
testFlow();
