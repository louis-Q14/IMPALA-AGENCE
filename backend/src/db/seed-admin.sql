-- Super Admin initial seed (role corrected to super_admin)
-- Email and password hash should be updated via the seed-admin.js script
-- or manually with a bcrypt hash generated from your chosen password.

INSERT INTO users (email, password_hash, full_name, role, status, is_verified)
VALUES (
  'louis.quatorze@impala-agence.com',
  '$2b$12$wLLJ3OGl4FmicMNUpY/ZJufc6hIJDW/5qezyko8TL4uQYsN8Gr1kK',
  'Louis-Quatorze',
  'super_admin',
  'approved',
  true
) ON CONFLICT (email) DO UPDATE SET role = 'super_admin', status = 'approved', is_verified = true;

-- Activate all services
INSERT INTO user_services (user_id, service_type, subscription_status)
SELECT u.id, s.type, 'active'
FROM users u, (VALUES ('real_estate'), ('auto'), ('trash')) AS s(type)
WHERE u.email = 'louis-quatorze@impala-agence.com'
ON CONFLICT DO NOTHING;
