-- Safe migration: activate user_services for all approved subscription_requests
-- Uses manual upsert to avoid dependency on UNIQUE constraint existence

-- First ensure the unique constraint exists (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_services_user_id_service_type_key'
      AND conrelid = 'user_services'::regclass
  ) THEN
    ALTER TABLE user_services ADD CONSTRAINT user_services_user_id_service_type_key UNIQUE (user_id, service_type);
  END IF;
EXCEPTION WHEN others THEN
  -- Ignore if constraint already exists under a different name or table doesn't exist
  NULL;
END
$$;

-- Activate real_estate for immobilier subscriptions
UPDATE user_services us
SET subscription_status = 'active'
FROM subscription_requests sr
WHERE sr.status = 'approved'
  AND sr.service_type IN ('immobilier', 'real_estate')
  AND us.user_id = sr.user_id
  AND us.service_type = 'real_estate';

-- Insert missing real_estate rows for immobilier/real_estate subscriptions
INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT DISTINCT sr.user_id, 'real_estate', 'active'
FROM subscription_requests sr
WHERE sr.status = 'approved'
  AND sr.service_type IN ('immobilier', 'real_estate')
  AND NOT EXISTS (
    SELECT 1 FROM user_services us2
    WHERE us2.user_id = sr.user_id AND us2.service_type = 'real_estate'
  );

-- Activate auto for automobile subscriptions
UPDATE user_services us
SET subscription_status = 'active'
FROM subscription_requests sr
WHERE sr.status = 'approved'
  AND sr.service_type IN ('automobile', 'auto')
  AND us.user_id = sr.user_id
  AND us.service_type = 'auto';

-- Insert missing auto rows
INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT DISTINCT sr.user_id, 'auto', 'active'
FROM subscription_requests sr
WHERE sr.status = 'approved'
  AND sr.service_type IN ('automobile', 'auto')
  AND NOT EXISTS (
    SELECT 1 FROM user_services us2
    WHERE us2.user_id = sr.user_id AND us2.service_type = 'auto'
  );

-- Activate both for immo-auto subscriptions
UPDATE user_services us
SET subscription_status = 'active'
FROM subscription_requests sr
CROSS JOIN (VALUES ('real_estate'), ('auto')) AS svc(service_type)
WHERE sr.status = 'approved'
  AND sr.service_type = 'immo-auto'
  AND us.user_id = sr.user_id
  AND us.service_type = svc.service_type;

INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT DISTINCT sr.user_id, svc.service_type, 'active'
FROM subscription_requests sr
CROSS JOIN (VALUES ('real_estate'), ('auto')) AS svc(service_type)
WHERE sr.status = 'approved'
  AND sr.service_type = 'immo-auto'
  AND NOT EXISTS (
    SELECT 1 FROM user_services us2
    WHERE us2.user_id = sr.user_id AND us2.service_type = svc.service_type
  );
