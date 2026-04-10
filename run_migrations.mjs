#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Database Migration Runner');
console.log('=' .repeat(50));
console.log('');

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in .env.local');
  console.error('   For migration execution, you need the SERVICE_ROLE_KEY');
  console.error('');
  console.error('📖 To get your service key:');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Select your project');
  console.error('   3. Go to Settings → API');
  console.error('   4. Copy the "service_role" key (SECRET - keep this safe!)');
  console.error('   5. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=<key>');
  process.exit(1);
}

// Read migration files
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📋 Found ${migrationFiles.length} migrations:\n`);
migrationFiles.forEach(f => console.log(`   - ${f}`));
console.log('');

async function runMigration(filename, sql) {
  const url = `${supabaseUrl}/rest/v1/rpc/`;
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Note: The above won't work without a custom RPC function
// Instead, provide instructions for manual application

console.log('⚠️  Important: Migrations must be applied manually via Supabase Dashboard\n');
console.log('To apply migrations to your Supabase database:\n');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project (my-child-ediary)');
console.log('3. Click "SQL Editor" in the left sidebar');
console.log('4. Click "New Query"');
console.log('5. Copy-paste the SQL from each migration file:');
console.log('');

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📄 ${file}`);
  console.log('-'.repeat(50));
  console.log(sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));
  console.log('');
}

console.log('\n✅ After pasting and running each migration in Supabase:');
console.log('   - The tables will be created in your database');
console.log('   - Your app will then be able to use them');
console.log('');
console.log('📌 Alternative: Use Supabase CLI (if installed):');
console.log('   npm install -g supabase');
console.log('   supabase db push');
