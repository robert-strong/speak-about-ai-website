-- Create case_studies table
CREATE TABLE IF NOT EXISTS case_studies (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  logo_url TEXT,
  location VARCHAR(255),
  event_type VARCHAR(255),
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  testimonial TEXT NOT NULL,
  impact_points TEXT[] NOT NULL, -- Array of impact bullet points

  -- Display order
  display_order INTEGER DEFAULT 0,

  -- Status & Visibility
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create case_study_speakers junction table
CREATE TABLE IF NOT EXISTS case_study_speakers (
  id SERIAL PRIMARY KEY,
  case_study_id INTEGER REFERENCES case_studies(id) ON DELETE CASCADE,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique case_study_id + speaker_id combination
  UNIQUE(case_study_id, speaker_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_case_studies_active ON case_studies(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_case_studies_featured ON case_studies(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_case_studies_display_order ON case_studies(display_order);
CREATE INDEX IF NOT EXISTS idx_case_study_speakers_case_study ON case_study_speakers(case_study_id);
CREATE INDEX IF NOT EXISTS idx_case_study_speakers_speaker ON case_study_speakers(speaker_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_case_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_case_studies_updated_at ON case_studies;
CREATE TRIGGER trigger_update_case_studies_updated_at
  BEFORE UPDATE ON case_studies
  FOR EACH ROW
  EXECUTE FUNCTION update_case_studies_updated_at();
