-- Create firm_offers table
CREATE TABLE IF NOT EXISTS firm_offers (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id),
  access_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, completed

  -- Event Overview
  event_classification VARCHAR(50), -- virtual, local, travel
  company_name VARCHAR(255),
  end_client_name VARCHAR(255),
  event_name VARCHAR(500),
  event_date DATE,
  event_location VARCHAR(500),
  event_website VARCHAR(500),

  -- Billing Contact
  billing_contact_name VARCHAR(255),
  billing_contact_title VARCHAR(255),
  billing_contact_email VARCHAR(255),
  billing_contact_phone VARCHAR(50),
  billing_address TEXT,

  -- Logistics Contact
  logistics_contact_name VARCHAR(255),
  logistics_contact_email VARCHAR(255),
  logistics_contact_phone VARCHAR(50),

  -- Program Details
  speaker_name VARCHAR(255),
  program_topic VARCHAR(500),
  program_type VARCHAR(100),
  audience_size INTEGER,
  audience_demographics TEXT,
  speaker_attire VARCHAR(100),

  -- Schedule
  event_start_time TIME,
  event_end_time TIME,
  speaker_arrival_time TIME,
  program_start_time TIME,
  program_length_minutes INTEGER,
  qa_length_minutes INTEGER,
  timezone VARCHAR(50),
  detailed_timeline TEXT,

  -- Technical
  recording_allowed BOOLEAN DEFAULT false,
  recording_purpose VARCHAR(255),
  live_streaming BOOLEAN DEFAULT false,
  photography_allowed BOOLEAN DEFAULT false,
  tech_rehearsal_date DATE,
  tech_rehearsal_time TIME,

  -- Travel
  fly_in_date DATE,
  fly_out_date DATE,
  nearest_airport VARCHAR(255),
  airport_transport_provided BOOLEAN DEFAULT false,
  airport_transport_details TEXT,
  venue_transport_provided BOOLEAN DEFAULT false,
  venue_transport_details TEXT,
  hotel_name VARCHAR(255),
  hotel_address TEXT,
  hotel_dates_needed VARCHAR(255),
  hotel_tier_preference VARCHAR(100),
  meals_provided TEXT,
  dietary_requirements TEXT,

  -- Venue
  venue_name VARCHAR(500),
  venue_address TEXT,
  venue_contact_name VARCHAR(255),
  venue_contact_email VARCHAR(255),
  venue_contact_phone VARCHAR(50),

  -- Financial
  speaker_fee DECIMAL(10,2),
  travel_expenses_type VARCHAR(100),
  travel_expenses_amount DECIMAL(10,2),
  payment_terms VARCHAR(100),
  deposit_amount DECIMAL(10,2),
  deposit_due_date DATE,

  -- Additional
  green_room_available BOOLEAN DEFAULT false,
  meet_greet_opportunities TEXT,
  marketing_use_allowed BOOLEAN DEFAULT false,
  press_media_present BOOLEAN DEFAULT false,
  media_interview_requests TEXT,
  special_requests TEXT,

  -- Confirmation
  prep_call_requested BOOLEAN DEFAULT false,
  prep_call_date DATE,
  prep_call_time TIME,
  additional_notes TEXT,

  -- Tracking
  views INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add firm_offer_id to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS firm_offer_id INTEGER REFERENCES firm_offers(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_firm_offers_deal_id ON firm_offers(deal_id);
CREATE INDEX IF NOT EXISTS idx_firm_offers_access_token ON firm_offers(access_token);
CREATE INDEX IF NOT EXISTS idx_firm_offers_status ON firm_offers(status);
