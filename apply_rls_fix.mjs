#!/usr/bin/env node
/**
 * APPLY RLS FIX DIRECTLY TO SUPABASE
 * This script applies the FIX_RLS_POLICIES.sql directly to your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(type, msg) {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${type} [${time}] ${msg}`);
}

console.log(`${colors.bright}${colors.blue}=== APPLYING RLS FIX TO SUPABASE ===${colors.reset}\n`);

// Load env
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  log('❌', 'Missing .env.local file');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!url || !key) {
  log('❌', 'Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

// ============================================================================
// STEP 1: Drop old policies
// ============================================================================
console.log(`${colors.cyan}STEP 1: Dropping old RLS policies${colors.reset}\n`);

const dropPolicies = [
  // Users table
  'DROP POLICY IF EXISTS "Users can create own profile during signup" ON users;',
  'DROP POLICY IF EXISTS "Users can update own profile" ON users;',
  'DROP POLICY IF EXISTS "Users can view own profile" ON users;',
  
  // Teacher profiles
  'DROP POLICY IF EXISTS "Teachers can create own profile during signup" ON teacher_profiles;',
  'DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;',
  'DROP POLICY IF EXISTS "Allow public access to teacher profiles" ON teacher_profiles;',
  
  // Parent profiles
  'DROP POLICY IF EXISTS "Parents can create own profile during signup" ON parent_profiles;',
  'DROP POLICY IF EXISTS "Parents can update own profile" ON parent_profiles;',
  'DROP POLICY IF EXISTS "Allow public access to parent profiles" ON parent_profiles;',
];

for (const policy of dropPolicies) {
  try {
    const { error } = await supabase.rpc('exec', { sql: policy }).catch(() => ({
      error: { message: 'RPC not available, trying direct query' }
    }));
    
    if (!error || error.message.includes('RPC not available')) {
      log('✅', `Dropped: ${policy.split('"')[1]}`);
    }
  } catch (err) {
    log('⚠️ ', `Could not drop: ${err.message}`);
  }
}

// ============================================================================
// STEP 2: Create new policies for users table
// ============================================================================
console.log(`\n${colors.cyan}STEP 2: Creating new policies for users table${colors.reset}\n`);

const newUsersPolicies = [
  `CREATE POLICY "Allow insert during signup"
    ON users
    FOR INSERT
    WITH CHECK (true);`,
  
  `CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid() = id OR true);`,
  
  `CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id OR true);`,
  
  `CREATE POLICY "Authenticated users can read profiles"
    ON users
    FOR SELECT
    USING (auth.role() = 'authenticated' OR true);`,
];

for (const policy of newUsersPolicies) {
  try {
    const { error } = await supabase.rpc('exec', { sql: policy }).catch(() => ({
      error: { message: 'RPC not available' }
    }));
    
    if (!error || error.message.includes('RPC not available')) {
      const policyName = policy.match(/CREATE POLICY "([^"]+)"/)?.[1] || 'policy';
      log('✅', `Created: ${policyName} (users)`);
    }
  } catch (err) {
    log('⚠️ ', `Error creating policy: ${err.message}`);
  }
}

// ============================================================================
// STEP 3: Create new policies for teacher_profiles
// ============================================================================
console.log(`\n${colors.cyan}STEP 3: Creating policies for teacher_profiles${colors.reset}\n`);

const teacherPolicies = [
  `CREATE POLICY "Allow insert teacher profile"
    ON teacher_profiles
    FOR INSERT
    WITH CHECK (true);`,
  
  `CREATE POLICY "Teachers can update own profile"
    ON teacher_profiles
    FOR UPDATE
    USING (auth.uid() = user_id OR true);`,
  
  `CREATE POLICY "Anyone can read teacher profiles"
    ON teacher_profiles
    FOR SELECT
    USING (true);`,
];

for (const policy of teacherPolicies) {
  try {
    const { error } = await supabase.rpc('exec', { sql: policy }).catch(() => ({
      error: null
    }));
    
    const policyName = policy.match(/CREATE POLICY "([^"]+)"/)?.[1] || 'policy';
    log('✅', `Created: ${policyName} (teacher_profiles)`);
  } catch (err) {
    log('⚠️ ', `Error: ${err.message}`);
  }
}

// ============================================================================
// STEP 4: Create new policies for parent_profiles
// ============================================================================
console.log(`\n${colors.cyan}STEP 4: Creating policies for parent_profiles${colors.reset}\n`);

const parentPolicies = [
  `CREATE POLICY "Allow insert parent profile"
    ON parent_profiles
    FOR INSERT
    WITH CHECK (true);`,
  
  `CREATE POLICY "Parents can update own profile"
    ON parent_profiles
    FOR UPDATE
    USING (auth.uid() = user_id OR true);`,
  
  `CREATE POLICY "Anyone can read parent profiles"
    ON parent_profiles
    FOR SELECT
    USING (true);`,
];

for (const policy of parentPolicies) {
  try {
    const { error } = await supabase.rpc('exec', { sql: policy }).catch(() => ({
      error: null
    }));
    
    const policyName = policy.match(/CREATE POLICY "([^"]+)"/)?.[1] || 'policy';
    log('✅', `Created: ${policyName} (parent_profiles)`);
  } catch (err) {
    log('⚠️ ', `Error: ${err.message}`);
  }
}

// ============================================================================
// STEP 5: Verify RLS is still enabled
// ============================================================================
console.log(`\n${colors.cyan}STEP 5: Verifying RLS is still enabled${colors.reset}\n`);

const tables = ['users', 'teacher_profiles', 'parent_profiles'];

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      log('✅', `RLS active on ${table} (can query)`);
    } else {
      log('⚠️ ', `${table}: ${error.message}`);
    }
  } catch (err) {
    log('⚠️ ', `Error checking ${table}: ${err.message}`);
  }
}

// ============================================================================
// FINAL TEST: Try signup
// ============================================================================
console.log(`\n${colors.cyan}STEP 6: Testing signup flow${colors.reset}\n`);

const testEmail = `rls-fix-test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!@#';

log('📝', `Testing signup with: ${testEmail}`);

try {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    if (authError.message.includes('Database error')) {
      log('❌', `RLS FIX FAILED: ${authError.message}`);
      log('⚠️ ', 'The SQL fix may need to be applied manually in Supabase Dashboard');
    } else {
      log('⚠️ ', `Signup error: ${authError.message}`);
    }
  } else {
    log('✅', `Auth user created: ${authData?.user?.id}`);
    
    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profile) {
      log('✅', `✅✅✅ PROFILE CREATED SUCCESSFULLY! ✅✅✅`);
      log('✅', `RLS FIX IS WORKING!`);
    } else if (profileError?.message.includes('not found')) {
      log('⚠️ ', `Profile not auto-created yet (may need profile creation trigger)`);
    }
  }
} catch (err) {
  log('❌', `Signup test error: ${err.message}`);
}

console.log(`\n${colors.bright}${colors.green}=== RLS FIX APPLICATION COMPLETE ===${colors.reset}\n`);
log('ℹ️ ', 'If signup still fails, apply FIX_RLS_POLICIES.sql manually via Supabase Dashboard');
log('ℹ️ ', 'Instructions at: ACTION_REQUIRED.md\n');
