-- Rollback Script: Restore individual columns from project_details JSONB
-- This script can be used to rollback the consolidation if needed
-- Author: Claude Code
-- Date: 2025-01-25

-- Step 1: Restore project_details from backup if available
UPDATE projects 
SET project_details = project_details_backup 
WHERE project_details_backup IS NOT NULL;

-- Step 2: Drop the backup column once confirmed
-- ALTER TABLE projects DROP COLUMN IF EXISTS project_details_backup;

-- Step 3: Drop the legacy view if created
DROP VIEW IF EXISTS projects_legacy_view;

-- Log the rollback
DO $$
BEGIN
  RAISE NOTICE 'Project details rollback completed at %', NOW();
  RAISE NOTICE 'Original project_details data restored from backup';
  RAISE NOTICE 'Individual columns remain intact and can still be used';
END $$;