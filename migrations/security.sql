-- Run once using a migration role before deploying the security update.
-- The runtime role needs SELECT/INSERT/UPDATE/DELETE on sessions and portfolio tables,
-- and USAGE on their sequences. It does not need CREATE/ALTER/DROP privileges.
BEGIN;
CREATE TABLE IF NOT EXISTS sessions (sid varchar PRIMARY KEY, sess jsonb NOT NULL, expire timestamp NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'finished';
SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 0) + 1, false);
CREATE INDEX IF NOT EXISTS page_views_timestamp_idx ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS project_clicks_timestamp_idx ON project_clicks(timestamp);
COMMIT;
-- Run retention maintenance separately, on a schedule, using scripts/retention.mjs.
