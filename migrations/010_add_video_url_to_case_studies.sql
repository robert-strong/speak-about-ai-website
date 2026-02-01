-- Add video_url field to case_studies table
ALTER TABLE case_studies
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN case_studies.video_url IS 'URL to video (YouTube, Vimeo, etc.) showcasing the case study';
