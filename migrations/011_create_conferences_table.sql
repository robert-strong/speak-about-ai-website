-- Create conferences table for event industry conference directory
CREATE TABLE IF NOT EXISTS conferences (
  id SERIAL PRIMARY KEY,

  -- Basic Info
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  date TEXT, -- Using TEXT because dates vary in format (e.g., "25-28 April, 2026")
  location VARCHAR(500),
  organisation VARCHAR(500),
  link TEXT,

  -- Call for Papers/Speakers Info
  recurring BOOLEAN DEFAULT false,
  cfp_open BOOLEAN DEFAULT false,
  cfp_link TEXT,
  included_for_speaking TEXT,
  other_cfp_info TEXT,

  -- Contact Information
  contact_name VARCHAR(255),
  contact_role VARCHAR(255),
  contact_email VARCHAR(255),
  contact_linkedin TEXT,

  -- Additional Info
  notes TEXT,
  status VARCHAR(50) DEFAULT 'to_do', -- to_do, passed_watch, blocked

  -- Display & Visibility
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_conferences_active ON conferences(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_conferences_featured ON conferences(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_conferences_status ON conferences(status);
CREATE INDEX IF NOT EXISTS idx_conferences_slug ON conferences(slug);
CREATE INDEX IF NOT EXISTS idx_conferences_cfp_open ON conferences(cfp_open) WHERE cfp_open = true;
CREATE INDEX IF NOT EXISTS idx_conferences_recurring ON conferences(recurring) WHERE recurring = true;
CREATE INDEX IF NOT EXISTS idx_conferences_display_order ON conferences(display_order);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_conferences_search ON conferences
  USING gin(to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(organisation, '') || ' ' ||
    coalesce(location, '') || ' ' ||
    coalesce(notes, '')
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_conferences_updated_at ON conferences;
CREATE TRIGGER trigger_update_conferences_updated_at
  BEFORE UPDATE ON conferences
  FOR EACH ROW
  EXECUTE FUNCTION update_conferences_updated_at();

-- Add comments for documentation
COMMENT ON TABLE conferences IS 'Event industry conferences directory';
COMMENT ON COLUMN conferences.slug IS 'URL-friendly unique identifier generated from name';
COMMENT ON COLUMN conferences.date IS 'Conference date(s) in flexible text format';
COMMENT ON COLUMN conferences.cfp_open IS 'Whether Call for Papers/Speakers is currently open';
COMMENT ON COLUMN conferences.status IS 'Conference tracking status: to_do, passed_watch, or blocked';
COMMENT ON COLUMN conferences.recurring IS 'Whether this conference occurs annually/regularly';
