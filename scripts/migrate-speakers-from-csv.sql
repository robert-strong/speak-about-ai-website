-- Migration script to import speakers from Google Sheets export
-- This is a template - you'll need to customize the INSERT statements based on your actual data

-- INSTRUCTIONS:
-- 1. Export your Google Sheets as CSV
-- 2. Review the column mapping below and adjust as needed
-- 3. Replace the INSERT statements with your actual speaker data
-- 4. Run this in your Neon database console

-- EXAMPLE: If your CSV has columns like: Name, Email, Bio, Fee Range, Topics, etc.
-- You'll need to create INSERT statements for each speaker

-- Template INSERT statement (customize for each speaker):
-- INSERT INTO speakers (
--     name, 
--     email, 
--     bio, 
--     short_bio, 
--     one_liner, 
--     headshot_url, 
--     website,
--     social_media,
--     topics,
--     speaking_fee_range,
--     travel_preferences,
--     technical_requirements,
--     dietary_restrictions,
--     emergency_contact,
--     active,
--     email_verified
-- ) VALUES (
--     'Speaker Name',
--     'speaker@email.com',
--     'Full biography text...',
--     'Short bio for events',
--     'Memorable tagline',
--     'https://example.com/headshot.jpg',
--     'https://speakerwebsite.com',
--     '{"twitter": "@handle", "linkedin": "profile"}',
--     '["AI", "Machine Learning", "Technology"]',
--     '$5,000 - $15,000',
--     'Business class for flights over 3 hours',
--     'HDMI connection, wireless microphone',
--     'Vegetarian',
--     '{"name": "Emergency Contact", "phone": "+1234567890", "relationship": "Spouse"}',
--     true,
--     true  -- Set to true for existing speakers, false if they need to verify email
-- );

-- SAMPLE MIGRATION (replace with your actual data):

-- Example Speaker 1
INSERT INTO speakers (
    name, 
    email, 
    bio, 
    one_liner,
    speaking_fee_range,
    topics,
    active,
    email_verified
) VALUES (
    'Sample Speaker Name',
    'sample@example.com',
    'Sample biography - replace with real data',
    'Sample tagline',
    '$5,000 - $10,000',
    '["AI", "Technology"]',
    true,
    false  -- They'll need to set up password and verify email
);

-- Add more INSERT statements here for each speaker from your Google Sheets
-- ...

-- After importing speakers, you can update existing projects/deals to link them:
-- UPDATE projects SET speaker_id = (SELECT id FROM speakers WHERE LOWER(name) = LOWER(requested_speaker_name)) WHERE requested_speaker_name IS NOT NULL;
-- UPDATE deals SET speaker_id = (SELECT id FROM speakers WHERE LOWER(name) = LOWER(speaker_requested)) WHERE speaker_requested IS NOT NULL;