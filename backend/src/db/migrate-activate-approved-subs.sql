-- Backfill: activate user_services for all approved subscription_requests
-- that don't already have an active entry
INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT sr.user_id,
       CASE
         WHEN sr.service_type = 'immobilier' THEN 'real_estate'
         WHEN sr.service_type = 'automobile' THEN 'auto'
         ELSE sr.service_type
       END AS service_type,
       'active'
FROM subscription_requests sr
WHERE sr.status = 'approved'
  AND sr.service_type IN ('immobilier', 'automobile')
ON CONFLICT (user_id, service_type)
DO UPDATE SET subscription_status = 'active'
WHERE user_services.subscription_status <> 'active';

-- For immo-auto subscriptions, activate both real_estate and auto
INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT sr.user_id, svc.service_type, 'active'
FROM subscription_requests sr
CROSS JOIN (VALUES ('real_estate'), ('auto')) AS svc(service_type)
WHERE sr.status = 'approved'
  AND sr.service_type = 'immo-auto'
ON CONFLICT (user_id, service_type)
DO UPDATE SET subscription_status = 'active'
WHERE user_services.subscription_status <> 'active';
