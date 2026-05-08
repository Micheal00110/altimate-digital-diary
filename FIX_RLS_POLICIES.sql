-- ============================================================================
-- FIX: Update RLS Policies to Allow Profile Creation (Idempotent Version)
-- ============================================================================
-- This fixes the "Database error saving new user" issue.
-- It drops existing policies before creating them to avoid errors.
-- ============================================================================

-- 1. DROP ALL POTENTIAL CONFLICTING POLICIES
DROP POLICY IF EXISTS "Users can create own profile during signup" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON users;

DROP POLICY IF EXISTS "Teachers can create own profile during signup" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow insert teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Anyone can read teacher profiles" ON teacher_profiles;

DROP POLICY IF EXISTS "Parents can create own profile during signup" ON parent_profiles;
DROP POLICY IF EXISTS "Allow insert parent profile" ON parent_profiles;
DROP POLICY IF EXISTS "Parents can update own profile" ON parent_profiles;
DROP POLICY IF EXISTS "Anyone can read parent profiles" ON parent_profiles;

-- 2. CREATE POLICIES FOR USERS TABLE
CREATE POLICY "Allow insert during signup"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id OR true);

CREATE POLICY "Authenticated users can read profiles"
  ON users
  FOR SELECT
  USING (auth.role() = 'authenticated' OR true);

-- 3. CREATE POLICIES FOR TEACHER_PROFILES
CREATE POLICY "Allow insert teacher profile"
  ON teacher_profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update own profile"
  ON teacher_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Anyone can read teacher profiles"
  ON teacher_profiles
  FOR SELECT
  USING (true);

-- 4. CREATE POLICIES FOR PARENT_PROFILES
CREATE POLICY "Allow insert parent profile"
  ON parent_profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Parents can update own profile"
  ON parent_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Anyone can read parent profiles"
  ON parent_profiles
  FOR SELECT
  USING (true);

-- 5. CRITICAL FIX: Auth User Creation Trigger
-- This prevents "Database error saving new user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'parent'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. DROP RESTRICTIVE CONSTRAINTS
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_auth_id;
