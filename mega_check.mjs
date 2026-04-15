import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- MEGA DATABASE CHECK ---');
  
  const tables = ['child_profile', 'child_profiles'];
  for (const table of tables) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
      if (error) {
        console.log(`Table [${table}]: Error - ${error.message}`);
      } else {
        console.log(`Table [${table}]: Rows = ${count}, Data =`, data);
      }
    } catch (e) {
      console.log(`Table [${table}]: Crash - ${e.message}`);
    }
  }
}
check();
