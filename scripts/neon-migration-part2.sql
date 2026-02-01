-- Update status constraints (run after part 1)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('2plus_months', '1to2_months', 'less_than_month', 'final_week', 'completed', 'cancelled'));

-- Update the default status
ALTER TABLE projects ALTER COLUMN status SET DEFAULT '2plus_months';