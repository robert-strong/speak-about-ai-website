-- Add thumbnail_position column to workshops table
-- This allows controlling the focal point of thumbnail images when cropped

ALTER TABLE workshops ADD COLUMN IF NOT EXISTS thumbnail_position VARCHAR(50) DEFAULT 'center';

-- Add comment for documentation
COMMENT ON COLUMN workshops.thumbnail_position IS 'CSS object-position value for thumbnail image (e.g., center, top, bottom left)';
