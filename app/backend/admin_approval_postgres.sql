-- One-time update for the approval flow.
UPDATE users
SET role = 'viewer'
WHERE role = 'member';

ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'pending';

-- Optional manual admin seed:
-- UPDATE users SET role = 'admin' WHERE lower(email) = lower('your-email@example.com');
