-- Add comprehensive project details to projects table
-- This stores all event logistics, travel, venue, contacts, and requirements

-- Add project_details column to store comprehensive event information
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_details JSONB DEFAULT '{}';

-- Add completion tracking columns
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS details_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_critical_missing_info BOOLEAN DEFAULT true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_details_completion 
ON projects(details_completion_percentage);

CREATE INDEX IF NOT EXISTS idx_projects_critical_missing 
ON projects(has_critical_missing_info);

-- Create a function to extract specific details for reporting
CREATE OR REPLACE FUNCTION get_project_detail(project_id INTEGER, path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT project_details#>>string_to_array(path, '.')
    FROM projects
    WHERE id = project_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a view for quick overview of project completeness
CREATE OR REPLACE VIEW project_details_overview AS
SELECT 
  id,
  project_name,
  client_name,
  event_date,
  status,
  details_completion_percentage,
  has_critical_missing_info,
  project_details->>'overview' as overview_data,
  project_details->'venue'->>'name' as venue_name,
  project_details->'contacts'->'on_site'->>'name' as onsite_contact,
  project_details->'audience'->>'expected_size' as expected_attendance,
  project_details->'event_details'->>'event_title' as event_title
FROM projects
ORDER BY event_date ASC;

-- Sample update query (commented out, for reference)
-- UPDATE projects 
-- SET project_details = jsonb_set(
--   project_details,
--   '{overview,speaker_name}',
--   '"John Doe"'
-- )
-- WHERE id = 1;