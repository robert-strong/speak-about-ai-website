-- Add a 'pending_lost' holding stage for projects.
-- The email digester (or an admin) can flag a project as probably lost; it sits in
-- pending_lost until someone confirms (-> lost) or cancels (-> previous_status).
-- lib/pending-lost.ts applies the same statements at runtime, so this file is
-- the documented source of truth rather than a required manual step.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pending_lost_reason TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pending_lost_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
CHECK (status IN (
  '2plus_months', '1to2_months', 'less_than_month', 'final_week',
  'qualified', 'proposal',
  'contracts_signed', 'invoicing', 'logistics_planning', 'pre_event',
  'event_week', 'follow_up', 'completed', 'cancelled', 'lost',
  'invoicing_track', 'pending_lost'
));

CREATE INDEX IF NOT EXISTS idx_projects_pending_lost ON projects(pending_lost_at) WHERE status = 'pending_lost';
