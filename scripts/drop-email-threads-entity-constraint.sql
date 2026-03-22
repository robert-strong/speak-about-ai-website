-- Drop the check_related_entity constraint that prevents storing emails
-- without a matching lead_id or deal_id. We need to store all emails
-- so they can be matched to projects by email address, keywords, etc.
ALTER TABLE email_threads DROP CONSTRAINT IF EXISTS check_related_entity;
