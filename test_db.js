import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('diary_entries').select('child_id, attendance, behaviour_note').limit(1);
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Success! Columns exist.");
  }
}
test();
