ALTER TABLE demo_staff_accounts DROP CONSTRAINT IF EXISTS demo_staff_accounts_role_key;
CREATE INDEX IF NOT EXISTS demo_staff_accounts_role ON demo_staff_accounts(role);
