-- Add missing columns to speakers table
-- Run this script in your Neon database console

-- Add contact and professional info
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS title VARCHAR(500),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Add social media URLs
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);

-- Generate slugs for existing speakers from their names
UPDATE speakers 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '.', ''), '''', ''))
WHERE slug IS NULL;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_speakers_slug ON speakers(slug);