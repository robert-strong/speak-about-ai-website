-- Add Google Calendar sync tracking to project tasks so a task with a due date
-- can be pushed to (and kept in sync with) the connected Google Calendar.
-- (project_tasks.due_date already exists from sql/create_project_tasks.sql)

ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500);
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);
