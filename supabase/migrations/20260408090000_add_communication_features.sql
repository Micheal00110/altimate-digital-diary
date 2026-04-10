/*
  Communication Features
  - Messages: Parent-teacher messaging
  - Announcements: School-wide announcements
  - Read status tracking
*/

-- Messages table for parent-teacher communication
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
  sender_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements table for school-wide announcements
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies for public access
CREATE POLICY "Allow public access to messages"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to announcements"
  ON announcements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);