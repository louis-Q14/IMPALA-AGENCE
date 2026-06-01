-- Reset super admin password to Impala@Admin2026!
UPDATE users
SET password_hash = '$2b$12$G61eLM4fghg4fSZNgXGN8OOukgw3qQSB6srYkxs11lIQnEFRPNx5i',
    role = 'super_admin',
    status = 'approved',
    is_verified = true
WHERE email = 'louis.quatorze@impala-agence.com';

-- If user doesn't exist yet, insert them
INSERT INTO users (email, password_hash, full_name, role, status, is_verified)
SELECT
  'louis.quatorze@impala-agence.com',
  '$2b$12$G61eLM4fghg4fSZNgXGN8OOukgw3qQSB6srYkxs11lIQnEFRPNx5i',
  'Louis-Quatorze',
  'super_admin',
  'approved',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'louis.quatorze@impala-agence.com'
);
