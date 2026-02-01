-- Ensure all speaker fields are present in the database
-- This migration adds any missing fields to match the complete speaker profile

-- Add social media URL fields if they don't exist
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);

-- Add additional profile fields
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add fields for speaker management
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS listed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 0;

-- Add extended profile fields
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS programs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS industries JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;

-- Add speaker requirements and preferences
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS speaking_fee_range VARCHAR(100),
ADD COLUMN IF NOT EXISTS travel_preferences TEXT,
ADD COLUMN IF NOT EXISTS technical_requirements TEXT,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;

-- Add biography fields
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS short_bio VARCHAR(500),
ADD COLUMN IF NOT EXISTS one_liner VARCHAR(255);

-- Add media fields
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS headshot_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Add image positioning fields for display
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS image_position VARCHAR(50),
ADD COLUMN IF NOT EXISTS image_offset VARCHAR(50);

-- Add timestamps if they don't exist
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_speakers_slug ON speakers(slug);
CREATE INDEX IF NOT EXISTS idx_speakers_featured ON speakers(featured);
CREATE INDEX IF NOT EXISTS idx_speakers_ranking ON speakers(ranking);
CREATE INDEX IF NOT EXISTS idx_speakers_active ON speakers(active);
CREATE INDEX IF NOT EXISTS idx_speakers_listed ON speakers(listed);
CREATE INDEX IF NOT EXISTS idx_speakers_email ON speakers(email);

-- Create or replace the update timestamp trigger
CREATE OR REPLACE FUNCTION update_speakers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_speakers_updated_at_trigger ON speakers;
CREATE TRIGGER update_speakers_updated_at_trigger
BEFORE UPDATE ON speakers
FOR EACH ROW
EXECUTE FUNCTION update_speakers_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN speakers.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN speakers.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN speakers.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN speakers.youtube_url IS 'YouTube channel URL';
COMMENT ON COLUMN speakers.featured IS 'Whether speaker is featured on homepage';
COMMENT ON COLUMN speakers.active IS 'Whether speaker account is active';
COMMENT ON COLUMN speakers.listed IS 'Whether speaker is publicly listed';
COMMENT ON COLUMN speakers.ranking IS 'Display order ranking (higher = shown first)';
COMMENT ON COLUMN speakers.programs IS 'JSON array of speaking programs/talks';
COMMENT ON COLUMN speakers.topics IS 'JSON array of speaking topics';
COMMENT ON COLUMN speakers.industries IS 'JSON array of industry expertise';
COMMENT ON COLUMN speakers.videos IS 'JSON array of video objects with title, url, etc';
COMMENT ON COLUMN speakers.testimonials IS 'JSON array of testimonial objects';