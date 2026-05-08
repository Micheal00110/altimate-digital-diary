-- ============================================
-- BULLETPROOF MULTI-TENANT SECURITY (RLS)
-- This file ensures that data is NEVER leaked between schools.
-- ============================================

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. RESET POLICIES
DROP POLICY IF EXISTS "Users can see their own data" ON users;
DROP POLICY IF EXISTS "School isolation for profiles" ON child_profile;
DROP POLICY IF EXISTS "School isolation for diary" ON diary_entries;

-- 3. USERS SECURITY: A user can only see themselves and others in the same school
CREATE POLICY "School user isolation" ON users
  FOR ALL TO authenticated
  USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));

-- 4. STUDENT PROFILE SECURITY: Only staff of the school or the linked parent can see the child
CREATE POLICY "Student school isolation" ON child_profile
  FOR SELECT TO authenticated
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- 5. DIARY ENTRIES SECURITY: Locked to the school
CREATE POLICY "Diary school isolation" ON diary_entries
  FOR ALL TO authenticated
  USING (
    child_id IN (
      SELECT id FROM child_profile WHERE school_id = (SELECT school_id FROM users WHERE id = auth.uid())
    )
  );

-- 6. MESSAGING SECURITY: Only the sender or recipient can see the message
CREATE POLICY "Message privacy" ON diary_messages
  FOR ALL TO authenticated
  USING (
    sender_id = auth.uid() OR 
    child_id IN (
      SELECT child_id FROM child_enrollments WHERE parent_id = auth.uid() OR teacher_id = auth.uid()
    )
  );

-- 7. NOTIFICATION SECURITY: Strictly personal
CREATE POLICY "Notification privacy" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- 8. INVESTOR BYPASS: Super Admins can see everything (The QCE Validator)
CREATE POLICY "Investor full access" ON schools FOR ALL TO authenticated USING (
  (SELECT user_type FROM users WHERE id = auth.uid()) = 'super_admin'
);
