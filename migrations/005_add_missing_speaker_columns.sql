-- Add missing columns to speakers table
-- Add profile_views column for tracking page views
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Add status column for approval workflow (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'speakers' AND column_name = 'status') THEN
        ALTER TABLE speakers ADD COLUMN status VARCHAR(50) DEFAULT 'approved';
    END IF;
END $$;

-- Add listed column for controlling visibility
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS listed BOOLEAN DEFAULT true;

-- Add featured column for highlighting speakers
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add ranking column for sorting
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 0;

-- Add other useful columns from the interface
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS programs TEXT[];
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS industries TEXT[];
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS expertise TEXT[];
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS image_position VARCHAR(50) DEFAULT 'center';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS image_offset VARCHAR(50) DEFAULT '0%';

-- Update the unique constraint on slug to be conditional
ALTER TABLE speakers DROP CONSTRAINT IF EXISTS unique_speaker_slug;
ALTER TABLE speakers ADD CONSTRAINT unique_speaker_slug UNIQUE (slug);

-- Create/update indexes for better performance
DROP INDEX IF EXISTS idx_speakers_slug;
CREATE INDEX idx_speakers_slug ON speakers(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_speakers_active ON speakers(active);
CREATE INDEX IF NOT EXISTS idx_speakers_featured ON speakers(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_speakers_ranking ON speakers(ranking DESC);