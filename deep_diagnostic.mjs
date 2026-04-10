#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('\n' + '═'.repeat(80));
console.log('🔍 DEEP DIAGNOSTIC - Profile Creation Issue Analysis');
console.log('═'.repeat(80));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n📊 STEP 1: Test Direct User Profile Insertion');
console.log('─'.repeat(80));

// Try to insert a test user profile directly
try {
  const testUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test-diagnostic@example.com',
    name: 'Diagnostic Test',
    user_type: 'parent',
    is_active: true,
    email_verified: false
  };

  console.log('Attempting to insert:', JSON.stringify(testUser, null, 2));

  const { data, error } = await supabase
    .from('users')
    .insert(testUser)
    .select();

  if (error) {
    console.error('❌ INSERT FAILED:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    console.error('   Error Details:', error);
  } else {
    console.log('✅ INSERT SUCCEEDED');
    console.log('   Inserted:', data);
  }
} catch (err) {
  console.error('💥 Exception during insert:', err.message);
}

console.log('\n📊 STEP 2: Test SELECT from Users Table');
console.log('─'.repeat(80));

try {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ SELECT FAILED:', error.message);
  } else {
    console.log('✅ SELECT SUCCEEDED');
    console.log('   Found', data.length, 'user(s)');
    if (data.length > 0) {
      console.log('   First user:', JSON.stringify(data[0], null, 2));
    }
  }
} catch (err) {
  console.error('💥 Exception during select:', err.message);
}

console.log('\n📊 STEP 3: Check RLS Policies');
console.log('─'.repeat(80));

console.log('Current ANON key:', supabaseKey.substring(0, 30) + '...');
console.log('\nRLS Policies should allow:');
console.log('  ✓ INSERT: WITH CHECK (true)');
console.log('  ✓ SELECT: USING (true)');
console.log('  ✓ UPDATE: USING (true)');
console.log('\n⚠️  If INSERT is failing with RLS, the policy might be too restrictive');

console.log('\n📊 STEP 4: Check Table Schema');
console.log('─'.repeat(80));

try {
  // Try to get table info
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'nonexistent@test.com');

  if (error) {
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.error('❌ TABLE DOES NOT EXIST');
    } else {
      console.log('✅ TABLE EXISTS (query executed)');
    }
  } else {
    console.log('✅ TABLE EXISTS (no results but query succeeded)');
  }
} catch (err) {
  console.error('❌ Error checking table:', err.message);
}

console.log('\n📊 STEP 5: Test Auth User Creation');
console.log('─'.repeat(80));

try {
  const testEmail = `signup-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!@#';

  console.log('Attempting to sign up:', testEmail);

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'Test User',
        user_type: 'parent'
      }
    }
  });

  if (error) {
    console.error('❌ SIGNUP FAILED:', error.message);
  } else {
    if (data.user) {
      console.log('✅ SIGNUP SUCCEEDED');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Metadata:', data.user.user_metadata);

      console.log('\n📊 STEP 6: Try to Create Profile for Auth User');
      console.log('─'.repeat(80));

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'Test',
            user_type: data.user.user_metadata?.user_type || 'parent'
          })
          .select();

        if (profileError) {
          console.error('❌ PROFILE INSERT FAILED:');
          console.error('   Code:', profileError.code);
          console.error('   Message:', profileError.message);
          console.error('   Details:', profileError.details);
        } else {
          console.log('✅ PROFILE INSERT SUCCEEDED');
          console.log('   Profile created:', profileData);
        }
      } catch (err) {
        console.error('💥 Exception creating profile:', err.message);
      }
    }
  }
} catch (err) {
  console.error('💥 Exception during signup:', err.message);
}

console.log('\n' + '═'.repeat(80));
console.log('📋 SUMMARY & RECOMMENDATIONS');
console.log('═'.repeat(80));

console.log(`
Possible Issues to Check:

1. ❓ RLS POLICIES
   - Check if INSERT policy on 'users' table is correct
   - Verify: CREATE POLICY ... FOR INSERT WITH CHECK (true)
   - Go to: Supabase → Table Editor → users → RLS policies

2. ❓ ANON KEY PERMISSIONS
   - ANON key might not have permission for 'users' table
   - Solution: Disable RLS on 'users' table OR use SERVICE_ROLE key
   
3. ❓ COLUMN CONSTRAINTS
   - Check if NOT NULL columns are all provided
   - Verify: name, email, user_type are NOT NULL
   - Check for any unique constraints

4. ❓ TRIGGER OR FUNCTION
   - Supabase Auth might have a trigger that creates users
   - Check if 'users' is auto-synced with auth.users

5. ✅ RECOMMENDED FIX:
   - Option A: Disable RLS on 'users' table for MVP
   - Option B: Use proper RLS policies with authenticated() checks
   - Option C: Use SERVER role key for critical operations

Run this diagnostic and check the output above for errors!
`);

console.log('═'.repeat(80) + '\n');
