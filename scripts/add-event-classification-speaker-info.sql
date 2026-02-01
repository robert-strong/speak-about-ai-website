-- Add event classification and speaker promotion fields
-- Add event_classification to replace the generic event_type
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS event_classification VARCHAR(20) 
CHECK (event_classification IN ('virtual', 'local', 'travel'));

-- Add speaker promotion fields
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS speaker_bio TEXT,
ADD COLUMN IF NOT EXISTS speaker_headshot_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS speaker_topics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS speaker_social_media JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS speaker_website VARCHAR(500),
ADD COLUMN IF NOT EXISTS speaker_one_liner VARCHAR(500),
ADD COLUMN IF NOT EXISTS promotional_materials JSONB DEFAULT '{}'::jsonb;

-- Add contracting and invoicing requirements
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS contract_requirements TEXT,
ADD COLUMN IF NOT EXISTS invoice_requirements TEXT,
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS contract_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS invoice_url VARCHAR(500);

-- Create speakers table for speaker hub
CREATE TABLE IF NOT EXISTS speakers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    short_bio VARCHAR(500),
    one_liner VARCHAR(255),
    headshot_url VARCHAR(500),
    website VARCHAR(500),
    social_media JSONB DEFAULT '{}'::jsonb,
    topics JSONB DEFAULT '[]'::jsonb,
    speaking_fee_range VARCHAR(100),
    travel_preferences TEXT,
    technical_requirements TEXT,
    dietary_restrictions TEXT,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    bank_details JSONB DEFAULT '{}'::jsonb, -- Encrypted in application layer
    tax_info JSONB DEFAULT '{}'::jsonb, -- Encrypted in application layer
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for speaker email lookup
CREATE INDEX IF NOT EXISTS idx_speakers_email ON speakers(email);

-- Create function to update speakers timestamp
CREATE OR REPLACE FUNCTION update_speakers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for speakers table
CREATE TRIGGER update_speakers_timestamp 
    BEFORE UPDATE ON speakers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_speakers_updated_at();

-- Add speaker_id reference to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS speaker_id INTEGER REFERENCES speakers(id);

-- Create index for speaker_id lookups
CREATE INDEX IF NOT EXISTS idx_projects_speaker_id ON projects(speaker_id);

-- Update existing event_type data to event_classification if needed
UPDATE projects 
SET event_classification = 
    CASE 
        WHEN event_type ILIKE '%virtual%' OR event_type ILIKE '%online%' OR event_type ILIKE '%webinar%' THEN 'virtual'
        WHEN travel_required = true THEN 'travel'
        ELSE 'local'
    END
WHERE event_classification IS NULL;

-- Sample speaker data (optional - uncomment to use)
/*
INSERT INTO speakers (email, name, bio, short_bio, one_liner, website, social_media, topics, speaking_fee_range)
VALUES (
    'speaker@speakaboutai.com',
    'AI Expert Speaker',
    'Full biography here...',
    'Short bio for event promotions',
    'Making AI accessible and actionable for everyone',
    'https://speakaboutai.com',
    '{"twitter": "@speakaboutai", "linkedin": "speakaboutai", "instagram": "@speakaboutai"}'::jsonb,
    '["Artificial Intelligence", "Machine Learning", "AI Ethics", "Future of Work", "Digital Transformation"]'::jsonb,
    '$5,000 - $25,000'
);
*/