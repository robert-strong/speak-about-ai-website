-- Create index on speaker slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_speakers_slug ON speakers(slug);

-- Create index on speaker status and listed columns for filtering
CREATE INDEX IF NOT EXISTS idx_speakers_status_listed ON speakers(status, listed);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_speakers_slug_status_listed ON speakers(slug, status, listed);

-- Add index on featured for featured speakers queries
CREATE INDEX IF NOT EXISTS idx_speakers_featured ON speakers(featured);

-- Add index on ranking for sorting
CREATE INDEX IF NOT EXISTS idx_speakers_ranking ON speakers(ranking DESC);