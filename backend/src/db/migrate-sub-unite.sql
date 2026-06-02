-- Migration: add unite column to subscription_requests for currency tracking
ALTER TABLE subscription_requests
  ADD COLUMN IF NOT EXISTS unite VARCHAR(3) DEFAULT 'CDF';
