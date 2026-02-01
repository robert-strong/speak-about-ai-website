-- Migration: Create blog_posts table for Outrank webhook articles
-- Date: 2025-10-05
-- Description: Table to store blog articles received from Outrank webhook

-- Drop table if exists (use cautiously in production)
-- DROP TABLE IF EXISTS blog_posts CASCADE;

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    featured_image_url TEXT,
    published_date TIMESTAMP WITH TIME ZONE NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata fields
    outrank_id TEXT UNIQUE, -- Store the original ID from Outrank
    source TEXT DEFAULT 'outrank',
    
    -- Indexes for performance
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date ON blog_posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_outrank_id ON blog_posts(outrank_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE blog_posts IS 'Stores blog articles received from Outrank webhook';
COMMENT ON COLUMN blog_posts.outrank_id IS 'Original article ID from Outrank platform';
COMMENT ON COLUMN blog_posts.tags IS 'JSON array of article tags';
COMMENT ON COLUMN blog_posts.status IS 'Article status: draft, published, or archived';