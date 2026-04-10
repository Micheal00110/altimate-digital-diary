#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🚀 MyChild Diary - Database Setup Guide\n');
console.log('=' .repeat(70));

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`\n✅ Found ${migrationFiles.length} migration files:\n`);

// Combine all migrations
let allSql = '';

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  allSql += `\n\n-- ===== ${file} =====\n${sql}`;
  console.log(`   ✓ ${file}`);
}

console.log('\n' + '=' .repeat(70));
console.log('\n📋 INSTRUCTIONS:\n');
console.log('1. Open your Supabase project: https://supabase.com/dashboard');
console.log('2. Go to "SQL Editor" → "New Query"');
console.log('3. Copy ALL the SQL below and paste it into the editor');
console.log('4. Click "Run" to execute all migrations at once');
console.log('\n' + '=' .repeat(70));
console.log('\n🔧 COMPLETE DATABASE MIGRATION SQL:\n');
console.log(allSql);
console.log('\n' + '=' .repeat(70));
console.log('\n✨ After running, refresh your app (http://localhost:5176)\n');
