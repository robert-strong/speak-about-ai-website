-- Add slug column to speakers table if it doesn't exist
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Generate slugs for existing speakers based on their names
UPDATE speakers 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug unique but nullable (for backwards compatibility)
ALTER TABLE speakers ADD CONSTRAINT unique_speaker_slug UNIQUE (slug);

-- Update the index to include slug
DROP INDEX IF EXISTS idx_speakers_slug;
CREATE INDEX idx_speakers_slug ON speakers(slug) WHERE slug IS NOT NULL;