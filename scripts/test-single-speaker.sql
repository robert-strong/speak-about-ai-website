-- Debug speaker insertion issue

-- First, check what speakers currently exist
SELECT name, email, slug, active, listed FROM speakers ORDER BY name;

-- Check for email conflicts that might be causing unique constraint violations
SELECT email, COUNT(*) as count FROM speakers GROUP BY email HAVING COUNT(*) > 1;

-- Show total count
SELECT COUNT(*) as total_speakers FROM speakers;