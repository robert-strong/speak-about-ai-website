-- Create speakers table for managing speaker profiles
CREATE TABLE IF NOT EXISTS speakers (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(500),
  
  -- Professional Information
  title VARCHAR(255),
  company VARCHAR(255),
  bio TEXT NOT NULL,
  short_bio VARCHAR(500), -- For quick displays
  
  -- Speaking Topics
  primary_topics TEXT[], -- Array of main speaking topics
  secondary_topics TEXT[], -- Additional topics
  keywords TEXT[], -- Searchable keywords
  
  -- Media & Assets
  profile_photo_url VARCHAR(500),
  speaker_reel_url VARCHAR(500),
  one_sheet_url VARCHAR(500), -- Speaker one-sheet PDF
  
  -- Social Media
  linkedin_url VARCHAR(500),
  twitter_url VARCHAR(500),
  instagram_url VARCHAR(500),
  youtube_url VARCHAR(500),
  
  -- Speaking Requirements
  speaking_fee_min DECIMAL(10, 2),
  speaking_fee_max DECIMAL(10, 2),
  travel_requirements TEXT,
  technical_requirements TEXT,
  
  -- Availability
  availability_status VARCHAR(50) DEFAULT 'available', -- available, busy, unavailable
  blackout_dates DATE[],
  preferred_event_types TEXT[], -- keynote, workshop, panel, etc.
  
  -- Experience & Credentials
  years_speaking INTEGER,
  total_engagements INTEGER,
  industries_served TEXT[],
  notable_clients TEXT[],
  certifications TEXT[],
  awards TEXT[],
  
  -- Admin & Approval
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
  approval_notes TEXT,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  
  -- Internal Notes
  internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 5),
  internal_notes TEXT,
  preferred_partner BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5, 2) DEFAULT 20.00, -- Standard commission percentage
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  profile_views INTEGER DEFAULT 0,
  
  -- Search
  search_vector tsvector
);

-- Create indexes for performance
CREATE INDEX idx_speakers_email ON speakers(email);
CREATE INDEX idx_speakers_status ON speakers(status);
CREATE INDEX idx_speakers_availability ON speakers(availability_status);
CREATE INDEX idx_speakers_topics ON speakers USING GIN(primary_topics);
CREATE INDEX idx_speakers_search ON speakers USING GIN(search_vector);
CREATE INDEX idx_speakers_fee_range ON speakers(speaking_fee_min, speaking_fee_max);

-- Create testimonials table for speaker reviews
CREATE TABLE IF NOT EXISTS speaker_testimonials (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  
  -- Testimonial Details
  client_name VARCHAR(255) NOT NULL,
  client_title VARCHAR(255),
  client_company VARCHAR(255),
  testimonial_text TEXT NOT NULL,
  event_name VARCHAR(255),
  event_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Display Settings
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP
);

-- Create speaker_documents table for additional materials
CREATE TABLE IF NOT EXISTS speaker_documents (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  
  -- Document Details
  document_type VARCHAR(100) NOT NULL, -- presentation, bio, headshot, etc.
  document_name VARCHAR(255) NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT true
);

-- Create speaker_availability table for detailed scheduling
CREATE TABLE IF NOT EXISTS speaker_availability (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  
  -- Availability Details
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Ensure unique entries per speaker per date
  UNIQUE(speaker_id, date)
);

-- Create speaker_engagements table to track speaking history
CREATE TABLE IF NOT EXISTS speaker_engagements (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  
  -- Engagement Details
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  client_company VARCHAR(255),
  event_type VARCHAR(100),
  location VARCHAR(255),
  attendee_count INTEGER,
  
  -- Financial
  speaker_fee DECIMAL(10, 2),
  commission_amount DECIMAL(10, 2),
  
  -- Performance
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_speaker_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.primary_topics, ' '), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
CREATE TRIGGER update_speaker_search_vector_trigger
BEFORE INSERT OR UPDATE ON speakers
FOR EACH ROW EXECUTE FUNCTION update_speaker_search_vector();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_speaker_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_speaker_updated_at_trigger
BEFORE UPDATE ON speakers
FOR EACH ROW EXECUTE FUNCTION update_speaker_updated_at();

-- Add comments for documentation
COMMENT ON TABLE speakers IS 'Stores speaker profiles with approval workflow';
COMMENT ON COLUMN speakers.status IS 'Approval status: pending, approved, rejected, suspended';
COMMENT ON COLUMN speakers.primary_topics IS 'Main speaking topics as an array';
COMMENT ON COLUMN speakers.search_vector IS 'Full-text search vector for speaker discovery';
COMMENT ON COLUMN speakers.internal_rating IS 'Internal quality rating from 1-5';
COMMENT ON COLUMN speakers.preferred_partner IS 'Indicates if this is a preferred speaker partner';