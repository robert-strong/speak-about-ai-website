-- Migration: Add AI blog draft fields to blog_posts table
-- Date: 2025-01-27
-- Description: Extend blog_posts table to support AI-generated blog drafts

-- Add new columns for AI-generated blog drafts
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('file', 'url', 'outrank')),
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_filename TEXT,
ADD COLUMN IF NOT EXISTS speakers_mentioned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing source column to allow more values
ALTER TABLE blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_source_check;

-- Add comment for new fields
COMMENT ON COLUMN blog_posts.original_content IS 'Original article content before AI enhancement';
COMMENT ON COLUMN blog_posts.source_type IS 'Source of the article: file, url, or outrank';
COMMENT ON COLUMN blog_posts.source_url IS 'Original URL if article was fetched from web (e.g., SEMrush)';
COMMENT ON COLUMN blog_posts.source_filename IS 'Original filename if article was uploaded as file';
COMMENT ON COLUMN blog_posts.speakers_mentioned IS 'Number of speakers mentioned in enhanced content';
COMMENT ON COLUMN blog_posts.metadata IS 'Additional metadata in JSON format';

-- Create index for source_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_source_type ON blog_posts(source_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Update source column to allow NULL and default to 'ai-blog-writer' for new drafts
ALTER TABLE blog_posts ALTER COLUMN source DROP NOT NULL;
ALTER TABLE blog_posts ALTER COLUMN source SET DEFAULT 'ai-blog-writer';

-- Make published_date nullable for drafts
ALTER TABLE blog_posts ALTER COLUMN published_date DROP NOT NULL;
