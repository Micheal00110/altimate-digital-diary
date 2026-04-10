import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testing Database Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  console.log('📋 Checking tables...\n');

  // Test users table
  const { data: usersTest, error: usersError } = await supabase
    .from('users')
    .select('count(*)', { count: 'exact' })
    .limit(1);

  if (usersError) {
    console.error('❌ users table:', usersError.message);
  } else {
    console.log('✅ users table: EXISTS');
  }

  // Test teacher_profiles table
  const { data: teacherTest, error: teacherError } = await supabase
    .from('teacher_profiles')
    .select('count(*)', { count: 'exact' })
    .limit(1);

  if (teacherError) {
    console.error('❌ teacher_profiles table:', teacherError.message);
  } else {
    console.log('✅ teacher_profiles table: EXISTS');
  }

  // Test parent_profiles table
  const { data: parentTest, error: parentError } = await supabase
    .from('parent_profiles')
    .select('count(*)', { count: 'exact' })
    .limit(1);

  if (parentError) {
    console.error('❌ parent_profiles table:', parentError.message);
  } else {
    console.log('✅ parent_profiles table: EXISTS');
  }

  // Test child_profiles table
  const { data: childTest, error: childError } = await supabase
    .from('child_profiles')
    .select('count(*)', { count: 'exact' })
    .limit(1);

  if (childError) {
    console.error('❌ child_profiles table:', childError.message);
  } else {
    console.log('✅ child_profiles table: EXISTS');
  }

  console.log('\n' + '='.repeat(50));
  
  if (!usersError && !teacherError && !parentError && !childError) {
    console.log('✅ ALL TABLES CREATED SUCCESSFULLY!\n');
    console.log('🎉 Database setup is complete!');
    console.log('👉 Your app error should now be FIXED!\n');
    console.log('Next: Refresh http://localhost:5176 and try signing up');
  } else {
    console.log('⚠️  Some tables are missing. Please run SETUP_DATABASE.sql again.');
  }

} catch (err) {
  console.error('💥 Error:', err.message);
  process.exit(1);
}
