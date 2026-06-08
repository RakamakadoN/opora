-- Final Safe Migration for MVP Performance Optimization
-- Created on Monday, June 8, 2026

-- 1. Authentication Layer
-- Speeds up session analytics and cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_auth_sessions_created_at 
  ON auth_sessions(created_at);

-- 2. Children & Profiles Layer
-- Speeds up retrieval of all children linked to a specific parent (Main Screen)
CREATE INDEX IF NOT EXISTS idx_children_parent_id 
  ON children(parent_id);

-- 3. Doctor Interaction Layer
-- Speeds up searching for care requests from the parent's perspective
CREATE INDEX IF NOT EXISTS idx_doctor_care_requests_parent_id 
  ON doctor_care_requests(parent_id);

-- Speeds up display of incoming requests in the doctor's cabinet
CREATE INDEX IF NOT EXISTS idx_doctor_care_requests_doctor_id 
  ON doctor_care_requests(doctor_id);

-- Speeds up linking between a user profile and the doctor registry
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id 
  ON doctors(profile_id);

-- 4. Tracker & Diary Layer (High volume tables)
-- Speeds up filtering of progress entries by child ID
CREATE INDEX IF NOT EXISTS idx_child_progress_entries_child_id 
  ON child_progress_entries(child_id);

-- Speeds up sorting of the progress timeline (Newest first)
CREATE INDEX IF NOT EXISTS idx_child_progress_entries_created_at_desc 
  ON child_progress_entries(created_at DESC);

-- Speeds up filtering of private diary entries
CREATE INDEX IF NOT EXISTS idx_diary_entries_child_id 
  ON diary_entries(child_id);

-- Speeds up sorting of the diary timeline (Newest first)
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at_desc 
  ON diary_entries(created_at DESC);

-- 5. Directory Layer
-- Speeds up searching for institutions (PMPK, MSE) by city
CREATE INDEX IF NOT EXISTS idx_institution_guides_city 
  ON institution_guides(city);

/*
-- ROLLBACK SQL
-- Use the following commands to revert these changes:

DROP INDEX IF EXISTS idx_auth_sessions_created_at;
DROP INDEX IF EXISTS idx_children_parent_id;
DROP INDEX IF EXISTS idx_doctor_care_requests_parent_id;
DROP INDEX IF EXISTS idx_doctor_care_requests_doctor_id;
DROP INDEX IF EXISTS idx_doctors_profile_id;
DROP INDEX IF EXISTS idx_child_progress_entries_child_id;
DROP INDEX IF EXISTS idx_child_progress_entries_created_at_desc;
DROP INDEX IF EXISTS idx_diary_entries_child_id;
DROP INDEX IF EXISTS idx_diary_entries_created_at_desc;
DROP INDEX IF EXISTS idx_institution_guides_city;
*/
