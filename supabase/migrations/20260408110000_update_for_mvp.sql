/*
  # Update schema for MVP Phase 1
  
  1. Changes
    - Add `child_id` to `diary_entries` to support multiple students
    - Drop global `UNIQUE(date)` constraint
    - Add `UNIQUE(date, child_id)` constraint
    - Add `attendance` column
    - Add `behaviour_note` column
*/

-- Add new columns
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS child_id INTEGER REFERENCES child_profile(id);
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS attendance TEXT DEFAULT 'Present';
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS behaviour_note TEXT DEFAULT '';

-- Update constraints
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_date_key;
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_date_child_id_key;
ALTER TABLE diary_entries ADD CONSTRAINT diary_entries_date_child_id_key UNIQUE(date, child_id);
