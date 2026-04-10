import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Verifying Database Setup\n');
console.log('=' .repeat(60));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log(`✓ Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`✓ Supabase Key: ${supabaseKey.substring(0, 30)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'users',
  'teacher_profiles',
  'parent_profiles',
  'child_profiles',
  'child_enrollments',
  'connection_requests',
  'diary_entries',
  'messages',
  'announcements'
];

console.log('Checking tables:\n');

let allTablesExist = true;

for (const table of tables) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('count(*)', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log(`❌ ${table}: NOT FOUND`);
        allTablesExist = false;
      } else {
        console.log(`⚠️  ${table}: Error - ${error.message}`);
      }
    } else {
      console.log(`✅ ${table}: EXISTS`);
    }
  } catch (err) {
    console.log(`❌ ${table}: ERROR - ${err.message}`);
    allTablesExist = false;
  }
}

console.log('\n' + '=' .repeat(60));

if (allTablesExist) {
  console.log('\n🎉 SUCCESS! All tables created!\n');
  console.log('Your database is fully set up:');
  console.log('  ✅ User authentication tables');
  console.log('  ✅ Teacher and parent profiles');
  console.log('  ✅ Child enrollment system');
  console.log('  ✅ Messaging system');
  console.log('\nYour app will now work with full features!\n');
} else {
  console.log('\n⚠️  Some tables are missing\n');
  console.log('To fix this:');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Go to SQL Editor → New Query');
  console.log('  4. Copy-paste the entire SETUP_DATABASE.sql file');
  console.log('  5. Click "Run"\n');
}

console.log('=' .repeat(60) + '\n');
