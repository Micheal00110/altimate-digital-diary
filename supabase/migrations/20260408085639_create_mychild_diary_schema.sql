/*
  # MyChild Diary Database Schema

  1. New Tables
    - `child_profile`
      - `id` (integer, primary key) - Unique identifier for the child
      - `name` (text) - Child's name
      - `grade` (text) - Child's grade/class
      - `school` (text) - School name
      - `created_at` (timestamp) - When the profile was created
    
    - `diary_entries`
      - `id` (integer, primary key) - Unique identifier for the entry
      - `date` (text) - Date of the diary entry in ISO format
      - `subject` (text) - Subject/topic
      - `homework` (text) - Homework details
      - `teacher_comment` (text) - Comments from teacher
      - `signed` (boolean) - Parent signature status
      - `created_at` (timestamp) - When the entry was created

  2. Security
    - Enable RLS on both tables
    - Allow public access for V1 (single-user offline-first app)
    
  3. Notes
    - One entry per date enforced via unique constraint
    - All text fields allow empty strings as defaults
    - Boolean defaults to false (unsigned)
*/

CREATE TABLE IF NOT EXISTS child_profile (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

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

ALTER TABLE child_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to child_profile"
  ON child_profile
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to diary_entries"
  ON diary_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date DESC);