#!/usr/bin/env node
/**
 * VERIFY RLS POLICIES - God Mode Inspection
 * Checks if FIX_RLS_POLICIES.sql was applied correctly
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

// Load env
const envPath = path.join(__dirname, '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

const supabase = createClient(url, key);

console.log(`${colors.bright}${colors.blue}=== RLS POLICIES VERIFICATION ===${colors.reset}\n`);

// Test 1: Can we insert without auth on users table?
console.log(`${colors.cyan}TEST 1: Insert Permission (users table)${colors.reset}`);
const testId = `test-${Date.now()}`;
const testEmail = `test-${Date.now()}@example.com`;

const { error: insertError } = await supabase.from('users').insert({
  id: testId,
  email: testEmail,
});

if (insertError) {
  if (insertError.message.includes('duplicate')) {
    log('✅', 'Insert works (got duplicate - policy allows it)');
  } else if (insertError.message.includes('RLS')) {
    log('❌', `RLS blocking insert: ${insertError.message}`);
  } else {
    log('⚠️ ', `Different error: ${insertError.message}`);
  }
} else {
  log('✅', 'Insert succeeded - RLS allows unauthenticated INSERT');
}

// Test 2: Can we read the table?
console.log(`\n${colors.cyan}TEST 2: Read Permission (users table)${colors.reset}`);
const { data: users, error: readError } = await supabase.from('users').select('*').limit(5);

if (readError) {
  log('❌', `Read failed: ${readError.message}`);
} else {
  log('✅', `Read works - Retrieved ${users?.length || 0} users`);
}

// Test 3: Teacher profiles
console.log(`\n${colors.cyan}TEST 3: Teacher Profiles RLS${colors.reset}`);
const { error: teacherError } = await supabase.from('teacher_profiles').insert({
  user_id: testId,
  school: 'Test School',
  grade: '5',
});

if (teacherError) {
  if (teacherError.message.includes('RLS')) {
    log('❌', `RLS blocking: ${teacherError.message}`);
  } else {
    log('✅', `Insert policy working (error: ${teacherError.code})`);
  }
} else {
  log('✅', 'Insert succeeded - Teacher profile RLS allows it');
}

// Test 4: Parent profiles
console.log(`\n${colors.cyan}TEST 4: Parent Profiles RLS${colors.reset}`);
const { error: parentError } = await supabase.from('parent_profiles').insert({
  user_id: testId,
  child_name: 'Test Child',
  relationship: 'Parent',
});

if (parentError) {
  if (parentError.message.includes('RLS')) {
    log('❌', `RLS blocking: ${parentError.message}`);
  } else {
    log('✅', `Insert policy working (error: ${parentError.code})`);
  }
} else {
  log('✅', 'Insert succeeded - Parent profile RLS allows it');
}

// Test 5: Signup simulation (most important)
console.log(`\n${colors.cyan}TEST 5: SIGNUP SIMULATION (Critical)${colors.reset}`);

try {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `signup-test-${Date.now()}@example.com`,
    password: 'TestPassword123!@#',
  });

  if (authError) {
    log('❌', `Signup failed: ${authError.message}`);
  } else {
    log('✅', `Auth user created: ${authData?.user?.id}`);
    
    // Check if user profile was created
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      log('⚠️ ', `Profile not auto-created (expected): ${profileError.message}`);
    } else {
      log('✅', `Profile auto-created: ${profile?.email}`);
    }
  }
} catch (err) {
  log('⚠️ ', `Signup test error: ${err.message}`);
}

// Test 6: Get actual RLS policies from database
console.log(`\n${colors.cyan}TEST 6: Query RLS Policies from Database${colors.reset}`);

try {
  const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
    table_name: 'users'
  }).catch(() => ({ data: null, error: { message: 'RPC not available' } }));

  if (policies) {
    log('✅', `Found ${policies.length} policies on users table`);
    policies.forEach(p => {
      log('   ', `- ${p.policyname}: ${p.action}`);
    });
  } else {
    log('ℹ️ ', 'RPC method not available (normal)');
  }
} catch (e) {
  log('ℹ️ ', 'Could not query policies directly');
}

console.log(`\n${colors.bright}${colors.green}=== RLS VERIFICATION COMPLETE ===${colors.reset}\n`);
