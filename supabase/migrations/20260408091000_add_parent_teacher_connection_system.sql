/*
  Extended Schema for Parent-Teacher Connection System
  
  This migration adds all necessary tables for:
  1. User authentication & profiles (teachers, parents)
  2. Parent-teacher connections
  3. Enhanced messaging with threads
  4. Child enrollment tracking
  5. Offline sync support
  6. Verification & safety features
*/

-- ============================================
-- 1. USERS TABLE (Core Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'parent', 'admin')),
  name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- 2. TEACHER PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL DEFAULT '',
  school_name TEXT NOT NULL DEFAULT '',
  class_grade TEXT NOT NULL DEFAULT '',
  subject_specialization TEXT,
  years_of_experience INTEGER DEFAULT 0,
  bio TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_document_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_teacher_profiles_verification ON teacher_profiles(verification_status);
CREATE INDEX idx_teacher_profiles_school ON teacher_profiles(school_name);
CREATE INDEX idx_teacher_profiles_grade ON teacher_profiles(class_grade);

-- ============================================
-- 3. PARENT PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  relationship_to_child TEXT NOT NULL CHECK (relationship_to_child IN ('mother', 'father', 'guardian', 'other')),
  occupation TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_parent_profiles_user_id ON parent_profiles(user_id);

-- ============================================
-- 4. CHILD PROFILE (Updated with relations)
-- ============================================
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date TEXT,
  grade TEXT,
  school TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_child_profiles_name ON child_profiles(name);

-- ============================================
-- 5. CHILD ENROLLMENT (Links child to parent & teacher)
-- ============================================
CREATE TABLE IF NOT EXISTS child_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
  enrolled_date TIMESTAMPTZ DEFAULT now(),
  class_year TEXT NOT NULL DEFAULT '2025-2026',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_child_enrollments_unique 
  ON child_enrollments(child_id, teacher_id, parent_id);
CREATE INDEX idx_child_enrollments_status ON child_enrollments(status);

-- ============================================
-- 6. CONNECTION REQUESTS (Parent finds & connects to teacher)
-- ============================================
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_connection_requests_from ON connection_requests(from_user_id);
CREATE INDEX idx_connection_requests_to ON connection_requests(to_user_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);
CREATE INDEX idx_connection_requests_created ON connection_requests(created_at DESC);

-- ============================================
-- 7. MESSAGE THREADS (Conversation groups)
-- ============================================
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Conversation',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_message_threads_child ON message_threads(child_id);
CREATE INDEX idx_message_threads_teacher ON message_threads(teacher_id);
CREATE INDEX idx_message_threads_parent ON message_threads(parent_id);
CREATE INDEX idx_message_threads_archived ON message_threads(is_archived);
CREATE INDEX idx_message_threads_last_message ON message_threads(last_message_at DESC);

-- ============================================
-- 8. MESSAGES (Individual messages in threads)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('teacher', 'parent')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  read_by JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;
CREATE INDEX idx_messages_sync_status ON messages(sync_status);

-- ============================================
-- 9. DIARY ENTRIES (Updated with relations)
-- ============================================
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  morning_comment TEXT,
  afternoon_comment TEXT,
  activities TEXT,
  meals TEXT,
  naps TEXT,
  mood TEXT,
  attachment_urls TEXT[] DEFAULT ARRAY[]::text[],
  parent_signature_url TEXT,
  parent_comment TEXT,
  entry_status TEXT DEFAULT 'draft' CHECK (entry_status IN ('draft', 'published', 'signed_by_parent', 'archived')),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'conflict')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_diary_entries_unique 
  ON diary_entries(child_id, teacher_id, entry_date);
CREATE INDEX idx_diary_entries_child ON diary_entries(child_id);
CREATE INDEX idx_diary_entries_teacher ON diary_entries(teacher_id);
CREATE INDEX idx_diary_entries_date ON diary_entries(entry_date DESC);
CREATE INDEX idx_diary_entries_status ON diary_entries(entry_status);
CREATE INDEX idx_diary_entries_sync ON diary_entries(sync_status);

-- ============================================
-- 10. ENTRY APPROVALS (Track parent signatures)
-- ============================================
CREATE TABLE IF NOT EXISTS entry_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
  signature_image_url TEXT,
  comments TEXT,
  approved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entry_approvals_entry ON entry_approvals(entry_id);
CREATE INDEX idx_entry_approvals_parent ON entry_approvals(parent_id);

-- ============================================
-- 11. ANNOUNCEMENTS (Updated)
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  attachment_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_announcements_teacher ON announcements(teacher_id);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);

-- ============================================
-- 12. REPORTS (User safety & moderation)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ============================================
-- 13. BLOCKED USERS (Safety feature)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_blocked_users_unique 
  ON blocked_users(user_id, blocked_user_id);
CREATE INDEX idx_blocked_users_user ON blocked_users(user_id);

-- ============================================
-- 14. SYNC QUEUE (Offline sync tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at);

-- ============================================
-- 15. SYNC CONFLICTS (Track conflicts for resolution)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_queue_id UUID NOT NULL REFERENCES sync_queue(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  local_version JSONB NOT NULL,
  remote_version JSONB NOT NULL,
  server_version JSONB,
  resolution_type TEXT CHECK (resolution_type IN ('local', 'remote', 'merge', 'manual')),
  resolved_value JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_conflicts_sync_queue ON sync_conflicts(sync_queue_id);
CREATE INDEX idx_sync_conflicts_status ON sync_conflicts(resolved_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users table: Users can view their own profile + connected teachers/parents
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can create own profile during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Teacher profiles: Public read, teachers can update own, parents can view connected teachers
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view teacher profiles" ON teacher_profiles
  FOR SELECT USING (true);
CREATE POLICY "Teachers can create own profile during signup" ON teacher_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can update own profile" ON teacher_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Parent profiles: Parents can view own, teachers can view connected parents
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can create own profile during signup" ON parent_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents can update own profile" ON parent_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Diary entries: Only involved users can view
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers and parents can view relevant entries" ON diary_entries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM teacher_profiles WHERE teacher_id = auth.uid()
      UNION
      SELECT user_id FROM parent_profiles WHERE user_id = auth.uid()
    )
  );

-- Messages: Only thread participants can view
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their threads" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = thread_id
      AND (mt.teacher_id = auth.uid() OR mt.parent_id = auth.uid())
    )
  );

-- Announcements: Teachers can view own, parents can view from connected teachers
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view announcements" ON announcements
  FOR SELECT USING (true);

-- Connection requests: Only relevant users can view/modify
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their connection requests" ON connection_requests
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- Sync queue: Users can only see their own queue
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view own sync queue" ON sync_queue
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_profiles_updated_at BEFORE UPDATE ON parent_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_profiles_updated_at BEFORE UPDATE ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
