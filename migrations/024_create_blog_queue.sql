-- Migration: Create blog_queue table for AI blog pipeline
-- Date: 2026-06-14
-- Description: Table to manage blog post queue from briefs to published articles

-- Create blog_queue table
CREATE TABLE IF NOT EXISTS blog_queue (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'drafted', 'created', 'error', 'archived')),

    -- Content fields
    brief TEXT NOT NULL,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    meta_description TEXT,
    body_path TEXT,
    body_content TEXT,

    -- Media
    image_prompt TEXT,
    hero_image_url TEXT,

    -- Categorization
    category TEXT CHECK (category IS NULL OR category IN ('AI Speakers', 'Event Planning', 'Industry Insights', 'Speaker Spotlight', 'Company News')),
    tags TEXT[],
    seo_keywords TEXT,

    -- Publishing
    published_date TIMESTAMP WITH TIME ZONE,
    display_title TEXT,
    speakers TEXT[],
    author_id TEXT DEFAULT '1VbdoaPazuvwGFuLwaZR6O',

    -- Output (after Contentful publish)
    contentful_entry_id TEXT,
    contentful_entry_url TEXT,

    -- Processing
    last_run TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    error_message TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_queue_status ON blog_queue(status);
CREATE INDEX IF NOT EXISTS idx_blog_queue_created_at ON blog_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_queue_published_date ON blog_queue(published_date);

-- Create trigger to auto-update updated_at
-- First check if the trigger function exists (created in migration 001)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ language 'plpgsql';
    END IF;
END $$;

CREATE TRIGGER update_blog_queue_updated_at
    BEFORE UPDATE ON blog_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE blog_queue IS 'Queue for AI-generated blog posts from briefs to published articles';
COMMENT ON COLUMN blog_queue.status IS 'Queue status: queued, processing, drafted, created, error, archived';
COMMENT ON COLUMN blog_queue.brief IS 'The original brief/prompt for article generation';
COMMENT ON COLUMN blog_queue.body_path IS 'Local file path to markdown body (for Python scripts)';
COMMENT ON COLUMN blog_queue.body_content IS 'Full markdown body content (alternative to body_path)';
COMMENT ON COLUMN blog_queue.contentful_entry_id IS 'Contentful entry ID after publishing';
COMMENT ON COLUMN blog_queue.contentful_entry_url IS 'URL to Contentful entry in CMS';
