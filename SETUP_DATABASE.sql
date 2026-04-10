-- ========================================================
-- MyChild Diary - Complete Database Migration
-- ========================================================
-- Apply this SQL in Supabase SQL Editor to set up all tables
-- ========================================================

-- ============================================
-- USERS TABLE (Core Authentication)
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- TEACHER PROFILE TABLE
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

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_verification ON teacher_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school ON teacher_profiles(school_name);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_grade ON teacher_profiles(class_grade);

-- ============================================
-- PARENT PROFILE TABLE
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

CREATE INDEX IF NOT EXISTS idx_parent_profiles_user_id ON parent_profiles(user_id);

-- ============================================
-- CHILD PROFILE (Updated with relations)
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

CREATE INDEX IF NOT EXISTS idx_child_profiles_name ON child_profiles(name);

-- ============================================
-- CHILD ENROLLMENT (Links child to parent & teacher)
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_child_enrollments_unique 
  ON child_enrollments(child_id, teacher_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_child_enrollments_status ON child_enrollments(status);

-- ============================================
-- CONNECTION REQUESTS
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
  responded_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_connection_requests_from ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_to ON connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_created ON connection_requests(created_at DESC);

-- ============================================
-- DIARY ENTRIES (Legacy)
-- ============================================
CREATE TABLE IF NOT EXISTS diary_entries (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  subject TEXT DEFAULT '',
  homework TEXT DEFAULT '',
  teacher_comment TEXT DEFAULT '',
  signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date DESC);

-- ============================================
-- MESSAGES & ANNOUNCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
  sender_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies (Public Access for MVP)
-- ============================================

-- Users table policies
CREATE POLICY IF NOT EXISTS "Users can create own profile during signup" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
  FOR SELECT USING (true);

-- Teacher profiles policies
CREATE POLICY IF NOT EXISTS "Teachers can create own profile during signup" ON teacher_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Teachers can update own profile" ON teacher_profiles
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Allow public access to teacher profiles" ON teacher_profiles
  FOR SELECT USING (true);

-- Parent profiles policies
CREATE POLICY IF NOT EXISTS "Parents can create own profile during signup" ON parent_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Parents can update own profile" ON parent_profiles
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Allow public access to parent profiles" ON parent_profiles
  FOR SELECT USING (true);

-- Child profiles policies
CREATE POLICY IF NOT EXISTS "Allow public access to child profiles" ON child_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Child enrollments policies
CREATE POLICY IF NOT EXISTS "Allow public access to child enrollments" ON child_enrollments
  FOR ALL USING (true) WITH CHECK (true);

-- Connection requests policies
CREATE POLICY IF NOT EXISTS "Allow public access to connection requests" ON connection_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Messages & Announcements policies
CREATE POLICY IF NOT EXISTS "Allow public access to messages"
  ON messages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public access to announcements"
  ON announcements FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public access to diary entries"
  ON diary_entries FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- Migration Complete ✅
-- All tables created and ready to use!
-- ========================================================
