-- Migration: add email verification columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS email_token_expires TIMESTAMP WITH TIME ZONE;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_users_email_token ON users(email_token) WHERE email_token IS NOT NULL;
