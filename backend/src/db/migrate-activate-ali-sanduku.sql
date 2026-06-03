-- Direct activation for ALI SANDUKU JAFFER (user_id = 393d574b-07ce-461e-8783-caa70fe0f0de)
-- service: real_estate (immobilier subscription, approved/paid)
-- This migration is idempotent and safe to run multiple times

UPDATE user_services
SET subscription_status = 'active'
WHERE user_id = '393d574b-07ce-461e-8783-caa70fe0f0de'
  AND service_type = 'real_estate';

INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT '393d574b-07ce-461e-8783-caa70fe0f0de', 'real_estate', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM user_services
  WHERE user_id = '393d574b-07ce-461e-8783-caa70fe0f0de'
    AND service_type = 'real_estate'
);
