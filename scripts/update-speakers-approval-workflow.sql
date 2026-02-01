-- Update existing speakers table to add approval workflow and additional fields
-- This migration enhances the basic speakers table with comprehensive profile management

-- Add approval workflow fields
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add professional information
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS years_speaking INTEGER,
ADD COLUMN IF NOT EXISTS total_engagements INTEGER;

-- Add availability and requirements
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS blackout_dates DATE[],
ADD COLUMN IF NOT EXISTS preferred_event_types TEXT[];

-- Add media URLs
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS speaker_reel_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS one_sheet_url VARCHAR(500);

-- Add internal tracking
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 5),
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS preferred_partner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Add fee structure (convert string range to min/max)
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS speaking_fee_min DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS speaking_fee_max DECIMAL(10, 2);

-- Add arrays for better organization
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS primary_topics TEXT[],
ADD COLUMN IF NOT EXISTS secondary_topics TEXT[],
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS industries_served TEXT[],
ADD COLUMN IF NOT EXISTS notable_clients TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS awards TEXT[];

-- Add search capabilities
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_speakers_status ON speakers(status);
CREATE INDEX IF NOT EXISTS idx_speakers_availability ON speakers(availability_status);
CREATE INDEX IF NOT EXISTS idx_speakers_topics ON speakers USING GIN(primary_topics);
CREATE INDEX IF NOT EXISTS idx_speakers_search ON speakers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_speakers_fee_range ON speakers(speaking_fee_min, speaking_fee_max);

-- Create testimonials table for speaker reviews
CREATE TABLE IF NOT EXISTS speaker_testimonials (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_title VARCHAR(255),
  client_company VARCHAR(255),
  testimonial_text TEXT NOT NULL,
  event_name VARCHAR(255),
  event_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP
);

-- Create speaker_documents table for additional materials
CREATE TABLE IF NOT EXISTS speaker_documents (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT true
);

-- Create speaker_engagements table to track speaking history
CREATE TABLE IF NOT EXISTS speaker_engagements (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  client_company VARCHAR(255),
  event_type VARCHAR(100),
  location VARCHAR(255),
  attendee_count INTEGER,
  speaker_fee DECIMAL(10, 2),
  commission_amount DECIMAL(10, 2),
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_speaker_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
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

-- Migrate existing topics from JSONB to TEXT array
UPDATE speakers 
SET primary_topics = ARRAY(SELECT jsonb_array_elements_text(topics))
WHERE topics IS NOT NULL AND jsonb_typeof(topics) = 'array';

-- Parse fee range string to min/max values
UPDATE speakers
SET 
  speaking_fee_min = CASE 
    WHEN speaking_fee_range LIKE '$%-%' THEN 
      CAST(REPLACE(SPLIT_PART(speaking_fee_range, '-', 1), '$', '') AS DECIMAL(10,2)) * 1000
    ELSE NULL
  END,
  speaking_fee_max = CASE 
    WHEN speaking_fee_range LIKE '$%-%' THEN 
      CAST(REPLACE(REPLACE(SPLIT_PART(speaking_fee_range, '-', 2), '$', ''), ',', '') AS DECIMAL(10,2)) * 1000
    ELSE NULL
  END
WHERE speaking_fee_range IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE speakers IS 'Speaker profiles with approval workflow and comprehensive tracking';
COMMENT ON COLUMN speakers.status IS 'Approval status: pending, approved, rejected, suspended';
COMMENT ON COLUMN speakers.primary_topics IS 'Main speaking topics migrated from topics JSONB';
COMMENT ON COLUMN speakers.search_vector IS 'Full-text search vector for speaker discovery';