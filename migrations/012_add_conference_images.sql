-- Add images column to conferences table for storing event photos
-- This migration is safe to run multiple times (idempotent)

-- Add images column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conferences'
        AND column_name = 'images'
    ) THEN
        ALTER TABLE conferences
        ADD COLUMN images JSONB DEFAULT '[]';

        -- Add comment for documentation
        COMMENT ON COLUMN conferences.images IS 'Array of image objects with URLs, captions, and metadata for event photos';
    END IF;
END $$;

-- Add logo_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conferences'
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE conferences
        ADD COLUMN logo_url TEXT;

        COMMENT ON COLUMN conferences.logo_url IS 'Conference logo/brand image URL';
    END IF;
END $$;

-- Add banner_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conferences'
        AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE conferences
        ADD COLUMN banner_url TEXT;

        COMMENT ON COLUMN conferences.banner_url IS 'Conference banner/header image URL';
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conferences'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE conferences
        ADD COLUMN description TEXT;

        COMMENT ON COLUMN conferences.description IS 'Conference description for public display';
    END IF;
END $$;

-- Create index on images for faster queries
CREATE INDEX IF NOT EXISTS idx_conferences_images ON conferences USING GIN(images);

-- Example of images JSON structure:
-- [
--   {
--     "url": "https://blob.vercel-storage.com/...",
--     "caption": "Conference keynote 2024",
--     "year": 2024,
--     "order": 0,
--     "featured": true
--   },
--   {
--     "url": "https://blob.vercel-storage.com/...",
--     "caption": "Networking event",
--     "year": 2024,
--     "order": 1,
--     "featured": false
--   }
-- ]
