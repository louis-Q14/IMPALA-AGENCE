-- Migration: add Google OAuth identifier to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- Unique index for Google account linkage
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
  ON users(google_id)
  WHERE google_id IS NOT NULL;
