-- Update projects table to support new invoicing stage tasks
-- This migration replaces the generic 'project_setup_complete' task with specific actionable tasks

-- First, let's check if we need to update existing data
-- This query will update any existing stage_completion data to maintain the new structure

UPDATE projects
SET stage_completion = jsonb_set(
  COALESCE(stage_completion, '{}'::jsonb),
  '{invoicing}',
  COALESCE(stage_completion->'invoicing', '{}'::jsonb) || 
  CASE 
    WHEN stage_completion->'invoicing'->>'project_setup_complete' = 'true' THEN
      '{
        "client_contacts_documented": true,
        "project_folder_created": true,
        "internal_team_briefed": true,
        "event_details_confirmed": true
      }'::jsonb
    ELSE
      '{
        "client_contacts_documented": false,
        "project_folder_created": false,
        "internal_team_briefed": false,
        "event_details_confirmed": false
      }'::jsonb
  END - 'project_setup_complete'
)
WHERE stage_completion->'invoicing' ? 'project_setup_complete';

-- Remove the old project_setup_complete field from all records
UPDATE projects
SET stage_completion = stage_completion #- '{invoicing,project_setup_complete}'
WHERE stage_completion->'invoicing' ? 'project_setup_complete';

-- Add a comment to document the new structure
COMMENT ON COLUMN projects.stage_completion IS 
'JSON object tracking completion of tasks within each stage. 
Invoicing stage tasks:
- initial_invoice_sent: Send initial invoice (Net 30)
- final_invoice_sent: Send final invoice  
- kickoff_meeting_planned: Schedule kickoff meeting with client
- client_contacts_documented: Document all client contacts & roles
- project_folder_created: Create project folder & documentation
- internal_team_briefed: Brief internal team on project details
- event_details_confirmed: Confirm & document all event specifications';