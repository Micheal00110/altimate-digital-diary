import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get all migration files
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📋 Found ${migrationFiles.length} migrations`);
console.log('');

// Apply each migration
for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`⏳ Applying: ${file}`);
  
  try {
    const { error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error(`   ❌ Error:`, error.message);
      // Don't exit, continue with next migration
    } else {
      console.log(`   ✅ Applied successfully`);
    }
  } catch (err) {
    console.error(`   ❌ Exception:`, err.message);
    // Don't exit, continue with next migration
  }
  console.log('');
}

console.log('✨ Migration process complete!');
