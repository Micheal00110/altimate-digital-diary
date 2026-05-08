-- ============================================================================
-- COMPREHENSIVE FIX FOR RLS & DATABASE ERRORS
-- Run this in Supabase Dashboard > SQL Editor
-- Idempotent - safe to run multiple times
-- ============================================================================

-- =============================================================================
-- STEP 1: FIX USERS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Allow insert during signup" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON users;
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;

-- Allow anyone to read (for demo purposes - restrict in production)
CREATE POLICY "Anyone can read users"
  ON users FOR SELECT USING (true);

-- Allow anyone to insert during signup
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT WITH CHECK (true);

-- Allow anyone to update
CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE USING (true);

-- =============================================================================
-- STEP 2: FIX SCHOOLS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can read schools" ON schools;
CREATE POLICY "Anyone can read schools"
  ON schools FOR SELECT USING (true);

-- =============================================================================
-- STEP 3: FIX CHILD_PROFILE TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can read child profiles" ON child_profile;
CREATE POLICY "Anyone can read child profiles"
  ON child_profile FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert child profiles" ON child_profile;
CREATE POLICY "Anyone can insert child profiles"
  ON child_profile FOR INSERT WITH CHECK (true);

-- =============================================================================
-- STEP 4: CREATE NOTIFICATIONS TABLE (if missing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for notifications
DROP POLICY IF EXISTS "Anyone can read notifications" ON notifications;
CREATE POLICY "Anyone can read notifications"
  ON notifications FOR SELECT USING (true);

-- =============================================================================
-- STEP 5: CREATE SCHOOL_ATTENDANCE_ANALYTICS TABLE (if missing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS school_attendance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  date DATE NOT NULL,
  attendance TEXT CHECK (attendance IN ('present', 'absent', 'late')),
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for attendance
DROP POLICY IF EXISTS "Anyone can read attendance" ON school_attendance_analytics;
CREATE POLICY "Anyone can read attendance"
  ON school_attendance_analytics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert attendance" ON school_attendance_analytics;
CREATE POLICY "Anyone can insert attendance"
  ON school_attendance_analytics FOR INSERT WITH CHECK (true);

-- =============================================================================
-- STEP 6: FIX AUTH TRIGGER (handle_new_user)
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'parent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- STEP 7: ENABLE RLS ON NEW TABLES
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_attendance_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 8: VERIFY
-- =============================================================================

SELECT 'Fix completed!' AS status;

-- =============================================================================
-- STEP 9: ADD PASSWORD RESET COLUMNS TO USERS
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_pending BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_otp TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_otp_expiry TIMESTAMPTZ;

-- =============================================================================
-- STEP 12: ADD MISSING COLUMNS TO PARENT_PROFILES
-- =============================================================================

ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;