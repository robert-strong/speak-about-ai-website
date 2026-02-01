-- Extend speakers table to include additional fields from Google Sheets
-- Run this before running the CSV migration

ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS programs TEXT,
ADD COLUMN IF NOT EXISTS listed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS industries JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ranking INTEGER,
ADD COLUMN IF NOT EXISTS image_position VARCHAR(50),
ADD COLUMN IF NOT EXISTS image_offset VARCHAR(50),
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;

-- Create index for slug lookup
CREATE INDEX IF NOT EXISTS idx_speakers_slug ON speakers(slug);

-- Create index for featured speakers
CREATE INDEX IF NOT EXISTS idx_speakers_featured ON speakers(featured);

-- Create index for ranking
CREATE INDEX IF NOT EXISTS idx_speakers_ranking ON speakers(ranking);