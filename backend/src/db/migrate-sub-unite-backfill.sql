-- Backfill unite column: update existing subscription_requests rows
-- with the currency stored in service_formula_config for their service_type
UPDATE subscription_requests sr
SET unite = (
  SELECT sfc.config->>'unite'
  FROM service_formula_config sfc
  WHERE sfc.service = sr.service_type
    AND sfc.config->>'unite' IS NOT NULL
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM service_formula_config sfc
  WHERE sfc.service = sr.service_type
    AND sfc.config->>'unite' IS NOT NULL
);
