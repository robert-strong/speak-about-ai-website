-- Make speakers.email nullable and clear the generated placeholder addresses.
-- 70 speakers (ids 161-232, the original import batch) carried
-- firstname-lastname@speakaboutai.com placeholders because the column was NOT NULL.
-- Nobody should have a Speak About AI address; a missing email is now NULL.
-- Backup of the cleared values: Web App/docs/speakers-placeholder-emails-2026-11-03.csv
-- Applied to production on 2026-11-03.

ALTER TABLE speakers ALTER COLUMN email DROP NOT NULL;

UPDATE speakers
SET email = NULL, updated_at = NOW()
WHERE email ILIKE '%@speakaboutai.com'
   OR email ILIKE '%@speakabout.ai';
