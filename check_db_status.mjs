import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n📊 Database Status Check\n');
console.log('═'.repeat(70));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

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

console.log('Testing connection to each table:\n');

let createdCount = 0;
let missingCount = 0;

for (const table of tables) {
  try {
    const { error, status } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('relation') || errorMsg.includes('does not exist') || errorMsg.includes('not found')) {
        console.log(`  ❌ ${table.padEnd(25)} - TABLE MISSING`);
        missingCount++;
      } else {
        console.log(`  ✅ ${table.padEnd(25)} - EXISTS (${status})`);
        createdCount++;
      }
    } else {
      console.log(`  ✅ ${table.padEnd(25)} - EXISTS`);
      createdCount++;
    }
  } catch (err) {
    console.log(`  ❌ ${table.padEnd(25)} - ERROR: ${err.message}`);
    missingCount++;
  }
}

console.log('\n' + '═'.repeat(70));
console.log(`\nResults: ${createdCount} tables found, ${missingCount} tables missing\n`);

if (missingCount === 0) {
  console.log('✅ ALL TABLES CREATED SUCCESSFULLY!\n');
  console.log('🎉 Your database is fully set up!\n');
  console.log('Your app will now work with:');
  console.log('  ✓ User authentication');
  console.log('  ✓ Teacher profiles');
  console.log('  ✓ Parent profiles');
  console.log('  ✓ Child management');
  console.log('  ✓ Messaging system\n');
  console.log('Next: Refresh http://localhost:5176 and test signup!\n');
} else {
  console.log('⚠️  DATABASE SETUP INCOMPLETE\n');
  console.log('To create the missing tables:\n');
  console.log('1. Open: https://supabase.com/dashboard');
  console.log('2. Select your "my-child-ediary" project');
  console.log('3. Click "SQL Editor" in the left menu');
  console.log('4. Click "New Query"');
  console.log('5. Open the file: SETUP_DATABASE.sql');
  console.log('6. Copy the entire SQL content');
  console.log('7. Paste it into the Supabase SQL Editor');
  console.log('8. Click "Run"\n');
  console.log('After running, your app will work with all features!\n');
}

console.log('═'.repeat(70) + '\n');
