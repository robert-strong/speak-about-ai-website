-- Create deals table for CRM
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization_name VARCHAR(255),
  company VARCHAR(255),
  event_title VARCHAR(255),
  event_date DATE,
  event_location VARCHAR(255),
  deal_value DECIMAL(10,2),
  event_budget VARCHAR(50),
  status VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  specific_speaker TEXT,
  additional_info TEXT,
  wishlist_speakers JSONB,
  source VARCHAR(100) DEFAULT 'website_form',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_client_email ON deals(client_email);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

-- Create deal_speaker_interests table for tracking speaker preferences
CREATE TABLE IF NOT EXISTS deal_speaker_interests (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  speaker_id INTEGER,
  interest_type VARCHAR(50) DEFAULT 'wishlist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deal_speaker_deal ON deal_speaker_interests(deal_id);
CREATE INDEX idx_deal_speaker_speaker ON deal_speaker_interests(speaker_id);