-- Fix accounts that are approved (status='approved') but phone_verified=false
-- This syncs phone_verified with is_verified for all approved accounts
UPDATE users
SET phone_verified = true
WHERE status = 'approved'
  AND (phone_verified IS NULL OR phone_verified = false);
