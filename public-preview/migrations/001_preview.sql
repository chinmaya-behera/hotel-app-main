CREATE TABLE IF NOT EXISTS demo_workspaces (
 id uuid PRIMARY KEY,
 session_digest text UNIQUE NOT NULL,
 data jsonb NOT NULL,
 version integer NOT NULL DEFAULT 1,
 expires timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS demo_workspaces_expiry ON demo_workspaces(expires);
CREATE TABLE IF NOT EXISTS demo_guest_codes (
 id uuid PRIMARY KEY,
 workspace_id uuid NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
 room text NOT NULL,
 email text NOT NULL,
 digest text NOT NULL,
 expires timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 sent boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS demo_codes_room ON demo_guest_codes(workspace_id,room);
CREATE TABLE IF NOT EXISTS demo_guest_sessions (
 digest text PRIMARY KEY,
 workspace_id uuid NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
 room text NOT NULL,
 email text NOT NULL,
 expires timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS demo_rate_limits (
 key text PRIMARY KEY,
 count integer NOT NULL,
 expires timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS demo_rates_expiry ON demo_rate_limits(expires);
