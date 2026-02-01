-- Create workshops table
CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL,
  description TEXT,
  short_description VARCHAR(500),
  duration_minutes INTEGER, -- Workshop duration in minutes
  format VARCHAR(50), -- 'virtual', 'in-person', 'hybrid'
  max_participants INTEGER,
  price_range VARCHAR(100), -- e.g., "$5,000 - $10,000"

  -- Workshop details
  learning_objectives TEXT[], -- Array of learning objectives
  target_audience VARCHAR(255), -- e.g., "Executives", "Developers", "General Audience"
  prerequisites TEXT,
  materials_included TEXT[],

  -- Content
  agenda TEXT, -- Workshop agenda/outline
  key_takeaways TEXT[],
  topics TEXT[], -- Array of topics covered

  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  image_urls TEXT[],

  -- Customization
  customizable BOOLEAN DEFAULT true,
  custom_options TEXT, -- Description of customization options

  -- SEO & Metadata
  meta_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT[],

  -- Status & Visibility
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on speaker_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_workshops_speaker_id ON workshops(speaker_id);

-- Create index on slug for URL lookups
CREATE INDEX IF NOT EXISTS idx_workshops_slug ON workshops(slug);

-- Create index on active workshops
CREATE INDEX IF NOT EXISTS idx_workshops_active ON workshops(active) WHERE active = true;

-- Create index on featured workshops
CREATE INDEX IF NOT EXISTS idx_workshops_featured ON workshops(featured) WHERE featured = true;

-- Create GIN index for topics search
CREATE INDEX IF NOT EXISTS idx_workshops_topics ON workshops USING GIN(topics);

-- Create GIN index for keywords search
CREATE INDEX IF NOT EXISTS idx_workshops_keywords ON workshops USING GIN(keywords);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workshops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_workshops_updated_at ON workshops;
CREATE TRIGGER trigger_update_workshops_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW
  EXECUTE FUNCTION update_workshops_updated_at();
