-- Verify Noah's email for testing
UPDATE speakers 
SET email_verified = true 
WHERE email = 'noah@speakabout.ai';

-- Check the update
SELECT id, name, email, email_verified, password_hash IS NOT NULL as has_password 
FROM speakers 
WHERE email = 'noah@speakabout.ai';