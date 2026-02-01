-- Create proposals table for client-facing proposals
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  
  -- Relationship to deals
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Proposal metadata
  proposal_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  version INTEGER DEFAULT 1,
  
  -- Client information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_company VARCHAR(255),
  client_title VARCHAR(255),
  
  -- Proposal content
  executive_summary TEXT,
  
  -- Speaker information (can have multiple speakers)
  speakers JSONB DEFAULT '[]'::jsonb, -- Array of speaker objects with details
  
  -- Event details
  event_title VARCHAR(255),
  event_date DATE,
  event_location VARCHAR(255),
  event_type VARCHAR(100),
  event_format VARCHAR(50) CHECK (event_format IN ('in-person', 'virtual', 'hybrid')),
  attendee_count INTEGER,
  event_description TEXT,
  
  -- Services & deliverables
  services JSONB DEFAULT '[]'::jsonb, -- Array of service objects
  deliverables JSONB DEFAULT '[]'::jsonb, -- Array of deliverable objects
  
  -- Investment details
  subtotal DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_investment DECIMAL(10, 2) NOT NULL,
  
  -- Payment terms
  payment_terms TEXT,
  payment_schedule JSONB DEFAULT '[]'::jsonb, -- Array of payment milestones
  
  -- Additional sections
  why_us TEXT,
  testimonials JSONB DEFAULT '[]'::jsonb, -- Array of relevant testimonials
  case_studies JSONB DEFAULT '[]'::jsonb, -- Array of relevant case studies
  terms_conditions TEXT,
  
  -- Validity
  valid_until DATE,
  
  -- Tracking
  access_token VARCHAR(255) UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  first_viewed_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  
  -- Acceptance
  accepted_at TIMESTAMP,
  accepted_by VARCHAR(255),
  acceptance_notes TEXT,
  rejected_at TIMESTAMP,
  rejected_by VARCHAR(255),
  rejection_reason TEXT,
  
  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

-- Create proposal_views table for tracking detailed view analytics
CREATE TABLE IF NOT EXISTS proposal_views (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- View details
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Session tracking
  session_id VARCHAR(255),
  time_spent_seconds INTEGER,
  sections_viewed JSONB DEFAULT '[]'::jsonb,
  
  -- Device info
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Location (if available)
  country VARCHAR(100),
  city VARCHAR(100)
);

-- Create proposal_comments table for client feedback
CREATE TABLE IF NOT EXISTS proposal_comments (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- Comment details
  commenter_name VARCHAR(255),
  commenter_email VARCHAR(255),
  comment_text TEXT NOT NULL,
  section VARCHAR(100), -- Which section the comment relates to
  
  -- Status
  resolved BOOLEAN DEFAULT false,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create proposal_attachments table
CREATE TABLE IF NOT EXISTS proposal_attachments (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- Attachment details
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  description TEXT,
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX idx_proposals_deal_id ON proposals(deal_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_client_email ON proposals(client_email);
CREATE INDEX idx_proposals_access_token ON proposals(access_token);
CREATE INDEX idx_proposals_created_at ON proposals(created_at);
CREATE INDEX idx_proposal_views_proposal_id ON proposal_views(proposal_id);
CREATE INDEX idx_proposal_views_session_id ON proposal_views(session_id);

-- Create function to generate proposal number
CREATE OR REPLACE FUNCTION generate_proposal_number() RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  proposal_count INTEGER;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Count proposals created this year
  SELECT COUNT(*) + 1 INTO proposal_count
  FROM proposals
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Format: PROP-YYYY-0001
  new_number := 'PROP-' || current_year || '-' || LPAD(proposal_count::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proposal_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_proposal_updated_at_trigger
BEFORE UPDATE ON proposals
FOR EACH ROW EXECUTE FUNCTION update_proposal_updated_at();

-- Add comments for documentation
COMMENT ON TABLE proposals IS 'Stores client-facing proposals with tracking and analytics';
COMMENT ON COLUMN proposals.speakers IS 'JSON array of speaker objects with name, bio, topics, fee, etc.';
COMMENT ON COLUMN proposals.services IS 'JSON array of service objects with name, description, duration, price';
COMMENT ON COLUMN proposals.deliverables IS 'JSON array of deliverable objects with name, description, timeline';
COMMENT ON COLUMN proposals.payment_schedule IS 'JSON array of payment milestone objects with amount, due date, description';
COMMENT ON COLUMN proposals.access_token IS 'Unique token for secure public access to proposal';