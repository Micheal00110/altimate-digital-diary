import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://wtrgldptgxboymtxuqrc.supabase.co';
const supabaseAnonKey = 'sb_publishable_Bv15AxOCbzV2eqpAg-9cQQ_n3ettCVu';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  console.log('\n🔍 CHECKING SUPABASE CONNECTION & DATABASE SETUP\n');
  
  // Test 1: Basic connection
  console.log('1️⃣  Testing basic connection...');
  try {
    const { data, error } = await supabase.from('child_profile').select('*').limit(1);
    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log('   ✅ Connection successful!');
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
  }

  // Test 2: Check existing tables
  console.log('\n2️⃣  Checking tables...');
  const tablesToCheck = [
    'child_profile',
    'diary_entries',
    'messages',
    'announcements',
    'users',
    'teacher_profiles',
    'parent_profiles',
    'child_enrollments',
    'connection_requests',
    'message_threads',
    'entry_approvals',
    'sync_queue',
    'sync_conflicts'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.message.includes('does not exist')) {
        console.log(`   ❌ ${table} - NOT FOUND`);
      } else if (error) {
        console.log(`   ⚠️  ${table} - ${error.message}`);
      } else {
        console.log(`   ✅ ${table} - EXISTS`);
      }
    } catch (err) {
      console.log(`   ❌ ${table} - ERROR: ${err.message}`);
    }
  }

  console.log('\n3️⃣  Checking .env.local...');
  try {
    if (fs.existsSync('.env.local')) {
      console.log('   ✅ .env.local exists');
      const content = fs.readFileSync('.env.local', 'utf-8');
      if (content.includes('VITE_SUPABASE_URL') && content.includes('VITE_SUPABASE_ANON_KEY')) {
        console.log('   ✅ Required environment variables configured');
      } else {
        console.log('   ❌ Missing required environment variables');
      }
    } else {
      console.log('   ❌ .env.local does not exist');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  console.log('\n4️⃣  Checking migrations...');
  try {
    const migrationsDir = './supabase/migrations';
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir);
      console.log(`   ✅ Found ${files.length} migration files:`);
      files.forEach(f => console.log(`      - ${f}`));
    } else {
      console.log('   ❌ Migrations directory not found');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  console.log('\n✅ CONNECTION CHECK COMPLETE\n');
}

checkConnection();
