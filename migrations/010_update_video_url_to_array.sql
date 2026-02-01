-- Update video_url to support multiple videos
-- Convert existing single video_url to array format

-- First, create a new column for the array
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS video_urls TEXT[];

-- Migrate existing video_url data to video_urls array
UPDATE workshops
SET video_urls = ARRAY[video_url]
WHERE video_url IS NOT NULL AND video_url != '';

-- Drop the old video_url column
ALTER TABLE workshops
DROP COLUMN IF EXISTS video_url;

-- Add comment
COMMENT ON COLUMN workshops.video_urls IS 'Array of video URLs (YouTube, Vimeo, etc.) showcasing the workshop';
