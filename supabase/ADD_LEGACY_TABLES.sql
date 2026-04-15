-- Legacy Tables for MVP (Simple Schema)
-- Run this in Supabase SQL Editor

-- Child Profile (singular - used in original migration)
CREATE TABLE IF NOT EXISTS child_profile (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diary Entries (Legacy)
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

-- Messages (Legacy)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
  sender_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements (Legacy)
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (only if not already enabled)
ALTER TABLE child_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public access to child_profile" ON child_profile;
DROP POLICY IF EXISTS "Allow public access to legacy diary_entries" ON diary_entries;
DROP POLICY IF EXISTS "Allow public access to messages" ON messages;
DROP POLICY IF EXISTS "Allow public access to announcements" ON announcements;

-- Public Access Policies
CREATE POLICY "Allow public access to child_profile" ON child_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to legacy diary_entries" ON diary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);