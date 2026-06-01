-- Migration: add OTP verification columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_otp VARCHAR(6),
  ADD COLUMN IF NOT EXISTS phone_otp_expires TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS phone_otp_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
