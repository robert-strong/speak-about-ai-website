-- Firm Offers Table
-- Stores detailed event information collected from clients after proposal acceptance

CREATE TABLE IF NOT EXISTS firm_offers (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'draft',

  -- All form data stored as JSONB for flexibility
  event_overview JSONB DEFAULT '{}',
  speaker_program JSONB DEFAULT '{}',
  event_schedule JSONB DEFAULT '{}',
  technical_requirements JSONB DEFAULT '{}',
  travel_accommodation JSONB DEFAULT '{}',
  additional_info JSONB DEFAULT '{}',
  financial_details JSONB DEFAULT '{}',
  confirmation JSONB DEFAULT '{}',

  -- Speaker Review
  speaker_access_token VARCHAR(64) UNIQUE,
  speaker_viewed_at TIMESTAMP WITH TIME ZONE,
  speaker_response_at TIMESTAMP WITH TIME ZONE,
  speaker_notes TEXT,
  speaker_confirmed BOOLEAN,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  sent_to_speaker_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_firm_offers_proposal_id ON firm_offers(proposal_id);
CREATE INDEX IF NOT EXISTS idx_firm_offers_speaker_token ON firm_offers(speaker_access_token);
CREATE INDEX IF NOT EXISTS idx_firm_offers_status ON firm_offers(status);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_firm_offers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_firm_offers_timestamp ON firm_offers;
CREATE TRIGGER trigger_update_firm_offers_timestamp
  BEFORE UPDATE ON firm_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_firm_offers_timestamp();
