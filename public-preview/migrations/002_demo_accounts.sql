CREATE TABLE IF NOT EXISTS demo_staff_accounts (
 username text PRIMARY KEY,
 role text UNIQUE NOT NULL CHECK(role IN ('executive','frontdesk','dispatcher','fulfiller','supervisor','manager','finance','security','admin')),
 password_hash text NOT NULL,
 active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS demo_staff_sessions (
 digest text PRIMARY KEY,
 workspace_id uuid NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
 username text NOT NULL REFERENCES demo_staff_accounts(username) ON DELETE CASCADE,
 expires timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS demo_staff_session_expiry ON demo_staff_sessions(expires);
