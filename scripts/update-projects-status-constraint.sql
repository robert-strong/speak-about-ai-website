-- Update projects status CHECK constraint to include all workflow stages
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
CHECK (status IN (
  '2plus_months', '1to2_months', 'less_than_month', 'final_week',
  'contracts_signed', 'invoicing', 'logistics_planning', 'pre_event',
  'event_week', 'follow_up', 'completed', 'cancelled'
));
