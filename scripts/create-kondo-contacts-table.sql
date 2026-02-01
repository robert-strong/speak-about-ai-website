-- Create Kondo Contacts table for LinkedIn integration
CREATE TABLE IF NOT EXISTS kondo_contacts (
  id SERIAL PRIMARY KEY,
  kondo_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  linkedin_url TEXT,
  linkedin_uid VARCHAR(255),
  headline TEXT,
  location VARCHAR(255),
  picture_url TEXT,
  conversation_status VARCHAR(100),
  conversation_state VARCHAR(100),
  latest_message TEXT,
  latest_message_at TIMESTAMP,
  kondo_url TEXT,
  kondo_note TEXT,
  labels JSONB,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kondo_contacts_email ON kondo_contacts(email);
CREATE INDEX IF NOT EXISTS idx_kondo_contacts_linkedin_uid ON kondo_contacts(linkedin_uid);
CREATE INDEX IF NOT EXISTS idx_kondo_contacts_conversation_status ON kondo_contacts(conversation_status);
CREATE INDEX IF NOT EXISTS idx_kondo_contacts_labels ON kondo_contacts USING GIN (labels);

-- Add comment
COMMENT ON TABLE kondo_contacts IS 'Stores LinkedIn contacts synced from Kondo integration';
