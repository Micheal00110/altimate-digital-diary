-- Fix users table to make password_hash nullable
-- This allows the app to create user records without storing passwords
-- (Supabase Auth handles password storage separately)

ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- If the column doesn't exist yet, add it
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add RLS policies for user table operations
-- Allow users to create their own profile during signup
CREATE POLICY IF NOT EXISTS "Users can create own profile during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Add INSERT policies for profile tables
CREATE POLICY IF NOT EXISTS "Teachers can create own profile during signup" ON teacher_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Parents can create own profile during signup" ON parent_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure we have a way to reference Supabase auth users
-- This links the users table to auth.users
ALTER TABLE users
DROP CONSTRAINT IF EXISTS fk_users_auth_id;

ALTER TABLE users
ADD CONSTRAINT fk_users_auth_id 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

